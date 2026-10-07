/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  getBoostRangeError,
  getMaxAgeDaysError,
  getProfileNameError,
  parseMaxAgeDays,
} from './validation';

describe('getProfileNameError', () => {
  it.each([
    ['', 'required'],
    ['My Profile', 'invalid_characters'],
    ['_hidden', 'invalid_characters'],
    ['-dash', 'invalid_characters'],
    ['a'.repeat(256), 'too_long'],
  ])('rejects %p as %p', (name, error) => {
    expect(getProfileNameError(name)).toBe(error);
  });

  it('accepts lowercase names with numbers, hyphens and underscores', () => {
    expect(getProfileNameError('products_fast-2')).toBeUndefined();
  });

  it('rejects names that are already taken', () => {
    expect(getProfileNameError('elastic-performant', ['elastic-performant'])).toBe(
      'already_exists'
    );
  });
});

describe('getBoostRangeError', () => {
  it.each([
    [undefined, 1, 'min_required'],
    [1, undefined, 'max_required'],
    [-1, 1, 'min_out_of_range'],
    [1, 5001, 'max_out_of_range'],
    [0, 0, 'max_not_positive'],
    [4, 2, 'max_below_min'],
  ])('rejects min %p and max %p as %p', (minBoost, maxBoost, error) => {
    expect(getBoostRangeError(minBoost, maxBoost)).toBe(error);
  });

  it('accepts a range within the API bounds', () => {
    expect(getBoostRangeError(0, 5000)).toBeUndefined();
    expect(getBoostRangeError(0.28, 1)).toBeUndefined();
  });
});

describe('getMaxAgeDaysError', () => {
  it('requires a whole number of days of at least one', () => {
    expect(getMaxAgeDaysError(undefined)).toBe('required');
    expect(getMaxAgeDaysError(0)).toBe('out_of_range');
    expect(getMaxAgeDaysError(1.5)).toBe('out_of_range');
  });

  it('rejects a max age shorter than the previous period', () => {
    expect(getMaxAgeDaysError(3, 7)).toBe('below_previous_period');
    expect(getMaxAgeDaysError(7, 7)).toBeUndefined();
  });
});

describe('parseMaxAgeDays', () => {
  it('parses day durations only', () => {
    expect(parseMaxAgeDays('7d')).toBe(7);
    expect(parseMaxAgeDays('12h')).toBeUndefined();
    expect(parseMaxAgeDays(undefined)).toBeUndefined();
  });
});
