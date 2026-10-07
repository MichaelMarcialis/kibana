/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';
import type { IRouter } from '@kbn/core/server';
import {
  BOOST_MODE_API_PATH,
  BOOST_SIMPLE_DEFAULTS_API_PATH,
  BOOST_STATE_API_PATH,
  MANAGE_BOOST_PRIVILEGE,
  READ_BOOST_PRIVILEGE,
} from '../../common/constants';
import { getState, updateMode, updateSimpleDefaults } from '../lib/boost_store';
import { getSavedObjectsClient } from './get_saved_objects_client';
import { registerPrototypeRoutes } from './prototype';

const simpleDefaultsSchema = schema.object({
  indices: schema.oneOf([
    schema.literal('on_demand'),
    schema.literal('performant'),
    schema.literal('high_availability'),
  ]),
  data_streams: schema.object({
    window: schema.oneOf([
      schema.literal('last_1_day'),
      schema.literal('last_3_days'),
      schema.literal('last_7_days'),
    ]),
  }),
});

const modeSchema = schema.object({
  mode: schema.oneOf([schema.literal('simple'), schema.literal('advanced')]),
});

export const registerRoutes = (router: IRouter) => {
  router.get(
    {
      path: BOOST_STATE_API_PATH,
      security: { authz: { requiredPrivileges: [READ_BOOST_PRIVILEGE] } },
      validate: false,
    },
    async (context, _request, response) =>
      response.ok({ body: await getState(await getSavedObjectsClient(context)) })
  );

  router.put(
    {
      path: BOOST_SIMPLE_DEFAULTS_API_PATH,
      security: { authz: { requiredPrivileges: [MANAGE_BOOST_PRIVILEGE] } },
      validate: { body: simpleDefaultsSchema },
    },
    async (context, { body }, response) =>
      response.ok({ body: await updateSimpleDefaults(await getSavedObjectsClient(context), body) })
  );

  router.put(
    {
      path: BOOST_MODE_API_PATH,
      security: { authz: { requiredPrivileges: [MANAGE_BOOST_PRIVILEGE] } },
      validate: { body: modeSchema },
    },
    async (context, { body: { mode } }, response) =>
      response.ok({ body: await updateMode(await getSavedObjectsClient(context), mode) })
  );

  registerPrototypeRoutes(router);
};
