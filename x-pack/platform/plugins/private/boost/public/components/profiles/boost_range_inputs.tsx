/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiFieldNumber, EuiFlexGroup, EuiFlexItem, EuiFormRow } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { MAX_BOOST, MIN_BOOST } from '../../../common/constants';
import type { BoostRangeError } from '../../../common/validation';
import type { BoostRangeDraft } from './profile_draft';
import { BOOST_RANGE_ERROR_MESSAGES } from './profile_messages';

interface BoostRangeInputsProps {
  range: BoostRangeDraft;
  onChange: (range: BoostRangeDraft) => void;
  /** Validation error to display; omitted until the user first tries to save. */
  error?: BoostRangeError;
  disabled: boolean;
  testSubjPrefix: string;
}

/** Side-by-side minimum and maximum boost inputs. */
export const BoostRangeInputs = ({
  range,
  onChange,
  error,
  disabled,
  testSubjPrefix,
}: BoostRangeInputsProps) => {
  const errorMessage = error && BOOST_RANGE_ERROR_MESSAGES[error];
  const minError = errorMessage?.field === 'min' ? errorMessage.message : undefined;
  const maxError = errorMessage?.field === 'max' ? errorMessage.message : undefined;

  return (
    <EuiFlexGroup gutterSize="s" responsive={false}>
      <EuiFlexItem>
        <EuiFormRow
          display="rowCompressed"
          label={i18n.translate('xpack.boost.profileForm.minBoostInputLabel', {
            defaultMessage: 'Min boost',
          })}
          isInvalid={Boolean(minError)}
          error={minError}
          fullWidth
        >
          <EuiFieldNumber
            compressed
            fullWidth
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
          label={i18n.translate('xpack.boost.profileForm.maxBoostInputLabel', {
            defaultMessage: 'Max boost',
          })}
          isInvalid={Boolean(maxError)}
          error={maxError}
          fullWidth
        >
          <EuiFieldNumber
            compressed
            fullWidth
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
    </EuiFlexGroup>
  );
};
