/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema } from '@kbn/config-schema';
import type { IRouter, RequestHandlerContext, SavedObjectsClientContract } from '@kbn/core/server';
import {
  BOOST_MODE_API_PATH,
  BOOST_SAVED_OBJECT_TYPE,
  BOOST_SIMPLE_DEFAULTS_API_PATH,
  BOOST_STATE_API_PATH,
  MANAGE_BOOST_PRIVILEGE,
  READ_BOOST_PRIVILEGE,
} from '../../common/constants';
import { getState, resetState, updateMode, updateSimpleDefaults } from '../lib/boost_store';

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

const getClient = async (context: RequestHandlerContext): Promise<SavedObjectsClientContract> => {
  const { savedObjects } = await context.core;
  return savedObjects.getClient({ includedHiddenTypes: [BOOST_SAVED_OBJECT_TYPE] });
};

export const registerRoutes = (router: IRouter) => {
  router.get(
    {
      path: BOOST_STATE_API_PATH,
      security: { authz: { requiredPrivileges: [READ_BOOST_PRIVILEGE] } },
      validate: false,
    },
    async (context, _request, response) =>
      response.ok({ body: await getState(await getClient(context)) })
  );

  router.delete(
    {
      path: BOOST_STATE_API_PATH,
      security: { authz: { requiredPrivileges: [MANAGE_BOOST_PRIVILEGE] } },
      validate: false,
    },
    async (context, _request, response) =>
      response.ok({ body: await resetState(await getClient(context)) })
  );

  router.put(
    {
      path: BOOST_SIMPLE_DEFAULTS_API_PATH,
      security: { authz: { requiredPrivileges: [MANAGE_BOOST_PRIVILEGE] } },
      validate: { body: simpleDefaultsSchema },
    },
    async (context, { body }, response) =>
      response.ok({ body: await updateSimpleDefaults(await getClient(context), body) })
  );

  router.put(
    {
      path: BOOST_MODE_API_PATH,
      security: { authz: { requiredPrivileges: [MANAGE_BOOST_PRIVILEGE] } },
      validate: { body: modeSchema },
    },
    async (context, { body: { mode } }, response) =>
      response.ok({ body: await updateMode(await getClient(context), mode) })
  );
};
