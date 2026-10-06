/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { PluginConfigDescriptor, PluginInitializer } from '@kbn/core/server';
import type { BoostConfigType } from './config';
import { configSchema } from './config';
import type { BoostSetupDependencies } from './types';

export const config: PluginConfigDescriptor<BoostConfigType> = {
  schema: configSchema,
};

export const plugin: PluginInitializer<void, void, BoostSetupDependencies> = async () => {
  const { BoostPlugin } = await import('./plugin');
  return new BoostPlugin();
};
