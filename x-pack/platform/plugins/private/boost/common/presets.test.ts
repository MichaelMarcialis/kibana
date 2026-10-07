/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  BUILTIN_DATA_STREAMS_PROFILE_NAMES,
  BUILTIN_INDICES_PROFILE_NAMES,
  BUILTIN_PROFILES,
  DEFAULT_SIMPLE_MODE_DEFAULTS,
  createDefaultRules,
  getEffectiveDefaults,
  translateSimpleDefaults,
} from './presets';
import type { BoostSettings } from './types';

const simpleSettings: BoostSettings = {
  mode: 'simple',
  simple: DEFAULT_SIMPLE_MODE_DEFAULTS,
  advanced: null,
};

describe('translateSimpleDefaults', () => {
  it('maps the out-of-the-box defaults to built-in profiles', () => {
    expect(translateSimpleDefaults(DEFAULT_SIMPLE_MODE_DEFAULTS)).toEqual({
      indices_profile: 'elastic-performant',
      data_streams_profile: 'elastic-last-7-days',
    });
  });

  it('maps every data stream window to its own built-in profile', () => {
    expect(
      translateSimpleDefaults({ indices: 'on_demand', data_streams: { window: 'last_3_days' } })
    ).toEqual({
      indices_profile: 'elastic-on-demand',
      data_streams_profile: 'elastic-last-3-days',
    });
  });
});

describe('BUILTIN_PROFILES', () => {
  it('includes one built-in profile for every simple-mode option', () => {
    const builtinNames = BUILTIN_PROFILES.map(({ name }) => name);

    expect(builtinNames).toEqual(
      expect.arrayContaining([
        ...Object.values(BUILTIN_INDICES_PROFILE_NAMES),
        ...Object.values(BUILTIN_DATA_STREAMS_PROFILE_NAMES),
      ])
    );
  });
});

describe('getEffectiveDefaults', () => {
  const advanced = { indices_profile: 'my-indices', data_streams_profile: 'my-streams' };

  it('uses simple defaults in simple mode, even when advanced defaults exist', () => {
    expect(getEffectiveDefaults({ ...simpleSettings, advanced })).toEqual({
      indices_profile: 'elastic-performant',
      data_streams_profile: 'elastic-last-7-days',
    });
  });

  it('restores advanced defaults in advanced mode', () => {
    expect(getEffectiveDefaults({ ...simpleSettings, mode: 'advanced', advanced })).toEqual(
      advanced
    );
  });

  it('translates simple defaults on the first visit to advanced mode', () => {
    expect(getEffectiveDefaults({ ...simpleSettings, mode: 'advanced' })).toEqual({
      indices_profile: 'elastic-performant',
      data_streams_profile: 'elastic-last-7-days',
    });
  });
});

describe('createDefaultRules', () => {
  it('creates one locked `*` rule per profile type', () => {
    const rules = createDefaultRules(translateSimpleDefaults(DEFAULT_SIMPLE_MODE_DEFAULTS));

    expect(rules.map(({ index_pattern: pattern, priority }) => [pattern, priority])).toEqual([
      ['*', 0],
      ['*', 0],
    ]);
  });
});
