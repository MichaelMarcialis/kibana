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
  IndicesPresetId,
  SimpleModeDefaults,
} from './types';

export const BUILTIN_INDICES_PROFILE_NAMES: Readonly<Record<IndicesPresetId, string>> = {
  on_demand: 'elastic-on-demand',
  performant: 'elastic-performant',
  high_availability: 'elastic-high-availability',
};

export const BUILTIN_DATA_STREAMS_PROFILE_NAMES = {
  last_1_day: 'elastic-last-1-day',
  last_7_days: 'elastic-last-7-days',
} as const;

/** Profile that simple mode creates and updates when a custom data stream window is chosen. */
export const CUSTOM_WINDOW_PROFILE_NAME = 'simple-mode-custom-window';

export const DEFAULT_INDICES_RULE_NAME = 'elastic-default-indices';
export const DEFAULT_DATA_STREAMS_RULE_NAME = 'elastic-default-data-streams';

export const DEFAULT_SIMPLE_MODE_DEFAULTS: SimpleModeDefaults = {
  indices: 'performant',
  data_streams: { window: 'last_7_days', custom_days: 30 },
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
// cutover mapping, capped at the API maximum; data stream presets reproduce the Search Boost Window.
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
    name: BUILTIN_DATA_STREAMS_PROFILE_NAMES.last_7_days,
    type: 'data_streams',
    is_builtin: true,
    ...createWindowPeriods('7d'),
  },
];

export const createCustomWindowProfile = (days: number): DataStreamsBoostProfile => ({
  name: CUSTOM_WINDOW_PROFILE_NAME,
  type: 'data_streams',
  is_builtin: false,
  _meta: { managed_by: 'simple_mode' },
  ...createWindowPeriods(`${days}d`),
});

/** Translates simple-mode defaults into the profiles referenced by the two default rules. */
export const translateSimpleDefaults = ({
  indices,
  data_streams: dataStreams,
}: SimpleModeDefaults): AdvancedModeDefaults => ({
  indices_profile: BUILTIN_INDICES_PROFILE_NAMES[indices],
  data_streams_profile:
    dataStreams.window === 'custom'
      ? CUSTOM_WINDOW_PROFILE_NAME
      : BUILTIN_DATA_STREAMS_PROFILE_NAMES[dataStreams.window],
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

/** Returns the built-in profiles plus the simple-mode custom window profile when it is in use. */
export const getAvailableProfiles = ({ simple }: BoostSettings): BoostProfile[] =>
  simple.data_streams.window === 'custom'
    ? [...BUILTIN_PROFILES, createCustomWindowProfile(simple.data_streams.custom_days)]
    : [...BUILTIN_PROFILES];
