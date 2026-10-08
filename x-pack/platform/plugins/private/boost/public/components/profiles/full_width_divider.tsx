/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import type { EuiHorizontalRuleProps } from '@elastic/eui';
import { EuiHorizontalRule, useEuiTheme } from '@elastic/eui';

/**
 * A divider that runs edge to edge in a flyout with `m` padding, extending through the 16px inline
 * padding of the flyout body and footer.
 */
export const FullWidthDivider = ({ margin }: Pick<EuiHorizontalRuleProps, 'margin'>) => {
  const { euiTheme } = useEuiTheme();

  return (
    <div css={{ marginInline: `-${euiTheme.size.base}` }}>
      <EuiHorizontalRule margin={margin} />
    </div>
  );
};
