/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { MAX_BOOST, MIN_BOOST } from './constants';

// Rules mirror the Elasticsearch `_boost` API. The form and the server both use these checks, and
// each maps the returned codes to its own messages.

export const PROFILE_NAME_MAX_LENGTH = 255;
export const MAX_AGE_MAX_DAYS = 3650;

export type ProfileNameError = 'required' | 'too_long' | 'invalid_characters' | 'already_exists';

export type BoostRangeError =
  | 'min_required'
  | 'max_required'
  | 'min_out_of_range'
  | 'max_out_of_range'
  | 'max_not_positive'
  | 'max_below_min';

export type MaxAgeError = 'required' | 'out_of_range' | 'below_previous_period';

// Lowercase letters, numbers, hyphens and underscores; must not start with a hyphen or underscore.
const PROFILE_NAME_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

export const getProfileNameError = (
  name: string,
  existingNames: readonly string[] = []
): ProfileNameError | undefined => {
  if (name.length === 0) {
    return 'required';
  }
  if (name.length > PROFILE_NAME_MAX_LENGTH) {
    return 'too_long';
  }
  if (!PROFILE_NAME_PATTERN.test(name)) {
    return 'invalid_characters';
  }
  return existingNames.includes(name) ? 'already_exists' : undefined;
};

const isInBoostRange = (value: number) => value >= MIN_BOOST && value <= MAX_BOOST;

export const getBoostRangeError = (
  minBoost: number | undefined,
  maxBoost: number | undefined
): BoostRangeError | undefined => {
  if (minBoost === undefined) {
    return 'min_required';
  }
  if (maxBoost === undefined) {
    return 'max_required';
  }
  if (!isInBoostRange(minBoost)) {
    return 'min_out_of_range';
  }
  if (!isInBoostRange(maxBoost)) {
    return 'max_out_of_range';
  }
  if (maxBoost <= 0) {
    return 'max_not_positive';
  }
  return maxBoost < minBoost ? 'max_below_min' : undefined;
};

/** Validates a period's max age in whole days, which must not be shorter than the period before it. */
export const getMaxAgeDaysError = (
  days: number | undefined,
  previousPeriodDays?: number
): MaxAgeError | undefined => {
  if (days === undefined) {
    return 'required';
  }
  if (!Number.isInteger(days) || days < 1 || days > MAX_AGE_MAX_DAYS) {
    return 'out_of_range';
  }
  return previousPeriodDays !== undefined && days < previousPeriodDays
    ? 'below_previous_period'
    : undefined;
};

/** Parses a max age such as `7d` into whole days, or `undefined` if it isn't in days. */
export const parseMaxAgeDays = (maxAge: string | undefined): number | undefined => {
  const match = maxAge?.match(/^(\d+)d$/);
  return match ? Number(match[1]) : undefined;
};

export const formatMaxAgeDays = (days: number): string => `${days}d`;
