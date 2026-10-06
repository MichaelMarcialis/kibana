/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { EuiBasicTableColumn } from '@elastic/eui';
import { EuiBadge, EuiBasicTable, EuiCode, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { BoostProfile, BoostRule } from '../../common/types';

interface RulesTableProps {
  rules: BoostRule[];
  profiles: BoostProfile[];
}

const getAppliesTo = ({ is_builtin: isBuiltin }: BoostRule, profile?: BoostProfile): string => {
  if (profile?.type === 'data_streams') {
    return isBuiltin
      ? i18n.translate('xpack.boost.rulesTable.unmatchedDataStreams', {
          defaultMessage: 'All unmatched data streams',
        })
      : i18n.translate('xpack.boost.rulesTable.dataStreams', { defaultMessage: 'Data streams' });
  }
  return isBuiltin
    ? i18n.translate('xpack.boost.rulesTable.unmatchedIndices', {
        defaultMessage: 'All unmatched indices',
      })
    : i18n.translate('xpack.boost.rulesTable.indices', { defaultMessage: 'Indices' });
};

export const RulesTable = ({ rules, profiles }: RulesTableProps) => {
  const profilesByName = new Map(profiles.map((profile) => [profile.name, profile]));

  const columns: Array<EuiBasicTableColumn<BoostRule>> = [
    {
      field: 'priority',
      name: i18n.translate('xpack.boost.rulesTable.priorityColumn', {
        defaultMessage: 'Priority',
      }),
      width: '96px',
    },
    {
      field: 'name',
      name: i18n.translate('xpack.boost.rulesTable.nameColumn', { defaultMessage: 'Name' }),
      render: (name: string, { is_builtin: isBuiltin }: BoostRule) => (
        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} wrap>
          <EuiFlexItem grow={false}>{name}</EuiFlexItem>
          {isBuiltin && (
            <EuiFlexItem grow={false}>
              <EuiBadge iconType="lock">
                {i18n.translate('xpack.boost.rulesTable.defaultBadge', {
                  defaultMessage: 'Default',
                })}
              </EuiBadge>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      ),
    },
    {
      field: 'index_pattern',
      name: i18n.translate('xpack.boost.rulesTable.indexPatternColumn', {
        defaultMessage: 'Index pattern',
      }),
      render: (indexPattern: string) => <EuiCode>{indexPattern}</EuiCode>,
    },
    {
      field: 'boost_profile',
      name: i18n.translate('xpack.boost.rulesTable.profileColumn', {
        defaultMessage: 'Boost profile',
      }),
    },
    {
      name: i18n.translate('xpack.boost.rulesTable.appliesToColumn', {
        defaultMessage: 'Applies to',
      }),
      render: (rule: BoostRule) => getAppliesTo(rule, profilesByName.get(rule.boost_profile)),
    },
  ];

  return (
    <EuiBasicTable
      tableCaption={i18n.translate('xpack.boost.rulesTable.caption', {
        defaultMessage: 'Boost rules',
      })}
      items={rules}
      itemId="name"
      columns={columns}
      data-test-subj="boostRulesTable"
    />
  );
};
