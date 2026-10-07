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
  useGeneratedHtmlId,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { CardLabel } from './card_label';
import type { PresetOption } from './preset_options';

interface PresetCardsProps<TId extends string> {
  name: string;
  /** Accessible name for the radio group. Omit when a parent already provides a legend. */
  legend?: string;
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

  const cards = (
    <EuiFlexGroup direction="column" gutterSize="s" data-test-subj={`${name}PresetCards`}>
      {options.map(({ id, label, description, isDefault }) => (
        <EuiFlexItem key={id}>
          <EuiCheckableCard
            id={`${groupId}-${id}`}
            name={groupId}
            label={
              <CardLabel
                title={label}
                description={description}
                badge={isDefault ? <EuiBadge>{DEFAULT_BADGE_LABEL}</EuiBadge> : undefined}
              />
            }
            checked={selectedId === id}
            onChange={() => onChange(id)}
            disabled={disabled}
            data-test-subj={`${name}Preset-${id}`}
          />
        </EuiFlexItem>
      ))}
    </EuiFlexGroup>
  );

  return legend ? <fieldset aria-label={legend}>{cards}</fieldset> : cards;
};
