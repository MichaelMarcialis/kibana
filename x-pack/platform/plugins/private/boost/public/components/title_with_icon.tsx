/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { type ReactNode } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiIcon, type IconType } from '@elastic/eui';

interface TitleWithIconProps {
  iconType: IconType;
  children: ReactNode;
}

/** Section title content prepended with a decorative 16px icon. */
export const TitleWithIcon = ({ iconType, children }: TitleWithIconProps) => (
  <EuiFlexGroup component="span" gutterSize="s" alignItems="center" responsive={false}>
    <EuiFlexItem component="span" grow={false}>
      <EuiIcon type={iconType} size="m" color="text" aria-hidden={true} />
    </EuiFlexItem>
    <EuiFlexItem component="span" grow={false}>
      {children}
    </EuiFlexItem>
  </EuiFlexGroup>
);
