/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { MAX_BOOST } from './constants';
import type {
  AdvancedModeDefaults,
  BoostPeriod,
  BoostProfile,
  BoostRule,
  BoostSettings,
  DataStreamsBoostProfile,
  DataStreamsWindowId,
  IndicesPresetId,
  SimpleModeDefaults,
} from './types';

export const BUILTIN_INDICES_PROFILE_NAMES: Readonly<Record<IndicesPresetId, string>> = {
  on_demand: 'elastic-on-demand',
  performant: 'elastic-performant',
  high_availability: 'elastic-high-availability',
};

export const BUILTIN_DATA_STREAMS_PROFILE_NAMES: Readonly<Record<DataStreamsWindowId, string>> = {
  last_1_day: 'elastic-last-1-day',
  last_3_days: 'elastic-last-3-days',
  last_7_days: 'elastic-last-7-days',
};

export const DEFAULT_INDICES_RULE_NAME = 'elastic-default-indices';
export const DEFAULT_DATA_STREAMS_RULE_NAME = 'elastic-default-data-streams';

export const DEFAULT_SIMPLE_MODE_DEFAULTS: SimpleModeDefaults = {
  indices: 'performant',
  data_streams: { window: 'last_7_days' },
};

const createWindowPeriods = (
  maxAge: string
): Pick<DataStreamsBoostProfile, 'recent' | 'standard' | 'background'> => {
  const boostedPeriod: BoostPeriod = { min_boost: 1, max_boost: MAX_BOOST, max_age: maxAge };

  return {
    recent: boostedPeriod,
    standard: boostedPeriod,
    background: { min_boost: 1, max_boost: MAX_BOOST },
  };
};

// Boost values are placeholders pending pricing review. Indices presets follow the ES3 Search Power
// cutover mapping, capped at the API maximum; data stream windows (1, 3, or 7 days) are also subject
// to change.
export const BUILTIN_PROFILES: readonly BoostProfile[] = [
  {
    name: BUILTIN_INDICES_PROFILE_NAMES.on_demand,
    type: 'indices',
    is_builtin: true,
    min_boost: 0.28,
    max_boost: 1,
    high_availability: 'none',
    prewarm: false,
    pinned: false,
  },
  {
    name: BUILTIN_INDICES_PROFILE_NAMES.performant,
    type: 'indices',
    is_builtin: true,
    min_boost: 1,
    max_boost: MAX_BOOST,
    high_availability: 'none',
    prewarm: false,
    pinned: false,
  },
  {
    name: BUILTIN_INDICES_PROFILE_NAMES.high_availability,
    type: 'indices',
    is_builtin: true,
    min_boost: 2.5,
    max_boost: MAX_BOOST,
    high_availability: 'one_extra_copy',
    prewarm: true,
    pinned: true,
  },
  {
    name: BUILTIN_DATA_STREAMS_PROFILE_NAMES.last_1_day,
    type: 'data_streams',
    is_builtin: true,
    ...createWindowPeriods('1d'),
  },
  {
    name: BUILTIN_DATA_STREAMS_PROFILE_NAMES.last_3_days,
    type: 'data_streams',
    is_builtin: true,
    ...createWindowPeriods('3d'),
  },
  {
    name: BUILTIN_DATA_STREAMS_PROFILE_NAMES.last_7_days,
    type: 'data_streams',
    is_builtin: true,
    ...createWindowPeriods('7d'),
  },
];

/** Translates simple-mode defaults into the profiles referenced by the two default rules. */
export const translateSimpleDefaults = ({
  indices,
  data_streams: dataStreams,
}: SimpleModeDefaults): AdvancedModeDefaults => ({
  indices_profile: BUILTIN_INDICES_PROFILE_NAMES[indices],
  data_streams_profile: BUILTIN_DATA_STREAMS_PROFILE_NAMES[dataStreams.window],
});

/** Returns the profiles the default rules reference in the current mode. */
export const getEffectiveDefaults = ({
  mode,
  simple,
  advanced,
}: BoostSettings): AdvancedModeDefaults =>
  mode === 'advanced' && advanced ? advanced : translateSimpleDefaults(simple);

export const createDefaultRules = ({
  indices_profile: indicesProfile,
  data_streams_profile: dataStreamsProfile,
}: AdvancedModeDefaults): BoostRule[] => [
  {
    name: DEFAULT_INDICES_RULE_NAME,
    index_pattern: '*',
    boost_profile: indicesProfile,
    priority: 0,
    is_builtin: true,
  },
  {
    name: DEFAULT_DATA_STREAMS_RULE_NAME,
    index_pattern: '*',
    boost_profile: dataStreamsProfile,
    priority: 0,
    is_builtin: true,
  },
];
