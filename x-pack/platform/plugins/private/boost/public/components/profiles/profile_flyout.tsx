/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiFieldNumber,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiFormRow,
  EuiSpacer,
  EuiSwitch,
  EuiText,
  EuiTitle,
  useGeneratedHtmlId,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { MAX_BOOST, MIN_BOOST } from '../../../common/constants';
import type { BoostProfile, BoostProfileType } from '../../../common/types';
import type { BoostRangeError, MaxAgeError } from '../../../common/validation';
import { useBoostServices } from '../../hooks/use_boost_services';
import { useCreateProfile, useUpdateProfile } from '../../hooks/use_boost_state';
import { PresetCards } from '../preset_cards';
import type { PresetOption } from '../preset_options';
import type { BoostRangeDraft, ProfileDraft } from './profile_draft';
import {
  createEmptyDraft,
  draftFromProfile,
  draftToProfileInput,
  getDraftErrors,
  hasDraftErrors,
} from './profile_draft';
import {
  BOOST_RANGE_ERROR_MESSAGES,
  MAX_AGE_ERROR_MESSAGES,
  PROFILE_NAME_ERROR_MESSAGES,
} from './profile_messages';

interface ProfileFlyoutProps {
  /** The custom profile to edit; omit to create a new profile. */
  profile?: BoostProfile;
  takenNames: readonly string[];
  onClose: () => void;
}

const TYPE_OPTIONS: ReadonlyArray<PresetOption<BoostProfileType>> = [
  {
    id: 'indices',
    label: i18n.translate('xpack.boost.profileForm.indicesType', { defaultMessage: 'Indices' }),
    description: i18n.translate('xpack.boost.profileForm.indicesTypeDescription', {
      defaultMessage: 'Regular indices. Supports an extra copy, prewarm, and pin.',
    }),
    isDefault: false,
  },
  {
    id: 'data_streams',
    label: i18n.translate('xpack.boost.profileForm.dataStreamsType', {
      defaultMessage: 'Data streams',
    }),
    description: i18n.translate('xpack.boost.profileForm.dataStreamsTypeDescription', {
      defaultMessage: 'Time-series data, boosted by age: recent, standard, and background.',
    }),
    isDefault: false,
  },
];

const BOOST_HINT = i18n.translate('xpack.boost.profileForm.boostHint', {
  defaultMessage: '{min} to {max}',
  values: { min: MIN_BOOST, max: MAX_BOOST.toLocaleString(i18n.getLocale()) },
});

const DAYS_UNIT = i18n.translate('xpack.boost.profileForm.daysUnit', { defaultMessage: 'days' });

interface BoostRangeFieldsProps {
  range: BoostRangeDraft;
  onChange: (range: BoostRangeDraft) => void;
  error?: BoostRangeError;
  maxAge?: { days: string; onChange: (days: string) => void; error?: MaxAgeError };
  disabled: boolean;
  testSubjPrefix: string;
}

/** Minimum and maximum boost inputs, plus an optional max age input for data stream periods. */
const BoostRangeFields = ({
  range,
  onChange,
  error,
  maxAge,
  disabled,
  testSubjPrefix,
}: BoostRangeFieldsProps) => {
  const errorMessage = error && BOOST_RANGE_ERROR_MESSAGES[error];
  const minError = errorMessage?.field === 'min' ? errorMessage.message : undefined;
  const maxError = errorMessage?.field === 'max' ? errorMessage.message : undefined;
  const maxAgeError = maxAge?.error && MAX_AGE_ERROR_MESSAGES[maxAge.error];

  return (
    <EuiFlexGroup gutterSize="m">
      <EuiFlexItem>
        <EuiFormRow
          label={i18n.translate('xpack.boost.profileForm.minBoostLabel', {
            defaultMessage: 'Minimum boost',
          })}
          helpText={BOOST_HINT}
          isInvalid={Boolean(minError)}
          error={minError}
        >
          <EuiFieldNumber
            value={range.minBoost}
            onChange={({ target: { value } }) => onChange({ ...range, minBoost: value })}
            min={MIN_BOOST}
            max={MAX_BOOST}
            step="any"
            isInvalid={Boolean(minError)}
            disabled={disabled}
            data-test-subj={`${testSubjPrefix}MinBoost`}
          />
        </EuiFormRow>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiFormRow
          label={i18n.translate('xpack.boost.profileForm.maxBoostLabel', {
            defaultMessage: 'Maximum boost',
          })}
          helpText={BOOST_HINT}
          isInvalid={Boolean(maxError)}
          error={maxError}
        >
          <EuiFieldNumber
            value={range.maxBoost}
            onChange={({ target: { value } }) => onChange({ ...range, maxBoost: value })}
            min={MIN_BOOST}
            max={MAX_BOOST}
            step="any"
            isInvalid={Boolean(maxError)}
            disabled={disabled}
            data-test-subj={`${testSubjPrefix}MaxBoost`}
          />
        </EuiFormRow>
      </EuiFlexItem>
      {maxAge && (
        <EuiFlexItem>
          <EuiFormRow
            label={i18n.translate('xpack.boost.profileForm.maxAgeLabel', {
              defaultMessage: 'Max age',
            })}
            isInvalid={Boolean(maxAgeError)}
            error={maxAgeError}
          >
            <EuiFieldNumber
              value={maxAge.days}
              onChange={({ target: { value } }) => maxAge.onChange(value)}
              min={1}
              step={1}
              append={DAYS_UNIT}
              isInvalid={Boolean(maxAgeError)}
              disabled={disabled}
              data-test-subj={`${testSubjPrefix}MaxAge`}
            />
          </EuiFormRow>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};

const PeriodHeading = ({ title, description }: { title: string; description: string }) => (
  <>
    <EuiTitle size="xxs">
      <h4>{title}</h4>
    </EuiTitle>
    <EuiText size="xs" color="subdued">
      <p>{description}</p>
    </EuiText>
    <EuiSpacer size="s" />
  </>
);

export const ProfileFlyout = ({ profile, takenNames, onClose }: ProfileFlyoutProps) => {
  const { notifications } = useBoostServices();
  const titleId = useGeneratedHtmlId();
  const isEditing = profile !== undefined;

  const [draft, setDraft] = useState<ProfileDraft>(() =>
    profile ? draftFromProfile(profile) : createEmptyDraft()
  );
  const [showErrors, setShowErrors] = useState(false);
  const [savedProfileName, setSavedProfileName] = useState<string | undefined>();

  const { mutate: createProfile, isLoading: isCreating } = useCreateProfile();
  const { mutate: updateProfile, isLoading: isUpdating } = useUpdateProfile();
  const isSaving = isCreating || isUpdating;

  const errors = getDraftErrors(draft, isEditing ? [] : takenNames);
  const visibleErrors = showErrors ? errors : {};

  const updateDraft = (changes: Partial<ProfileDraft>) => setDraft({ ...draft, ...changes });
  const { indices, dataStreams } = draft;

  const onSave = (createRule: boolean) => {
    if (hasDraftErrors(errors)) {
      setShowErrors(true);
      return;
    }

    const save = isEditing ? updateProfile : createProfile;
    save(draftToProfileInput(draft), {
      onSuccess: () => {
        notifications.toasts.addSuccess(
          i18n.translate('xpack.boost.profileForm.savedToast', {
            defaultMessage: 'Saved boost profile "{name}"',
            values: { name: draft.name },
          })
        );
        if (createRule) {
          setSavedProfileName(draft.name);
        } else {
          onClose();
        }
      },
    });
  };

  if (savedProfileName) {
    // Placeholder for the rule step, which arrives with the Boost rules tab.
    return (
      <EuiFlyout onClose={onClose} size="m" aria-labelledby={titleId} ownFocus>
        <EuiFlyoutHeader hasBorder>
          <EuiTitle size="m">
            <h2 id={titleId}>
              {i18n.translate('xpack.boost.profileForm.createRuleTitle', {
                defaultMessage: 'Create boost rule',
              })}
            </h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <EuiText>
            <p>
              {i18n.translate('xpack.boost.profileForm.createRulePlaceholder', {
                defaultMessage:
                  'The rule form for "{name}" comes with the Boost rules tab, the next prototype step.',
                values: { name: savedProfileName },
              })}
            </p>
          </EuiText>
        </EuiFlyoutBody>
        <EuiFlyoutFooter>
          <EuiButtonEmpty onClick={onClose} flush="left">
            {i18n.translate('xpack.boost.profileForm.closeButton', { defaultMessage: 'Close' })}
          </EuiButtonEmpty>
        </EuiFlyoutFooter>
      </EuiFlyout>
    );
  }

  const nameError = visibleErrors.name && PROFILE_NAME_ERROR_MESSAGES[visibleErrors.name];

  return (
    <EuiFlyout
      onClose={onClose}
      size="m"
      aria-labelledby={titleId}
      ownFocus
      data-test-subj="boostProfileFlyout"
    >
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h2 id={titleId}>
            {isEditing
              ? i18n.translate('xpack.boost.profileForm.editTitle', {
                  defaultMessage: 'Edit boost profile',
                })
              : i18n.translate('xpack.boost.profileForm.createTitle', {
                  defaultMessage: 'Create boost profile',
                })}
          </h2>
        </EuiTitle>
      </EuiFlyoutHeader>

      <EuiFlyoutBody>
        <EuiFormRow
          label={i18n.translate('xpack.boost.profileForm.nameLabel', { defaultMessage: 'Name' })}
          helpText={
            isEditing
              ? i18n.translate('xpack.boost.profileForm.nameLockedHelp', {
                  defaultMessage: "Profile names can't be changed.",
                })
              : i18n.translate('xpack.boost.profileForm.nameHelp', {
                  defaultMessage: 'Lowercase letters, numbers, hyphens, and underscores.',
                })
          }
          isInvalid={Boolean(nameError)}
          error={nameError}
          fullWidth
        >
          <EuiFieldText
            value={draft.name}
            onChange={({ target: { value } }) => updateDraft({ name: value })}
            isInvalid={Boolean(nameError)}
            disabled={isEditing || isSaving}
            fullWidth
            data-test-subj="boostProfileName"
          />
        </EuiFormRow>

        <EuiSpacer size="l" />
        <EuiTitle size="xs">
          <h3>{i18n.translate('xpack.boost.profileForm.typeTitle', { defaultMessage: 'Type' })}</h3>
        </EuiTitle>
        <EuiText size="xs" color="subdued">
          <p>
            {isEditing
              ? i18n.translate('xpack.boost.profileForm.typeLockedHelp', {
                  defaultMessage: "The type can't be changed after the profile is created.",
                })
              : i18n.translate('xpack.boost.profileForm.typeHelp', {
                  defaultMessage:
                    'Index profiles and data stream profiles have different settings, so a profile applies to one or the other.',
                })}
          </p>
        </EuiText>
        <EuiSpacer size="s" />
        <PresetCards
          name="boostProfileType"
          legend={i18n.translate('xpack.boost.profileForm.typeLegend', {
            defaultMessage: 'Profile type',
          })}
          options={TYPE_OPTIONS}
          selectedId={draft.type}
          onChange={(type) => updateDraft({ type })}
          disabled={isEditing || isSaving}
        />

        <EuiSpacer size="l" />
        <EuiTitle size="xs">
          <h3>
            {i18n.translate('xpack.boost.profileForm.boostTitle', { defaultMessage: 'Boost' })}
          </h3>
        </EuiTitle>
        <EuiText size="xs" color="subdued">
          <p>
            {i18n.translate('xpack.boost.profileForm.boostDescription', {
              defaultMessage:
                'Boost 1 is the default experience. Higher values keep more resources ready for query throughput; lower values reduce resources and cost.',
            })}
          </p>
        </EuiText>
        <EuiSpacer size="m" />

        {draft.type === 'indices' ? (
          <>
            <BoostRangeFields
              range={indices}
              onChange={(range) => updateDraft({ indices: { ...indices, ...range } })}
              error={visibleErrors.indicesRange}
              disabled={isSaving}
              testSubjPrefix="indices"
            />
            <EuiSpacer size="l" />
            <EuiTitle size="xs">
              <h3>
                {i18n.translate('xpack.boost.profileForm.optionsTitle', {
                  defaultMessage: 'Additional options',
                })}
              </h3>
            </EuiTitle>
            <EuiSpacer size="s" />
            <EuiFormRow
              label={i18n.translate('xpack.boost.profileForm.highAvailabilityLabel', {
                defaultMessage: 'High availability',
              })}
            >
              <EuiSwitch
                label={i18n.translate('xpack.boost.profileForm.extraCopySwitch', {
                  defaultMessage:
                    "Extra copy: keep an additional copy so search isn't affected if one copy becomes unavailable",
                })}
                checked={indices.extraCopy}
                onChange={({ target: { checked } }) =>
                  updateDraft({ indices: { ...indices, extraCopy: checked } })
                }
                disabled={isSaving}
              />
            </EuiFormRow>
            <EuiFormRow
              label={i18n.translate('xpack.boost.profileForm.prewarmLabel', {
                defaultMessage: 'Prewarm',
              })}
            >
              <EuiSwitch
                label={i18n.translate('xpack.boost.profileForm.prewarmSwitch', {
                  defaultMessage:
                    "Load data into cache ahead of time so the first query doesn't wait",
                })}
                checked={indices.prewarm}
                onChange={({ target: { checked } }) =>
                  updateDraft({ indices: { ...indices, prewarm: checked } })
                }
                disabled={isSaving}
              />
            </EuiFormRow>
            <EuiFormRow
              label={i18n.translate('xpack.boost.profileForm.pinLabel', { defaultMessage: 'Pin' })}
            >
              <EuiSwitch
                label={i18n.translate('xpack.boost.profileForm.pinSwitch', {
                  defaultMessage: "Don't evict cached data",
                })}
                checked={indices.pinned}
                onChange={({ target: { checked } }) =>
                  updateDraft({ indices: { ...indices, pinned: checked } })
                }
                disabled={isSaving}
              />
            </EuiFormRow>
          </>
        ) : (
          <>
            <PeriodHeading
              title={i18n.translate('xpack.boost.profileForm.recentTitle', {
                defaultMessage: 'Recent',
              })}
              description={i18n.translate('xpack.boost.profileForm.recentDescription', {
                defaultMessage: 'The newest data, which is usually searched most often.',
              })}
            />
            <BoostRangeFields
              range={dataStreams.recent}
              onChange={(range) =>
                updateDraft({
                  dataStreams: { ...dataStreams, recent: { ...dataStreams.recent, ...range } },
                })
              }
              error={visibleErrors.recentRange}
              maxAge={{
                days: dataStreams.recent.maxAgeDays,
                onChange: (maxAgeDays) =>
                  updateDraft({
                    dataStreams: {
                      ...dataStreams,
                      recent: { ...dataStreams.recent, maxAgeDays },
                    },
                  }),
                error: visibleErrors.recentMaxAge,
              }}
              disabled={isSaving}
              testSubjPrefix="recent"
            />
            <EuiSpacer size="l" />
            <PeriodHeading
              title={i18n.translate('xpack.boost.profileForm.standardTitle', {
                defaultMessage: 'Standard',
              })}
              description={i18n.translate('xpack.boost.profileForm.standardDescription', {
                defaultMessage: 'Data older than the recent period, up to this max age.',
              })}
            />
            <BoostRangeFields
              range={dataStreams.standard}
              onChange={(range) =>
                updateDraft({
                  dataStreams: { ...dataStreams, standard: { ...dataStreams.standard, ...range } },
                })
              }
              error={visibleErrors.standardRange}
              maxAge={{
                days: dataStreams.standard.maxAgeDays,
                onChange: (maxAgeDays) =>
                  updateDraft({
                    dataStreams: {
                      ...dataStreams,
                      standard: { ...dataStreams.standard, maxAgeDays },
                    },
                  }),
                error: visibleErrors.standardMaxAge,
              }}
              disabled={isSaving}
              testSubjPrefix="standard"
            />
            <EuiSpacer size="l" />
            <PeriodHeading
              title={i18n.translate('xpack.boost.profileForm.backgroundTitle', {
                defaultMessage: 'Background',
              })}
              description={i18n.translate('xpack.boost.profileForm.backgroundDescription', {
                defaultMessage: 'All data older than the standard period.',
              })}
            />
            <BoostRangeFields
              range={dataStreams.background}
              onChange={(background) =>
                updateDraft({ dataStreams: { ...dataStreams, background } })
              }
              error={visibleErrors.backgroundRange}
              disabled={isSaving}
              testSubjPrefix="background"
            />
          </>
        )}
      </EuiFlyoutBody>

      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="spaceBetween" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty onClick={onClose} flush="left" data-test-subj="boostProfileCancel">
              {i18n.translate('xpack.boost.profileForm.cancelButton', {
                defaultMessage: 'Cancel',
              })}
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="s" responsive={false}>
              {isEditing ? (
                <EuiFlexItem grow={false}>
                  <EuiButton
                    fill
                    onClick={() => onSave(false)}
                    isLoading={isSaving}
                    data-test-subj="boostProfileSave"
                  >
                    {i18n.translate('xpack.boost.profileForm.saveChangesButton', {
                      defaultMessage: 'Save changes',
                    })}
                  </EuiButton>
                </EuiFlexItem>
              ) : (
                <>
                  <EuiFlexItem grow={false}>
                    <EuiButton
                      onClick={() => onSave(false)}
                      isLoading={isSaving}
                      data-test-subj="boostProfileSave"
                    >
                      {i18n.translate('xpack.boost.profileForm.saveButton', {
                        defaultMessage: 'Save',
                      })}
                    </EuiButton>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButton
                      fill
                      onClick={() => onSave(true)}
                      isLoading={isSaving}
                      data-test-subj="boostProfileSaveAndCreateRule"
                    >
                      {i18n.translate('xpack.boost.profileForm.saveAndCreateRuleButton', {
                        defaultMessage: 'Save and create rule',
                      })}
                    </EuiButton>
                  </EuiFlexItem>
                </>
              )}
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
};
