/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  ElasticsearchClient,
  RequestHandlerContext,
  SavedObjectsClientContract,
} from '@kbn/core/server';
import { BOOST_SAVED_OBJECT_TYPE } from '../../common/constants';

export interface BoostRequestClients {
  savedObjectsClient: SavedObjectsClientContract;
  esClient: ElasticsearchClient;
}

/** Returns request-scoped clients: saved objects (including the hidden boost type) and Elasticsearch. */
export const getRequestClients = async (
  context: RequestHandlerContext
): Promise<BoostRequestClients> => {
  const { savedObjects, elasticsearch } = await context.core;
  return {
    savedObjectsClient: savedObjects.getClient({ includedHiddenTypes: [BOOST_SAVED_OBJECT_TYPE] }),
    esClient: elasticsearch.client.asCurrentUser,
  };
};
