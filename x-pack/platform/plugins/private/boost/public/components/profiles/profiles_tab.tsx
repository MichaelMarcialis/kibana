/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo, useState } from 'react';
import type {
  EuiBasicTableColumn,
  EuiSearchBarProps,
  EuiTableActionsColumnType,
} from '@elastic/eui';
import {
  EuiBadge,
  EuiButton,
  EuiConfirmModal,
  EuiFlexGroup,
  EuiFlexItem,
  EuiInMemoryTable,
  EuiScreenReaderOnly,
  useGeneratedHtmlId,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { countDataSourcesByProfile, countRulesByProfile } from '../../../common/resolution';
import type { BoostDataSource, BoostProfile, BoostRule } from '../../../common/types';
import { useBoostServices } from '../../hooks/use_boost_services';
import { useDeleteProfile } from '../../hooks/use_boost_state';
import { PROFILE_TYPE_LABELS, formatBoostRange } from '../format';
import { ProfileFlyout } from './profile_flyout';

interface ProfilesTabProps {
  profiles: BoostProfile[];
  rules: BoostRule[];
  dataSources: BoostDataSource[];
  canEdit: boolean;
}

type ProfileRow = BoostProfile & { dataSourceCount: number; ruleCount: number };

type FlyoutState = { profile?: BoostProfile } | undefined;

const PAGE_SIZE = 10;

const MANAGED_BADGE_LABEL = i18n.translate('xpack.boost.profilesTab.managedBadge', {
  defaultMessage: 'Managed',
});

const isCustomProfile = ({ is_builtin: isBuiltin }: BoostProfile) => !isBuiltin;

export const ProfilesTab = ({ profiles, rules, dataSources, canEdit }: ProfilesTabProps) => {
  const { notifications } = useBoostServices();
  const deleteModalTitleId = useGeneratedHtmlId();
  const [flyout, setFlyout] = useState<FlyoutState>();
  const [profileToDelete, setProfileToDelete] = useState<BoostProfile>();
  const { mutate: deleteProfile, isLoading: isDeleting } = useDeleteProfile();

  const rows = useMemo<ProfileRow[]>(() => {
    const dataSourceCounts = countDataSourcesByProfile(dataSources, rules, profiles);
    const ruleCounts = countRulesByProfile(rules);
    return profiles.map((profile) => ({
      ...profile,
      dataSourceCount: dataSourceCounts.get(profile.name) ?? 0,
      ruleCount: ruleCounts.get(profile.name) ?? 0,
    }));
  }, [profiles, rules, dataSources]);

  const actionsColumn: EuiTableActionsColumnType<ProfileRow> = {
    name: (
      <EuiScreenReaderOnly>
        <span>
          {i18n.translate('xpack.boost.profilesTab.actionsColumn', { defaultMessage: 'Actions' })}
        </span>
      </EuiScreenReaderOnly>
    ),
    actions: [
      {
        name: i18n.translate('xpack.boost.profilesTab.editAction', { defaultMessage: 'Edit' }),
        description: i18n.translate('xpack.boost.profilesTab.editActionDescription', {
          defaultMessage: 'Edit this boost profile',
        }),
        icon: 'pencil',
        type: 'icon',
        available: isCustomProfile,
        onClick: (profile) => setFlyout({ profile }),
        'data-test-subj': 'editBoostProfile',
      },
      {
        name: i18n.translate('xpack.boost.profilesTab.deleteAction', { defaultMessage: 'Delete' }),
        description: i18n.translate('xpack.boost.profilesTab.deleteActionDescription', {
          defaultMessage: 'Delete this boost profile',
        }),
        icon: 'trash',
        color: 'danger',
        type: 'icon',
        available: isCustomProfile,
        onClick: setProfileToDelete,
        'data-test-subj': 'deleteBoostProfile',
      },
    ],
  };

  const columns: Array<EuiBasicTableColumn<ProfileRow>> = [
    {
      field: 'name',
      name: i18n.translate('xpack.boost.profilesTab.nameColumn', { defaultMessage: 'Name' }),
      sortable: true,
      render: (name: string, { is_builtin: isBuiltin }: ProfileRow) => (
        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} wrap>
          <EuiFlexItem grow={false}>{name}</EuiFlexItem>
          {isBuiltin && (
            <EuiFlexItem grow={false}>
              <EuiBadge>{MANAGED_BADGE_LABEL}</EuiBadge>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      ),
    },
    {
      field: 'type',
      name: i18n.translate('xpack.boost.profilesTab.typeColumn', { defaultMessage: 'Type' }),
      sortable: true,
      render: (type: BoostProfile['type']) => PROFILE_TYPE_LABELS[type],
    },
    {
      name: i18n.translate('xpack.boost.profilesTab.boostColumn', { defaultMessage: 'Boost' }),
      render: (profile: ProfileRow) =>
        profile.type === 'indices'
          ? formatBoostRange(profile.min_boost, profile.max_boost)
          : i18n.translate('xpack.boost.profilesTab.recentBoost', {
              defaultMessage: '{range} (recent)',
              values: {
                range: formatBoostRange(profile.recent.min_boost, profile.recent.max_boost),
              },
            }),
    },
    {
      field: 'dataSourceCount',
      name: i18n.translate('xpack.boost.profilesTab.dataSourcesColumn', {
        defaultMessage: 'Data sources',
      }),
      sortable: true,
      dataType: 'number',
    },
    {
      field: 'ruleCount',
      name: i18n.translate('xpack.boost.profilesTab.rulesColumn', { defaultMessage: 'Rules' }),
      sortable: true,
      dataType: 'number',
    },
    ...(canEdit ? [actionsColumn] : []),
  ];

  const search: EuiSearchBarProps = {
    compressed: true,
    box: {
      incremental: true,
      placeholder: i18n.translate('xpack.boost.profilesTab.searchPlaceholder', {
        defaultMessage: 'Search boost profiles',
      }),
    },
    filters: [
      {
        type: 'field_value_toggle_group',
        field: 'type',
        items: [
          { value: 'indices', name: PROFILE_TYPE_LABELS.indices },
          { value: 'data_streams', name: PROFILE_TYPE_LABELS.data_streams },
        ],
      },
    ],
    toolsRight: canEdit ? (
      <EuiButton fill size="s" onClick={() => setFlyout({})} data-test-subj="createBoostProfile">
        {i18n.translate('xpack.boost.profilesTab.createButton', {
          defaultMessage: 'Create boost profile',
        })}
      </EuiButton>
    ) : undefined,
  };

  return (
    <>
      <EuiInMemoryTable
        tableCaption={i18n.translate('xpack.boost.profilesTab.caption', {
          defaultMessage: 'Boost profiles',
        })}
        items={rows}
        itemId="name"
        columns={columns}
        search={search}
        sorting={{ sort: { field: 'name', direction: 'asc' } }}
        pagination={
          rows.length > PAGE_SIZE
            ? { pageSize: PAGE_SIZE, pageSizeOptions: [PAGE_SIZE, 25, 50] }
            : undefined
        }
        data-test-subj="boostProfilesTable"
      />

      {flyout && (
        <ProfileFlyout
          profile={flyout.profile}
          takenNames={profiles.map(({ name }) => name)}
          onClose={() => setFlyout(undefined)}
        />
      )}

      {profileToDelete && (
        <EuiConfirmModal
          aria-labelledby={deleteModalTitleId}
          titleProps={{ id: deleteModalTitleId }}
          title={i18n.translate('xpack.boost.profilesTab.deleteModalTitle', {
            defaultMessage: 'Delete boost profile "{name}"?',
            values: { name: profileToDelete.name },
          })}
          onCancel={() => setProfileToDelete(undefined)}
          onConfirm={() =>
            deleteProfile(profileToDelete.name, {
              onSuccess: () =>
                notifications.toasts.addSuccess(
                  i18n.translate('xpack.boost.profilesTab.deletedToast', {
                    defaultMessage: 'Deleted boost profile "{name}"',
                    values: { name: profileToDelete.name },
                  })
                ),
              onSettled: () => setProfileToDelete(undefined),
            })
          }
          cancelButtonText={i18n.translate('xpack.boost.profilesTab.deleteModalCancel', {
            defaultMessage: 'Cancel',
          })}
          confirmButtonText={i18n.translate('xpack.boost.profilesTab.deleteModalConfirm', {
            defaultMessage: 'Delete profile',
          })}
          buttonColor="danger"
          isLoading={isDeleting}
        >
          <p>
            {i18n.translate('xpack.boost.profilesTab.deleteModalBody', {
              defaultMessage: "This permanently deletes the profile. You can't undo this action.",
            })}
          </p>
        </EuiConfirmModal>
      )}
    </>
  );
};
