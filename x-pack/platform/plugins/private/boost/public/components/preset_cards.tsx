/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import {
  EuiBadge,
  EuiCheckableCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
  useGeneratedHtmlId,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { PresetOption } from './preset_options';

interface PresetCardsProps<TId extends string> {
  name: string;
  legend: string;
  options: ReadonlyArray<PresetOption<TId>>;
  selectedId: TId;
  onChange: (id: TId) => void;
  disabled: boolean;
}

const DEFAULT_BADGE_LABEL = i18n.translate('xpack.boost.presets.defaultBadge', {
  defaultMessage: 'Default',
});

/** Radio group of preset cards, one per option. */
export const PresetCards = <TId extends string>({
  name,
  legend,
  options,
  selectedId,
  onChange,
  disabled,
}: PresetCardsProps<TId>) => {
  const groupId = useGeneratedHtmlId({ prefix: name });

  return (
    <fieldset aria-label={legend}>
      <EuiFlexGroup direction="column" gutterSize="s" data-test-subj={`${name}PresetCards`}>
        {options.map(({ id, label, description, isDefault }) => (
          <EuiFlexItem key={id}>
            <EuiCheckableCard
              id={`${groupId}-${id}`}
              name={groupId}
              // The description lives in the label because EUI separates card children from the
              // label with a fixed 16px gap; this keeps title and description 4px apart.
              label={
                <>
                  <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                    <EuiFlexItem grow={false}>
                      <strong>{label}</strong>
                    </EuiFlexItem>
                    {isDefault && (
                      <EuiFlexItem grow={false}>
                        <EuiBadge>{DEFAULT_BADGE_LABEL}</EuiBadge>
                      </EuiFlexItem>
                    )}
                  </EuiFlexGroup>
                  <EuiSpacer size="xs" />
                  <EuiText size="xs" color="subdued">
                    {description}
                  </EuiText>
                </>
              }
              checked={selectedId === id}
              onChange={() => onChange(id)}
              disabled={disabled}
              data-test-subj={`${name}Preset-${id}`}
            />
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </fieldset>
  );
};
