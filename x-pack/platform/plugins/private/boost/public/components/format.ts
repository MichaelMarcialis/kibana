/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import type { BoostProfileType } from '../../common/types';

const numberFormat = new Intl.NumberFormat(i18n.getLocale(), { maximumFractionDigits: 2 });

export const formatBoostRange = (minBoost: number, maxBoost: number): string =>
  i18n.translate('xpack.boost.format.boostRange', {
    defaultMessage: '{min}–{max}',
    values: { min: numberFormat.format(minBoost), max: numberFormat.format(maxBoost) },
  });

export const PROFILE_TYPE_LABELS: Readonly<Record<BoostProfileType, string>> = {
  indices: i18n.translate('xpack.boost.format.indicesType', { defaultMessage: 'Indices' }),
  data_streams: i18n.translate('xpack.boost.format.dataStreamsType', {
    defaultMessage: 'Data streams',
  }),
};
