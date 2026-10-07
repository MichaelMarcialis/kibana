/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

// Profile and rule shapes mirror the Elasticsearch `_boost` API responses.

export type BoostProfileType = 'indices' | 'data_streams';

export type HighAvailability = 'one_extra_copy' | 'none';

export interface BoostPeriod {
  min_boost: number;
  max_boost: number;
  max_age?: string;
}

interface BoostProfileBase {
  name: string;
  is_builtin: boolean;
}

export interface IndicesBoostProfile extends BoostProfileBase {
  type: 'indices';
  min_boost: number;
  max_boost: number;
  high_availability: HighAvailability;
  prewarm: boolean;
  pinned: boolean;
}

export interface DataStreamsBoostProfile extends BoostProfileBase {
  type: 'data_streams';
  recent: BoostPeriod;
  standard: BoostPeriod;
  background: BoostPeriod;
}

export type BoostProfile = IndicesBoostProfile | DataStreamsBoostProfile;

/** Profile payload for create and update requests; the server sets `is_builtin`. */
export type BoostProfileInput =
  | Omit<IndicesBoostProfile, 'is_builtin'>
  | Omit<DataStreamsBoostProfile, 'is_builtin'>;

export interface BoostRule {
  name: string;
  index_pattern: string;
  boost_profile: string;
  priority: number;
  is_builtin: boolean;
}

export type BoostMode = 'simple' | 'advanced';

export type IndicesPresetId = 'on_demand' | 'performant' | 'high_availability';

export type DataStreamsWindowId = 'last_1_day' | 'last_3_days' | 'last_7_days';

export interface SimpleModeDefaults {
  indices: IndicesPresetId;
  data_streams: {
    window: DataStreamsWindowId;
  };
}

/** Profiles referenced by the two default rules while in advanced mode. */
export interface AdvancedModeDefaults {
  indices_profile: string;
  data_streams_profile: string;
}

export interface BoostSettings {
  mode: BoostMode;
  simple: SimpleModeDefaults;
  /** `null` until the user changes a default rule in advanced mode. */
  advanced: AdvancedModeDefaults | null;
  updated_at?: string;
}

export interface BoostState {
  settings: BoostSettings;
  profiles: BoostProfile[];
  rules: BoostRule[];
}
