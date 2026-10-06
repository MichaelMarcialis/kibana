/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { HttpStart, IHttpFetchError } from '@kbn/core/public';
import { i18n } from '@kbn/i18n';
import { useMutation, useQuery, useQueryClient } from '@kbn/react-query';
import {
  BOOST_MODE_API_PATH,
  BOOST_SIMPLE_DEFAULTS_API_PATH,
  BOOST_STATE_API_PATH,
} from '../../common/constants';
import type { BoostMode, BoostState, SimpleModeDefaults } from '../../common/types';
import { useBoostServices } from './use_boost_services';

const BOOST_STATE_QUERY_KEY = ['boost', 'state'] as const;

export const useBoostState = () => {
  const { http } = useBoostServices();

  return useQuery<BoostState, IHttpFetchError>({
    queryKey: BOOST_STATE_QUERY_KEY,
    queryFn: ({ signal }) => http.get<BoostState>(BOOST_STATE_API_PATH, { signal }),
  });
};

/** Mutations respond with the full updated state, which replaces the cached state. */
const useBoostMutation = <TVariables>(
  request: (http: HttpStart, variables: TVariables) => Promise<BoostState>,
  errorTitle: string
) => {
  const { http, notifications } = useBoostServices();
  const queryClient = useQueryClient();

  return useMutation<BoostState, IHttpFetchError, TVariables>({
    mutationFn: (variables) => request(http, variables),
    onSuccess: (state) => queryClient.setQueryData(BOOST_STATE_QUERY_KEY, state),
    onError: (error) => notifications.toasts.addError(error, { title: errorTitle }),
  });
};

export const useUpdateSimpleDefaults = () =>
  useBoostMutation(
    (http, simple: SimpleModeDefaults) =>
      http.put<BoostState>(BOOST_SIMPLE_DEFAULTS_API_PATH, { body: JSON.stringify(simple) }),
    i18n.translate('xpack.boost.updateSimpleDefaultsErrorTitle', {
      defaultMessage: 'Unable to save boost defaults',
    })
  );

export const useUpdateMode = () =>
  useBoostMutation(
    (http, mode: BoostMode) =>
      http.put<BoostState>(BOOST_MODE_API_PATH, { body: JSON.stringify({ mode }) }),
    i18n.translate('xpack.boost.updateModeErrorTitle', {
      defaultMessage: 'Unable to switch boost mode',
    })
  );
