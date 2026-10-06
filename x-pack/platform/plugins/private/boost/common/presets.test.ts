/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  CUSTOM_WINDOW_PROFILE_NAME,
  DEFAULT_SIMPLE_MODE_DEFAULTS,
  createDefaultRules,
  getAvailableProfiles,
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
  it('maps presets to built-in profiles', () => {
    expect(translateSimpleDefaults(DEFAULT_SIMPLE_MODE_DEFAULTS)).toEqual({
      indices_profile: 'elastic-performant',
      data_streams_profile: 'elastic-last-7-days',
    });
  });

  it('maps a custom window to the simple-mode managed profile', () => {
    expect(
      translateSimpleDefaults({
        indices: 'on_demand',
        data_streams: { window: 'custom', custom_days: 45 },
      })
    ).toEqual({
      indices_profile: 'elastic-on-demand',
      data_streams_profile: CUSTOM_WINDOW_PROFILE_NAME,
    });
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

describe('getAvailableProfiles', () => {
  it('includes the custom window profile only when a custom window is selected', () => {
    const names = (settings: BoostSettings) =>
      getAvailableProfiles(settings).map(({ name }) => name);

    expect(names(simpleSettings)).not.toContain(CUSTOM_WINDOW_PROFILE_NAME);
    expect(
      names({
        ...simpleSettings,
        simple: {
          ...DEFAULT_SIMPLE_MODE_DEFAULTS,
          data_streams: { window: 'custom', custom_days: 30 },
        },
      })
    ).toContain(CUSTOM_WINDOW_PROFILE_NAME);
  });
});
