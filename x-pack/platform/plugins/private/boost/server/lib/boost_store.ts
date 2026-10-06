/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { SavedObjectsClientContract } from '@kbn/core/server';
import { SavedObjectsErrorHelpers } from '@kbn/core/server';
import { BOOST_SAVED_OBJECT_TYPE, BOOST_SETTINGS_SAVED_OBJECT_ID } from '../../common/constants';
import {
  DEFAULT_SIMPLE_MODE_DEFAULTS,
  createDefaultRules,
  getAvailableProfiles,
  getEffectiveDefaults,
} from '../../common/presets';
import type { BoostMode, BoostSettings, BoostState, SimpleModeDefaults } from '../../common/types';

type SettingsAttributes = Pick<BoostSettings, 'mode' | 'simple' | 'advanced'> & {
  kind: 'settings';
};

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

/** Returns the settings plus the profiles and rules they currently imply. */
export const getState = async (client: SavedObjectsClientContract): Promise<BoostState> => {
  const settings = await getSettings(client);

  return {
    settings,
    profiles: getAvailableProfiles(settings),
    rules: createDefaultRules(getEffectiveDefaults(settings)),
  };
};

export const updateSimpleDefaults = async (
  client: SavedObjectsClientContract,
  simple: SimpleModeDefaults
): Promise<BoostState> => {
  await saveSettings(client, { ...(await getSettings(client)), simple });
  return getState(client);
};

export const updateMode = async (
  client: SavedObjectsClientContract,
  mode: BoostMode
): Promise<BoostState> => {
  await saveSettings(client, { ...(await getSettings(client)), mode });
  return getState(client);
};

/** Deletes all stored prototype state, returning the project to its out-of-the-box defaults. */
export const resetState = async (client: SavedObjectsClientContract): Promise<BoostState> => {
  try {
    await client.delete(BOOST_SAVED_OBJECT_TYPE, BOOST_SETTINGS_SAVED_OBJECT_ID);
  } catch (error) {
    if (!SavedObjectsErrorHelpers.isNotFoundError(error)) {
      throw error;
    }
  }
  return getState(client);
};
