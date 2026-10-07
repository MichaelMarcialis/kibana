/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ElasticsearchClient, SavedObjectsClientContract } from '@kbn/core/server';
import { SavedObjectsErrorHelpers } from '@kbn/core/server';
import { BOOST_SAVED_OBJECT_TYPE, BOOST_SETTINGS_SAVED_OBJECT_ID } from '../../common/constants';
import {
  BUILTIN_PROFILES,
  DEFAULT_SIMPLE_MODE_DEFAULTS,
  createDefaultRules,
  getEffectiveDefaults,
} from '../../common/presets';
import type {
  BoostMode,
  BoostProfile,
  BoostProfileInput,
  BoostSettings,
  BoostState,
  SimpleModeDefaults,
} from '../../common/types';
import { getDataSources } from './data_sources';
import { BoostRequestError } from './errors';

type SettingsAttributes = Pick<BoostSettings, 'mode' | 'simple' | 'advanced'> & {
  kind: 'settings';
};

type ProfileAttributes = BoostProfileInput & { kind: 'profile' };

const PROTOTYPE_KIND_FILTER = (kind: 'profile' | 'rule') =>
  `${BOOST_SAVED_OBJECT_TYPE}.attributes.kind: ${kind}`;

const profileId = (name: string) => `profile-${name}`;

const BUILTIN_PROFILE_NAMES = BUILTIN_PROFILES.map(({ name }) => name);

const DEFAULT_SETTINGS: BoostSettings = {
  mode: 'simple',
  simple: DEFAULT_SIMPLE_MODE_DEFAULTS,
  advanced: null,
};

const getSettings = async (client: SavedObjectsClientContract): Promise<BoostSettings> => {
  try {
    const {
      attributes: { mode, simple, advanced },
      updated_at: updatedAt,
    } = await client.get<SettingsAttributes>(
      BOOST_SAVED_OBJECT_TYPE,
      BOOST_SETTINGS_SAVED_OBJECT_ID
    );

    return { mode, simple, advanced, updated_at: updatedAt };
  } catch (error) {
    if (SavedObjectsErrorHelpers.isNotFoundError(error)) {
      return DEFAULT_SETTINGS;
    }
    throw error;
  }
};

const saveSettings = async (
  client: SavedObjectsClientContract,
  { mode, simple, advanced }: BoostSettings
): Promise<void> => {
  const attributes: SettingsAttributes = { kind: 'settings', mode, simple, advanced };

  await client.create(BOOST_SAVED_OBJECT_TYPE, attributes, {
    id: BOOST_SETTINGS_SAVED_OBJECT_ID,
    overwrite: true,
  });
};

const getCustomProfiles = async (client: SavedObjectsClientContract): Promise<BoostProfile[]> => {
  const { saved_objects: savedObjects } = await client.find<ProfileAttributes>({
    type: BOOST_SAVED_OBJECT_TYPE,
    filter: PROTOTYPE_KIND_FILTER('profile'),
    perPage: 1000,
  });

  return savedObjects
    .map(({ attributes: { kind, ...profile } }) => ({ ...profile, is_builtin: false }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

/** Returns the settings, the profiles and rules they currently imply, and the project's data sources. */
export const getState = async (
  client: SavedObjectsClientContract,
  esClient: ElasticsearchClient
): Promise<BoostState> => {
  const [settings, customProfiles, dataSources] = await Promise.all([
    getSettings(client),
    getCustomProfiles(client),
    getDataSources(esClient),
  ]);

  return {
    settings,
    profiles: [...BUILTIN_PROFILES, ...customProfiles],
    rules: createDefaultRules(getEffectiveDefaults(settings)),
    data_sources: dataSources,
  };
};

const saveProfile = async (
  client: SavedObjectsClientContract,
  profile: BoostProfileInput,
  overwrite: boolean
) => {
  const attributes: ProfileAttributes = { kind: 'profile', ...profile };
  await client.create(BOOST_SAVED_OBJECT_TYPE, attributes, {
    id: profileId(profile.name),
    overwrite,
  });
};

const assertNotBuiltin = (name: string, action: string) => {
  if (BUILTIN_PROFILE_NAMES.includes(name)) {
    throw new BoostRequestError(400, `Built-in boost profile [${name}] cannot be ${action}.`);
  }
};

const getCustomProfile = async (
  client: SavedObjectsClientContract,
  name: string
): Promise<BoostProfileInput> => {
  try {
    const {
      attributes: { kind, ...profile },
    } = await client.get<ProfileAttributes>(BOOST_SAVED_OBJECT_TYPE, profileId(name));
    return profile;
  } catch (error) {
    if (SavedObjectsErrorHelpers.isNotFoundError(error)) {
      throw new BoostRequestError(404, `Boost profile [${name}] not found.`);
    }
    throw error;
  }
};

export const createProfile = async (
  client: SavedObjectsClientContract,
  profile: BoostProfileInput
): Promise<void> => {
  assertNotBuiltin(profile.name, 'replaced');
  try {
    await saveProfile(client, profile, false);
  } catch (error) {
    if (SavedObjectsErrorHelpers.isConflictError(error)) {
      throw new BoostRequestError(409, `Boost profile [${profile.name}] already exists.`);
    }
    throw error;
  }
};

/** Replaces a custom profile. The name and type can't change. */
export const updateProfile = async (
  client: SavedObjectsClientContract,
  name: string,
  profile: BoostProfileInput
): Promise<void> => {
  assertNotBuiltin(name, 'edited');
  if (profile.name !== name) {
    throw new BoostRequestError(400, 'A boost profile cannot be renamed.');
  }
  const { type } = await getCustomProfile(client, name);
  if (type !== profile.type) {
    throw new BoostRequestError(400, 'A boost profile type cannot be changed.');
  }
  await saveProfile(client, profile, true);
};

export const deleteProfile = async (
  client: SavedObjectsClientContract,
  name: string
): Promise<void> => {
  assertNotBuiltin(name, 'deleted');
  await getCustomProfile(client, name);
  await client.delete(BOOST_SAVED_OBJECT_TYPE, profileId(name));
};

export const updateSimpleDefaults = async (
  client: SavedObjectsClientContract,
  simple: SimpleModeDefaults
): Promise<void> => {
  await saveSettings(client, { ...(await getSettings(client)), simple });
};

export const updateMode = async (
  client: SavedObjectsClientContract,
  mode: BoostMode
): Promise<void> => {
  await saveSettings(client, { ...(await getSettings(client)), mode });
};

/** Deletes the settings and all custom profiles, returning the project to its out-of-the-box state. */
export const resetState = async (client: SavedObjectsClientContract): Promise<void> => {
  const customProfiles = await getCustomProfiles(client);
  if (customProfiles.length > 0) {
    await client.bulkDelete(
      customProfiles.map(({ name }) => ({ type: BOOST_SAVED_OBJECT_TYPE, id: profileId(name) }))
    );
  }

  try {
    await client.delete(BOOST_SAVED_OBJECT_TYPE, BOOST_SETTINGS_SAVED_OBJECT_ID);
  } catch (error) {
    if (!SavedObjectsErrorHelpers.isNotFoundError(error)) {
      throw error;
    }
  }
};
