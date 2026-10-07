/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { css } from '@emotion/react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiDescribedFormGroup,
  EuiFieldNumber,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiLink,
  EuiPanel,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { CUSTOM_WINDOW_MAX_DAYS, CUSTOM_WINDOW_MIN_DAYS } from '../../common/constants';
import type { DataStreamsWindowId, IndicesPresetId, SimpleModeDefaults } from '../../common/types';
import { useBoostServices } from '../hooks/use_boost_services';
import { useUpdateSimpleDefaults } from '../hooks/use_boost_state';
import { PresetCards } from './preset_cards';
import { TitleWithIcon } from './title_with_icon';
import { DATA_STREAMS_WINDOW_OPTIONS, INDICES_PRESET_OPTIONS } from './preset_options';

interface SimpleModeSettingsProps {
  savedDefaults: SimpleModeDefaults;
  canEdit: boolean;
  onEnableAdvancedMode: () => void;
  isUpdatingMode: boolean;
}

// EuiDescribedFormGroup aligns its columns on text baselines; top-align them instead.
const stretchColumnsCss = css({ alignItems: 'stretch' });

const parseCustomDays = (value: string): number | undefined => {
  const days = Number(value);
  return value.trim() !== '' &&
    Number.isInteger(days) &&
    days >= CUSTOM_WINDOW_MIN_DAYS &&
    days <= CUSTOM_WINDOW_MAX_DAYS
    ? days
    : undefined;
};

export const SimpleModeSettings = ({
  savedDefaults,
  canEdit,
  onEnableAdvancedMode,
  isUpdatingMode,
}: SimpleModeSettingsProps) => {
  const { notifications } = useBoostServices();
  const { mutate: saveDefaults, isLoading: isSaving } = useUpdateSimpleDefaults();

  const [indicesPreset, setIndicesPreset] = useState<IndicesPresetId>(savedDefaults.indices);
  const [dataStreamsWindow, setDataStreamsWindow] = useState<DataStreamsWindowId>(
    savedDefaults.data_streams.window
  );
  const [customDaysText, setCustomDaysText] = useState(
    String(savedDefaults.data_streams.custom_days)
  );

  const resetDraft = useCallback(() => {
    setIndicesPreset(savedDefaults.indices);
    setDataStreamsWindow(savedDefaults.data_streams.window);
    setCustomDaysText(String(savedDefaults.data_streams.custom_days));
  }, [savedDefaults]);

  // Saved defaults change after a save or a reset, so the draft follows them.
  useEffect(() => resetDraft(), [resetDraft]);

  const customDays = parseCustomDays(customDaysText);
  const isCustomDaysInvalid = dataStreamsWindow === 'custom' && customDays === undefined;

  const draft: SimpleModeDefaults = {
    indices: indicesPreset,
    data_streams: {
      window: dataStreamsWindow,
      custom_days: customDays ?? savedDefaults.data_streams.custom_days,
    },
  };
  const isDirty =
    draft.indices !== savedDefaults.indices ||
    draft.data_streams.window !== savedDefaults.data_streams.window ||
    (dataStreamsWindow === 'custom' &&
      customDaysText !== String(savedDefaults.data_streams.custom_days));

  const onSave = () =>
    saveDefaults(draft, {
      onSuccess: () =>
        notifications.toasts.addSuccess(
          i18n.translate('xpack.boost.simpleMode.savedToast', {
            defaultMessage: 'Boost defaults saved',
          })
        ),
    });

  return (
    <EuiFlexGroup direction="column" gutterSize="l">
      <EuiFlexItem grow={false}>
        <EuiPanel hasBorder paddingSize="l">
          <EuiDescribedFormGroup
            ratio="half"
            css={stretchColumnsCss}
            fullWidth
            titleSize="xs"
            title={
              <h2>
                <TitleWithIcon iconType="table">
                  {i18n.translate('xpack.boost.simpleMode.indicesTitle', {
                    defaultMessage: 'Indices',
                  })}
                </TitleWithIcon>
              </h2>
            }
            description={
              <p>
                {i18n.translate('xpack.boost.simpleMode.indicesDescription', {
                  defaultMessage:
                    'Applies to every index in this project. Increase boost for better query throughput as load grows, or decrease it to reduce provisioned resources at the cost of more variable query latency.',
                })}
              </p>
            }
          >
            <PresetCards
              name="indices"
              legend={i18n.translate('xpack.boost.simpleMode.indicesLegend', {
                defaultMessage: 'Default boost for indices',
              })}
              options={INDICES_PRESET_OPTIONS}
              selectedId={indicesPreset}
              onChange={setIndicesPreset}
              disabled={!canEdit || isSaving}
            />
          </EuiDescribedFormGroup>
        </EuiPanel>
      </EuiFlexItem>

      <EuiFlexItem grow={false}>
        <EuiPanel hasBorder paddingSize="l">
          <EuiDescribedFormGroup
            ratio="half"
            css={stretchColumnsCss}
            fullWidth
            titleSize="xs"
            title={
              <h2>
                <TitleWithIcon iconType="productStreamsClassic">
                  {i18n.translate('xpack.boost.simpleMode.dataStreamsTitle', {
                    defaultMessage: 'Data streams',
                  })}
                </TitleWithIcon>
              </h2>
            }
            description={
              <p>
                {i18n.translate('xpack.boost.simpleMode.dataStreamsDescription', {
                  defaultMessage:
                    'Applies to every data stream in this project. Sets how much recent time-series data is kept search-ready. Older data stays searchable, with more variable performance.',
                })}
              </p>
            }
          >
            <PresetCards
              name="dataStreams"
              legend={i18n.translate('xpack.boost.simpleMode.dataStreamsLegend', {
                defaultMessage: 'Default boosted window for data streams',
              })}
              options={DATA_STREAMS_WINDOW_OPTIONS}
              selectedId={dataStreamsWindow}
              onChange={setDataStreamsWindow}
              disabled={!canEdit || isSaving}
              selectedOptionContent={{
                custom: (
                  <EuiFormRow
                    fullWidth
                    isInvalid={isCustomDaysInvalid}
                    error={i18n.translate('xpack.boost.simpleMode.customDaysError', {
                      defaultMessage: 'Enter a whole number from {min} to {max}.',
                      values: { min: CUSTOM_WINDOW_MIN_DAYS, max: CUSTOM_WINDOW_MAX_DAYS },
                    })}
                  >
                    <EuiFieldNumber
                      compressed
                      fullWidth
                      aria-label={i18n.translate('xpack.boost.simpleMode.customDaysAriaLabel', {
                        defaultMessage: 'Boosted window in days',
                      })}
                      value={customDaysText}
                      onChange={({ target: { value } }) => setCustomDaysText(value)}
                      min={CUSTOM_WINDOW_MIN_DAYS}
                      max={CUSTOM_WINDOW_MAX_DAYS}
                      step={1}
                      append={i18n.translate('xpack.boost.simpleMode.customDaysUnit', {
                        defaultMessage: 'days',
                      })}
                      isInvalid={isCustomDaysInvalid}
                      disabled={!canEdit || isSaving}
                      data-test-subj="customWindowDays"
                    />
                  </EuiFormRow>
                ),
              }}
            />
          </EuiDescribedFormGroup>
        </EuiPanel>
      </EuiFlexItem>

      {canEdit && (
        <EuiFlexItem grow={false}>
          <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" gutterSize="m">
            <EuiFlexItem grow={false}>
              <EuiText size="s" color="subdued">
                <p>
                  <FormattedMessage
                    id="xpack.boost.simpleMode.advancedModePrompt"
                    defaultMessage="Need to tune specific indices or data streams? {link}"
                    values={{
                      link: (
                        <EuiLink
                          onClick={onEnableAdvancedMode}
                          disabled={isUpdatingMode}
                          data-test-subj="enableAdvancedModeLink"
                        >
                          {i18n.translate('xpack.boost.simpleMode.advancedModeLink', {
                            defaultMessage: 'Try advanced mode',
                          })}
                        </EuiLink>
                      ),
                    }}
                  />
                </p>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiFlexGroup gutterSize="s" responsive={false}>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty
                    size="s"
                    onClick={resetDraft}
                    isDisabled={!isDirty || isSaving}
                    data-test-subj="discardSimpleDefaults"
                  >
                    {i18n.translate('xpack.boost.simpleMode.discardButton', {
                      defaultMessage: 'Discard changes',
                    })}
                  </EuiButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButton
                    fill
                    size="s"
                    onClick={onSave}
                    isLoading={isSaving}
                    isDisabled={!isDirty || isCustomDaysInvalid}
                    data-test-subj="saveSimpleDefaults"
                  >
                    {i18n.translate('xpack.boost.simpleMode.saveButton', {
                      defaultMessage: 'Save changes',
                    })}
                  </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};
