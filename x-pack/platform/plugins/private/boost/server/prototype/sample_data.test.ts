/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { estypes } from '@elastic/elasticsearch';
import { elasticsearchServiceMock } from '@kbn/core/server/mocks';
import { ensureSampleData } from './sample_data';

const existingDataStream = (name: string): estypes.IndicesGetDataStreamResponse => ({
  data_streams: [{ name } as estypes.IndicesDataStream],
});

describe('ensureSampleData', () => {
  const setup = ({
    missingIndex,
    missingDataStream,
  }: {
    missingIndex?: string;
    missingDataStream?: string;
  }) => {
    const client = elasticsearchServiceMock.createElasticsearchClient();
    client.indices.existsIndexTemplate.mockResolvedValue(true);
    client.indices.exists.mockImplementation(async ({ index }) => index !== missingIndex);
    client.indices.getDataStream.mockImplementation(async (params) => {
      const name = String(params?.name);
      return name === missingDataStream ? { data_streams: [] } : existingDataStream(name);
    });
    client.bulk.mockResolvedValue({ errors: false, items: [], took: 1 });
    return client;
  };

  it('creates only the missing sample index and data stream', async () => {
    const client = setup({ missingIndex: 'products', missingDataStream: 'clicks-web' });

    await expect(ensureSampleData(client)).resolves.toEqual(['products', 'clicks-web']);
    expect(client.indices.create).toHaveBeenCalledWith({ index: 'products' });
    expect(client.indices.createDataStream).toHaveBeenCalledWith({ name: 'clicks-web' });
    expect(client.bulk).toHaveBeenCalledTimes(2);
  });

  it('does nothing when all sample data already exists', async () => {
    const client = setup({});

    await expect(ensureSampleData(client)).resolves.toEqual([]);
    expect(client.bulk).not.toHaveBeenCalled();
  });

  it('throws when Elasticsearch rejects sample documents', async () => {
    const client = setup({ missingIndex: 'products' });
    client.bulk.mockResolvedValue({
      errors: true,
      took: 1,
      items: [
        {
          index: { _index: 'products', status: 400, error: { type: 'x', reason: 'bad doc' } },
        },
      ],
    });

    await expect(ensureSampleData(client)).rejects.toThrow(
      'Failed to index sample documents into [products]: bad doc'
    );
  });
});
