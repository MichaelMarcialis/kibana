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
  EuiCheckableCard,
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
import { CardLabel } from '../card_label';
import { PresetCards } from '../preset_cards';
import type { PresetOption } from '../preset_options';
import { BoostRangeInputs } from './boost_range_inputs';
import { FormSection } from './form_section';
import { FullWidthDivider } from './full_width_divider';
import type { BoostRangeDraft, ProfileDraft } from './profile_draft';
import {
  createEmptyDraft,
  draftFromProfile,
  getCopyName,
  draftToProfileInput,
  getDraftErrors,
  getDraftEstimate,
  hasDraftErrors,
} from './profile_draft';
import {
  BOOST_RANGE_ERROR_MESSAGES,
  MAX_AGE_ERROR_MESSAGES,
  PROFILE_NAME_ERROR_MESSAGES,
} from './profile_messages';
import { ProfileEstimate } from './profile_estimate';

interface ProfileFlyoutProps {
  /** The custom profile to edit. */
  profile?: BoostProfile;
  /** A profile to copy into a new profile. Ignored when editing. */
  duplicateOf?: BoostProfile;
  takenNames: readonly string[];
  onClose: () => void;
}

const getInitialDraft = (
  profile: BoostProfile | undefined,
  duplicateOf: BoostProfile | undefined,
  takenNames: readonly string[]
): ProfileDraft => {
  if (profile) {
    return draftFromProfile(profile);
  }
  if (duplicateOf) {
    return { ...draftFromProfile(duplicateOf), name: getCopyName(duplicateOf.name, takenNames) };
  }
  return createEmptyDraft();
};

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

const INDEX_OPTIONS: ReadonlyArray<{
  key: 'extraCopy' | 'prewarm' | 'pinned';
  title: string;
  description: string;
}> = [
  {
    key: 'extraCopy',
    title: i18n.translate('xpack.boost.profileForm.extraCopyTitle', {
      defaultMessage: 'One extra copy',
    }),
    description: i18n.translate('xpack.boost.profileForm.extraCopyDescription', {
      defaultMessage:
        "Keep an additional copy of the data so search isn't affected if one copy becomes unavailable.",
    }),
  },
  {
    key: 'prewarm',
    title: i18n.translate('xpack.boost.profileForm.prewarmTitle', { defaultMessage: 'Prewarm' }),
    description: i18n.translate('xpack.boost.profileForm.prewarmDescription', {
      defaultMessage: "Load data into cache ahead of time so the first query doesn't wait.",
    }),
  },
  {
    key: 'pinned',
    title: i18n.translate('xpack.boost.profileForm.pinTitle', { defaultMessage: 'Pin' }),
    description: i18n.translate('xpack.boost.profileForm.pinDescription', {
      defaultMessage: "Don't evict cached data.",
    }),
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
          display="rowCompressed"
          label={i18n.translate('xpack.boost.profileForm.minBoostLabel', {
            defaultMessage: 'Minimum boost',
          })}
          helpText={BOOST_HINT}
          isInvalid={Boolean(minError)}
          error={minError}
        >
          <EuiFieldNumber
            compressed
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
          display="rowCompressed"
          label={i18n.translate('xpack.boost.profileForm.maxBoostLabel', {
            defaultMessage: 'Maximum boost',
          })}
          helpText={BOOST_HINT}
          isInvalid={Boolean(maxError)}
          error={maxError}
        >
          <EuiFieldNumber
            compressed
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
            display="rowCompressed"
            label={i18n.translate('xpack.boost.profileForm.maxAgeLabel', {
              defaultMessage: 'Max age',
            })}
            isInvalid={Boolean(maxAgeError)}
            error={maxAgeError}
          >
            <EuiFieldNumber
              compressed
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

export const ProfileFlyout = ({
  profile,
  duplicateOf,
  takenNames,
  onClose,
}: ProfileFlyoutProps) => {
  const { notifications } = useBoostServices();
  const titleId = useGeneratedHtmlId();
  const optionsId = useGeneratedHtmlId({ prefix: 'boostProfileOptions' });
  const isEditing = profile !== undefined;

  const [draft, setDraft] = useState<ProfileDraft>(() =>
    getInitialDraft(profile, duplicateOf, takenNames)
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
      <EuiFlyout onClose={onClose} size="m" paddingSize="m" aria-labelledby={titleId} ownFocus>
        <EuiFlyoutHeader hasBorder>
          <EuiTitle size="s">
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
          <EuiButtonEmpty size="s" onClick={onClose} flush="left">
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
      paddingSize="m"
      aria-labelledby={titleId}
      ownFocus
      data-test-subj="boostProfileFlyout"
    >
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="s">
          <h2 id={titleId}>
            {isEditing
              ? i18n.translate('xpack.boost.profileForm.editTitle', {
                  defaultMessage: 'Edit boost profile',
                })
              : duplicateOf
              ? i18n.translate('xpack.boost.profileForm.duplicateTitle', {
                  defaultMessage: 'Duplicate boost profile',
                })
              : i18n.translate('xpack.boost.profileForm.createTitle', {
                  defaultMessage: 'Create boost profile',
                })}
          </h2>
        </EuiTitle>
      </EuiFlyoutHeader>

      <EuiFlyoutBody>
        <EuiFormRow
          display="rowCompressed"
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
            compressed
            value={draft.name}
            onChange={({ target: { value } }) => updateDraft({ name: value })}
            isInvalid={Boolean(nameError)}
            disabled={isEditing || isSaving}
            fullWidth
            data-test-subj="boostProfileName"
          />
        </EuiFormRow>

        <FormSection
          title={i18n.translate('xpack.boost.profileForm.typeTitle', { defaultMessage: 'Type' })}
          description={i18n.translate('xpack.boost.profileForm.typeDescription', {
            defaultMessage: "The type can't be changed after the profile is created.",
          })}
        >
          <PresetCards
            name="boostProfileType"
            options={TYPE_OPTIONS}
            selectedId={draft.type}
            onChange={(type) => updateDraft({ type })}
            disabled={isEditing || isSaving}
            direction="row"
          />
        </FormSection>

        {draft.type === 'indices' ? (
          <>
            <FormSection
              title={i18n.translate('xpack.boost.profileForm.boostTitle', {
                defaultMessage: 'Boost',
              })}
              description={i18n.translate('xpack.boost.profileForm.indicesBoostDescription', {
                defaultMessage:
                  'Boost 1 is the default experience. Higher values keep more resources ready for query throughput; lower values reduce resources and cost. Enter values from {min} to {max}.',
                values: { min: MIN_BOOST, max: MAX_BOOST.toLocaleString(i18n.getLocale()) },
              })}
            >
              <BoostRangeInputs
                range={indices}
                onChange={(range) => updateDraft({ indices: { ...indices, ...range } })}
                error={visibleErrors.indicesRange}
                disabled={isSaving}
                testSubjPrefix="indices"
              />
            </FormSection>
            <FormSection
              title={i18n.translate('xpack.boost.profileForm.optionsTitle', {
                defaultMessage: 'Additional options',
              })}
            >
              <EuiFlexGroup direction="column" gutterSize="s">
                {INDEX_OPTIONS.map(({ key, title, description }) => (
                  <EuiFlexItem key={key}>
                    <EuiCheckableCard
                      id={`${optionsId}-${key}`}
                      checkableType="checkbox"
                      label={<CardLabel title={title} description={description} />}
                      checked={indices[key]}
                      onChange={() =>
                        updateDraft({ indices: { ...indices, [key]: !indices[key] } })
                      }
                      disabled={isSaving}
                      data-test-subj={`boostProfileOption-${key}`}
                    />
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
            </FormSection>
          </>
        ) : (
          <FormSection
            title={i18n.translate('xpack.boost.profileForm.boostTitle', {
              defaultMessage: 'Boost',
            })}
            description={i18n.translate('xpack.boost.profileForm.boostDescription', {
              defaultMessage:
                'Boost 1 is the default experience. Higher values keep more resources ready for query throughput; lower values reduce resources and cost.',
            })}
          >
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
          </FormSection>
        )}
      </EuiFlyoutBody>

      <EuiFlyoutFooter>
        <ProfileEstimate
          estimate={getDraftEstimate(draft)}
          savedEstimate={profile && getDraftEstimate(draftFromProfile(profile))}
        />
        <FullWidthDivider margin="s" />
        <EuiFlexGroup justifyContent="spaceBetween" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="s"
              onClick={onClose}
              flush="left"
              data-test-subj="boostProfileCancel"
            >
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
                    size="s"
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
                      size="s"
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
                      size="s"
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
