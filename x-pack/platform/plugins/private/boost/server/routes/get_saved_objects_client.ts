/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { RequestHandlerContext, SavedObjectsClientContract } from '@kbn/core/server';
import { BOOST_SAVED_OBJECT_TYPE } from '../../common/constants';

/** Returns a request-scoped saved objects client that can access the hidden boost type. */
export const getSavedObjectsClient = async (
  context: RequestHandlerContext
): Promise<SavedObjectsClientContract> => {
  const { savedObjects } = await context.core;
  return savedObjects.getClient({ includedHiddenTypes: [BOOST_SAVED_OBJECT_TYPE] });
};
