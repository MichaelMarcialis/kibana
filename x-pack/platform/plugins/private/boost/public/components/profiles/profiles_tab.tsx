/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState } from 'react';
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
  useGeneratedHtmlId,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { BoostProfile, BoostRule } from '../../../common/types';
import { useBoostServices } from '../../hooks/use_boost_services';
import { useDeleteProfile } from '../../hooks/use_boost_state';
import { PROFILE_TYPE_LABELS, formatBoostRange } from '../format';
import { ProfileFlyout } from './profile_flyout';

interface ProfilesTabProps {
  profiles: BoostProfile[];
  rules: BoostRule[];
  canEdit: boolean;
}

type FlyoutState = { profile?: BoostProfile } | undefined;

const DEFAULT_BADGE_LABELS: Readonly<Record<BoostProfile['type'], string>> = {
  indices: i18n.translate('xpack.boost.profilesTab.defaultForIndices', {
    defaultMessage: 'Default for indices',
  }),
  data_streams: i18n.translate('xpack.boost.profilesTab.defaultForDataStreams', {
    defaultMessage: 'Default for data streams',
  }),
};

const getIndicesOptions = (profile: BoostProfile): string[] => {
  if (profile.type !== 'indices') {
    return [];
  }
  return [
    profile.high_availability === 'one_extra_copy'
      ? i18n.translate('xpack.boost.profilesTab.extraCopy', { defaultMessage: 'Extra copy' })
      : undefined,
    profile.prewarm
      ? i18n.translate('xpack.boost.profilesTab.prewarm', { defaultMessage: 'Prewarm' })
      : undefined,
    profile.pinned
      ? i18n.translate('xpack.boost.profilesTab.pin', { defaultMessage: 'Pin' })
      : undefined,
  ].filter((option): option is string => option !== undefined);
};

const getDetails = (profile: BoostProfile): string =>
  profile.type === 'indices'
    ? getIndicesOptions(profile).join(' · ') || '—'
    : i18n.translate('xpack.boost.profilesTab.dataStreamWindows', {
        defaultMessage: 'Recent up to {recent} · Standard up to {standard}',
        values: { recent: profile.recent.max_age, standard: profile.standard.max_age },
      });

export const ProfilesTab = ({ profiles, rules, canEdit }: ProfilesTabProps) => {
  const { notifications } = useBoostServices();
  const deleteModalTitleId = useGeneratedHtmlId();
  const [flyout, setFlyout] = useState<FlyoutState>();
  const [profileToDelete, setProfileToDelete] = useState<BoostProfile>();
  const { mutate: deleteProfile, isLoading: isDeleting } = useDeleteProfile();

  const defaultProfileNames = new Set(
    rules.filter(({ is_builtin: isBuiltin }) => isBuiltin).map(({ boost_profile: name }) => name)
  );

  const actionsColumn: EuiTableActionsColumnType<BoostProfile> = {
    name: i18n.translate('xpack.boost.profilesTab.actionsColumn', {
      defaultMessage: 'Actions',
    }),
    actions: [
      {
        name: i18n.translate('xpack.boost.profilesTab.editAction', {
          defaultMessage: 'Edit',
        }),
        description: i18n.translate('xpack.boost.profilesTab.editActionDescription', {
          defaultMessage: 'Edit this boost profile',
        }),
        icon: 'pencil',
        type: 'icon',
        available: ({ is_builtin: isBuiltin }: BoostProfile) => !isBuiltin,
        onClick: (profile: BoostProfile) => setFlyout({ profile }),
        'data-test-subj': 'editBoostProfile',
      },
      {
        name: i18n.translate('xpack.boost.profilesTab.deleteAction', {
          defaultMessage: 'Delete',
        }),
        description: i18n.translate('xpack.boost.profilesTab.deleteActionDescription', {
          defaultMessage: 'Delete this boost profile',
        }),
        icon: 'trash',
        color: 'danger',
        type: 'icon',
        available: ({ is_builtin: isBuiltin }: BoostProfile) => !isBuiltin,
        onClick: setProfileToDelete,
        'data-test-subj': 'deleteBoostProfile',
      },
    ],
  };

  const columns: Array<EuiBasicTableColumn<BoostProfile>> = [
    {
      field: 'name',
      name: i18n.translate('xpack.boost.profilesTab.nameColumn', { defaultMessage: 'Name' }),
      sortable: true,
      render: (name: string, profile: BoostProfile) => (
        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} wrap>
          <EuiFlexItem grow={false}>{name}</EuiFlexItem>
          {profile.is_builtin && (
            <EuiFlexItem grow={false}>
              <EuiBadge color="hollow">
                {i18n.translate('xpack.boost.profilesTab.elasticBadge', {
                  defaultMessage: 'Elastic',
                })}
              </EuiBadge>
            </EuiFlexItem>
          )}
          {defaultProfileNames.has(name) && (
            <EuiFlexItem grow={false}>
              <EuiBadge>{DEFAULT_BADGE_LABELS[profile.type]}</EuiBadge>
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
      render: (profile: BoostProfile) =>
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
      name: i18n.translate('xpack.boost.profilesTab.detailsColumn', { defaultMessage: 'Details' }),
      render: getDetails,
    },
    ...(canEdit ? [actionsColumn] : []),
  ];

  const search: EuiSearchBarProps = {
    box: {
      incremental: true,
      placeholder: i18n.translate('xpack.boost.profilesTab.searchPlaceholder', {
        defaultMessage: 'Search boost profiles',
      }),
    },
    filters: [
      {
        type: 'field_value_selection',
        field: 'type',
        name: i18n.translate('xpack.boost.profilesTab.typeFilter', { defaultMessage: 'Type' }),
        multiSelect: false,
        options: [
          { value: 'indices', name: PROFILE_TYPE_LABELS.indices },
          { value: 'data_streams', name: PROFILE_TYPE_LABELS.data_streams },
        ],
      },
    ],
    toolsRight: canEdit ? (
      <EuiButton
        fill
        iconType="plusInCircle"
        onClick={() => setFlyout({})}
        data-test-subj="createBoostProfile"
      >
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
        items={profiles}
        itemId="name"
        columns={columns}
        search={search}
        pagination={false}
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
