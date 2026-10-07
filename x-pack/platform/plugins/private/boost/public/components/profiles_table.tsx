/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { EuiBasicTableColumn } from '@elastic/eui';
import { EuiBadge, EuiBasicTable, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { BoostProfile } from '../../common/types';
import { PROFILE_TYPE_LABELS, formatBoostRange } from './format';

const getIndicesOptions = (profile: BoostProfile): string[] => {
  if (profile.type !== 'indices') {
    return [];
  }
  return [
    profile.high_availability === 'one_extra_copy'
      ? i18n.translate('xpack.boost.profilesTable.extraCopy', { defaultMessage: 'Extra copy' })
      : undefined,
    profile.prewarm
      ? i18n.translate('xpack.boost.profilesTable.prewarm', { defaultMessage: 'Prewarm' })
      : undefined,
    profile.pinned
      ? i18n.translate('xpack.boost.profilesTable.pin', { defaultMessage: 'Pin' })
      : undefined,
  ].filter((option): option is string => option !== undefined);
};

const columns: Array<EuiBasicTableColumn<BoostProfile>> = [
  {
    field: 'name',
    name: i18n.translate('xpack.boost.profilesTable.nameColumn', { defaultMessage: 'Name' }),
    render: (name: string, { is_builtin: isBuiltin }: BoostProfile) => (
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} wrap>
        <EuiFlexItem grow={false}>{name}</EuiFlexItem>
        {isBuiltin && (
          <EuiFlexItem grow={false}>
            <EuiBadge color="hollow">
              {i18n.translate('xpack.boost.profilesTable.elasticBadge', {
                defaultMessage: 'Elastic',
              })}
            </EuiBadge>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    ),
  },
  {
    field: 'type',
    name: i18n.translate('xpack.boost.profilesTable.typeColumn', { defaultMessage: 'Type' }),
    render: (type: BoostProfile['type']) => PROFILE_TYPE_LABELS[type],
  },
  {
    name: i18n.translate('xpack.boost.profilesTable.boostColumn', { defaultMessage: 'Boost' }),
    render: (profile: BoostProfile) =>
      profile.type === 'indices'
        ? formatBoostRange(profile.min_boost, profile.max_boost)
        : formatBoostRange(profile.recent.min_boost, profile.recent.max_boost),
  },
  {
    name: i18n.translate('xpack.boost.profilesTable.detailsColumn', { defaultMessage: 'Details' }),
    render: (profile: BoostProfile) =>
      profile.type === 'indices'
        ? getIndicesOptions(profile).join(' · ') || '—'
        : i18n.translate('xpack.boost.profilesTable.boostedWindow', {
            defaultMessage: 'Boosted window: {maxAge}',
            values: { maxAge: profile.recent.max_age },
          }),
  },
];

export const ProfilesTable = ({ profiles }: { profiles: BoostProfile[] }) => (
  <EuiBasicTable
    tableCaption={i18n.translate('xpack.boost.profilesTable.caption', {
      defaultMessage: 'Boost profiles',
    })}
    items={profiles}
    itemId="name"
    columns={columns}
    data-test-subj="boostProfilesTable"
  />
);
