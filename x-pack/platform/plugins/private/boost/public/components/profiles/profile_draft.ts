/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { MAX_BOOST } from '../../../common/constants';
import type {
  BoostPeriod,
  BoostProfile,
  BoostProfileInput,
  BoostProfileType,
} from '../../../common/types';
import type { BoostRangeError, MaxAgeError, ProfileNameError } from '../../../common/validation';
import {
  formatMaxAgeDays,
  getBoostRangeError,
  getMaxAgeDaysError,
  getProfileNameError,
  parseMaxAgeDays,
} from '../../../common/validation';
import type { VcuRange } from '../../../common/vcu_estimate';
import { estimateDataStreamsVcuRange, estimateIndicesVcuRange } from '../../../common/vcu_estimate';

// Form fields hold strings so inputs can be empty or mid-edit; they're parsed on validation.

export interface BoostRangeDraft {
  minBoost: string;
  maxBoost: string;
}

export interface AgedPeriodDraft extends BoostRangeDraft {
  maxAgeDays: string;
}

export interface ProfileDraft {
  name: string;
  type: BoostProfileType;
  indices: BoostRangeDraft & { extraCopy: boolean; prewarm: boolean; pinned: boolean };
  dataStreams: { recent: AgedPeriodDraft; standard: AgedPeriodDraft; background: BoostRangeDraft };
}

export interface ProfileDraftErrors {
  name?: ProfileNameError;
  indicesRange?: BoostRangeError;
  recentRange?: BoostRangeError;
  recentMaxAge?: MaxAgeError;
  standardRange?: BoostRangeError;
  standardMaxAge?: MaxAgeError;
  backgroundRange?: BoostRangeError;
}

const toText = (value: number | undefined): string => (value === undefined ? '' : String(value));

const parseNumber = (value: string): number | undefined => {
  const parsed = Number(value);
  return value.trim() === '' || Number.isNaN(parsed) ? undefined : parsed;
};

const rangeDraft = ({ min_boost: min, max_boost: max }: BoostPeriod): BoostRangeDraft => ({
  minBoost: toText(min),
  maxBoost: toText(max),
});

const agedPeriodDraft = (period: BoostPeriod): AgedPeriodDraft => ({
  ...rangeDraft(period),
  maxAgeDays: toText(parseMaxAgeDays(period.max_age)),
});

const ELASTIC_NAME_PREFIX = 'elastic-';

/**
 * Suggests an unused name for a copy of a profile. Copies of Elastic-managed profiles drop the
 * `elastic-` prefix so they don't look Elastic-owned.
 */
export const getCopyName = (name: string, takenNames: readonly string[]): string => {
  const baseName = `${
    name.startsWith(ELASTIC_NAME_PREFIX) ? name.slice(ELASTIC_NAME_PREFIX.length) : name
  }-copy`;
  let candidate = baseName;
  for (let suffix = 2; takenNames.includes(candidate); suffix++) {
    candidate = `${baseName}-${suffix}`;
  }
  return candidate;
};

/** A new profile starts from the out-of-the-box Performant and Last 7 days values. */
export const createEmptyDraft = (): ProfileDraft => ({
  name: '',
  type: 'indices',
  indices: {
    minBoost: '1',
    maxBoost: String(MAX_BOOST),
    extraCopy: false,
    prewarm: false,
    pinned: false,
  },
  dataStreams: {
    recent: { minBoost: '1', maxBoost: String(MAX_BOOST), maxAgeDays: '1' },
    standard: { minBoost: '1', maxBoost: String(MAX_BOOST), maxAgeDays: '7' },
    background: { minBoost: '1', maxBoost: String(MAX_BOOST) },
  },
});

export const draftFromProfile = (profile: BoostProfile): ProfileDraft => {
  const draft = { ...createEmptyDraft(), name: profile.name, type: profile.type };

  if (profile.type === 'indices') {
    return {
      ...draft,
      indices: {
        ...rangeDraft(profile),
        extraCopy: profile.high_availability === 'one_extra_copy',
        prewarm: profile.prewarm,
        pinned: profile.pinned,
      },
    };
  }

  return {
    ...draft,
    dataStreams: {
      recent: agedPeriodDraft(profile.recent),
      standard: agedPeriodDraft(profile.standard),
      background: rangeDraft(profile.background),
    },
  };
};

const getRangeError = ({ minBoost, maxBoost }: BoostRangeDraft) =>
  getBoostRangeError(parseNumber(minBoost), parseNumber(maxBoost));

type ValueErrors = Omit<ProfileDraftErrors, 'name'>;

const getValueErrors = (draft: ProfileDraft): ValueErrors => {
  if (draft.type === 'indices') {
    return { indicesRange: getRangeError(draft.indices) };
  }

  const { recent, standard, background } = draft.dataStreams;
  const recentDays = parseNumber(recent.maxAgeDays);

  return {
    recentRange: getRangeError(recent),
    recentMaxAge: getMaxAgeDaysError(recentDays),
    standardRange: getRangeError(standard),
    standardMaxAge: getMaxAgeDaysError(parseNumber(standard.maxAgeDays), recentDays),
    backgroundRange: getRangeError(background),
  };
};

/** Returns only the errors that apply to the draft's profile type. */
export const getDraftErrors = (
  draft: ProfileDraft,
  takenNames: readonly string[]
): ProfileDraftErrors => ({
  name: getProfileNameError(draft.name, takenNames),
  ...getValueErrors(draft),
});

export const hasDraftErrors = (errors: ProfileDraftErrors): boolean =>
  Object.values(errors).some((error) => error !== undefined);

const toRange = ({ minBoost, maxBoost }: BoostRangeDraft) => ({
  minBoost: Number(minBoost),
  maxBoost: Number(maxBoost),
});

/** Estimates the draft's search VCU range, or returns `undefined` while its values are invalid. */
export const getDraftEstimate = (draft: ProfileDraft): VcuRange | undefined => {
  if (hasDraftErrors(getValueErrors(draft))) {
    return undefined;
  }

  if (draft.type === 'indices') {
    const { extraCopy, prewarm, pinned } = draft.indices;
    return estimateIndicesVcuRange({ ...toRange(draft.indices), extraCopy, prewarm, pinned });
  }

  const { recent, standard, background } = draft.dataStreams;
  return estimateDataStreamsVcuRange({
    recent: { ...toRange(recent), maxAgeDays: Number(recent.maxAgeDays) },
    standard: { ...toRange(standard), maxAgeDays: Number(standard.maxAgeDays) },
    background: toRange(background),
  });
};

const toPeriod = ({ minBoost, maxBoost }: BoostRangeDraft): BoostPeriod => ({
  min_boost: Number(minBoost),
  max_boost: Number(maxBoost),
});

/** Converts a draft that passed validation into an API payload. */
export const draftToProfileInput = (draft: ProfileDraft): BoostProfileInput => {
  if (draft.type === 'indices') {
    const { extraCopy, prewarm, pinned } = draft.indices;
    return {
      type: 'indices',
      name: draft.name,
      ...toPeriod(draft.indices),
      high_availability: extraCopy ? 'one_extra_copy' : 'none',
      prewarm,
      pinned,
    };
  }

  const { recent, standard, background } = draft.dataStreams;
  return {
    type: 'data_streams',
    name: draft.name,
    recent: { ...toPeriod(recent), max_age: formatMaxAgeDays(Number(recent.maxAgeDays)) },
    standard: { ...toPeriod(standard), max_age: formatMaxAgeDays(Number(standard.maxAgeDays)) },
    background: toPeriod(background),
  };
};
