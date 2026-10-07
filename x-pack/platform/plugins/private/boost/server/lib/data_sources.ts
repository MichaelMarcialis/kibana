/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ElasticsearchClient } from '@kbn/core/server';
import type { BoostDataSource } from '../../common/types';

const isUserFacing = (name: string) => !name.startsWith('.');

/**
 * Lists the project's open, non-hidden regular indices and data streams. Data stream backing
 * indices are excluded, since boost rules apply to the data stream as a whole.
 */
export const getDataSources = async (client: ElasticsearchClient): Promise<BoostDataSource[]> => {
  const { indices, data_streams: dataStreams } = await client.indices.resolveIndex({
    name: '*',
    expand_wildcards: 'open',
  });

  return [
    ...indices
      .filter(({ name, data_stream: dataStream }) => !dataStream && isUserFacing(name))
      .map(({ name }): BoostDataSource => ({ name, type: 'index' })),
    ...dataStreams
      .filter(({ name }) => isUserFacing(name))
      .map(({ name }): BoostDataSource => ({ name, type: 'data_stream' })),
  ].sort((a, b) => a.name.localeCompare(b.name));
};
