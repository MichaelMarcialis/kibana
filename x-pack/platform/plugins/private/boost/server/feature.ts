/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import { DEFAULT_APP_CATEGORIES } from '@kbn/core/server';
import type { KibanaFeatureConfig } from '@kbn/features-plugin/server';
import {
  BOOST_SAVED_OBJECT_TYPE,
  MANAGE_BOOST_PRIVILEGE,
  PLUGIN_ID,
  READ_BOOST_PRIVILEGE,
} from '../common/constants';

export const boostFeature: KibanaFeatureConfig = {
  id: PLUGIN_ID,
  name: i18n.translate('xpack.boost.featureName', { defaultMessage: 'Search boost' }),
  category: DEFAULT_APP_CATEGORIES.management,
  app: [],
  management: { data: [PLUGIN_ID] },
  privileges: {
    all: {
      app: [],
      management: { data: [PLUGIN_ID] },
      api: [READ_BOOST_PRIVILEGE, MANAGE_BOOST_PRIVILEGE],
      savedObject: { all: [BOOST_SAVED_OBJECT_TYPE], read: [] },
      ui: ['show', 'save'],
    },
    read: {
      app: [],
      management: { data: [PLUGIN_ID] },
      api: [READ_BOOST_PRIVILEGE],
      savedObject: { all: [], read: [BOOST_SAVED_OBJECT_TYPE] },
      ui: ['show'],
    },
  },
};
