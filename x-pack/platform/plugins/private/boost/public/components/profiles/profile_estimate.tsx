/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import {
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIconTip,
  EuiText,
  EuiToolTip,
  useEuiTheme,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { VcuRange } from '../../../common/vcu_estimate';
import { ESTIMATE_DATA_GB } from '../../../common/vcu_estimate';

interface ProfileEstimateProps {
  /** Omitted while the profile has invalid values. */
  estimate?: VcuRange;
  /** The saved profile's estimate, when editing, so changes can show how they compare. */
  savedEstimate?: VcuRange;
}

// Rounds to the displayed precision, so comparisons and deltas match what users see.
const roundVcus = (vcus: number): number =>
  vcus < 10 ? Math.round(vcus * 10) / 10 : Math.round(vcus);

const formatVcus = (vcus: number): string =>
  new Intl.NumberFormat(i18n.getLocale(), { maximumFractionDigits: 1 }).format(vcus);

const getValueText = (end: keyof VcuRange, vcus: number): string =>
  end === 'atRest'
    ? i18n.translate('xpack.boost.profileEstimate.atRestValue', {
        defaultMessage: '{value} {count, plural, one {VCU} other {VCUs}} at rest',
        values: { value: formatVcus(vcus), count: vcus },
      })
    : i18n.translate('xpack.boost.profileEstimate.atPeakValue', {
        defaultMessage: '{value} {count, plural, one {VCU} other {VCUs}} at peak',
        values: { value: formatVcus(vcus), count: vcus },
      });

interface ChangeBadgeProps {
  vcus: number;
  savedVcus: number;
}

/** Whether a value moved up (more VCUs) or down (fewer VCUs) from the saved profile. */
const ChangeBadge = ({ vcus, savedVcus }: ChangeBadgeProps) => {
  const isHigher = vcus > savedVcus;
  const deltaVcus = roundVcus(Math.abs(vcus - savedVcus));
  const delta = formatVcus(deltaVcus);
  const savedValue = formatVcus(savedVcus);
  const difference = isHigher
    ? i18n.translate('xpack.boost.profileEstimate.increase', {
        defaultMessage: '+{delta} {count, plural, one {VCU} other {VCUs}}',
        values: { delta, count: deltaVcus },
      })
    : i18n.translate('xpack.boost.profileEstimate.decrease', {
        defaultMessage: '−{delta} {count, plural, one {VCU} other {VCUs}}',
        values: { delta, count: deltaVcus },
      });
  const description = isHigher
    ? i18n.translate('xpack.boost.profileEstimate.higherThanSaved', {
        defaultMessage: 'Up {delta} from {savedValue}',
        values: { delta, savedValue },
      })
    : i18n.translate('xpack.boost.profileEstimate.lowerThanSaved', {
        defaultMessage: 'Down {delta} from {savedValue}',
        values: { delta, savedValue },
      });

  // Icon only, to keep the row short. The tooltip shows the difference at a glance, and the
  // accessible name adds the saved value for context.
  return (
    <EuiToolTip content={difference} display="flex" disableScreenReaderOutput>
      <EuiBadge
        color={isHigher ? 'danger' : 'success'}
        iconType={isHigher ? 'sortUp' : 'sortDown'}
        role="img"
        aria-label={description}
        tabIndex={0}
      />
    </EuiToolTip>
  );
};

interface EstimateValueProps {
  end: keyof VcuRange;
  estimate: VcuRange;
  savedEstimate?: VcuRange;
}

const EstimateValue = ({ end, estimate, savedEstimate }: EstimateValueProps) => {
  const vcus = roundVcus(estimate[end]);
  const savedVcus = savedEstimate && roundVcus(savedEstimate[end]);

  return (
    <EuiFlexGroup
      gutterSize="s"
      alignItems="center"
      responsive={false}
      data-test-subj={`boostProfileEstimate-${end}`}
    >
      <EuiFlexItem grow={false}>
        <EuiText size="xs">{getValueText(end, vcus)}</EuiText>
      </EuiFlexItem>
      {savedVcus !== undefined && savedVcus !== vcus && (
        <EuiFlexItem grow={false}>
          <ChangeBadge vcus={vcus} savedVcus={savedVcus} />
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};

/** The profile's illustrative search VCU range, updated as the form changes. */
export const ProfileEstimate = ({ estimate, savedEstimate }: ProfileEstimateProps) => {
  const { euiTheme } = useEuiTheme();

  return (
    <EuiFlexGroup
      gutterSize="s"
      alignItems="center"
      justifyContent="spaceBetween"
      responsive={false}
      wrap
      // Matches the height of the small buttons below the divider, so both halves of the footer
      // are the same height.
      css={{ minBlockSize: euiTheme.size.xl }}
      data-test-subj="boostProfileEstimate"
    >
      <EuiFlexItem grow={false}>
        <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiText size="xs">
              <strong>
                {i18n.translate('xpack.boost.profileEstimate.title', {
                  defaultMessage: 'Hourly search VCUs per {dataGb} GB',
                  values: { dataGb: ESTIMATE_DATA_GB },
                })}
              </strong>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiIconTip
              type="info"
              size="s"
              color="subdued"
              // A flex anchor sizes to the icon, so the row's flex alignment centers it. The default
              // inline-block anchor gets a line box from the inherited font, which offsets the icon.
              display="flex"
              content={i18n.translate('xpack.boost.profileEstimate.disclaimer', {
                defaultMessage:
                  'Actual usage varies with query load and your data. This is an estimate and may not represent actual pricing.',
              })}
              aria-label={i18n.translate('xpack.boost.profileEstimate.disclaimerLabel', {
                defaultMessage: 'About this estimate',
              })}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <div aria-live="polite">
          {estimate ? (
            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} wrap>
              <EuiFlexItem grow={false}>
                <EstimateValue end="atRest" estimate={estimate} savedEstimate={savedEstimate} />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                {/* Decorative divider between the two values; EUI has no vertical rule. */}
                <span
                  aria-hidden={true}
                  css={{
                    blockSize: euiTheme.size.base,
                    borderInlineStart: euiTheme.border.thin,
                  }}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EstimateValue end="atPeak" estimate={estimate} savedEstimate={savedEstimate} />
              </EuiFlexItem>
            </EuiFlexGroup>
          ) : (
            <EuiText size="xs" color={euiTheme.colors.textDisabled}>
              {i18n.translate('xpack.boost.profileEstimate.unavailable', {
                defaultMessage: 'Enter valid values above to see an estimate',
              })}
            </EuiText>
          )}
        </div>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
