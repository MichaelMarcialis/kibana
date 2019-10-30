/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { EuiProgress } from '@elastic/eui';
import React from 'react';
import styled, { css } from 'styled-components';

const Wrapper = styled.dl`
  ${({ theme }) => css`
    align-items: center;
    display: inline-flex;

    & > * {
      color: ${theme.eui.textColors.subdued};
      font-size: ${theme.eui.euiFontSizeXS};
      line-height: ${theme.eui.euiLineHeight};

      & + * {
        margin-left: 8px;
      }
    }

    .siemProgressInline__bar {
      width: 100px;
    }
  `}
`;
Wrapper.displayName = 'Wrapper';

export interface ProgressInlineProps {
  children: string;
  current: number;
  max: number;
  unit: string;
}

export const ProgressInline = React.memo<ProgressInlineProps>(
  ({ children, current, max, unit }) => (
    <Wrapper className="siemProgressInline">
      <dt className="siemProgressInline__title">{children}</dt>

      <dd className="siemProgressInline__bar">
        <EuiProgress color="secondary" max={max} value={current} />
      </dd>

      <dd className="siemProgressInline__ratio">
        {current.toLocaleString()}
        {'/'}
        {max.toLocaleString()} {unit}
      </dd>
    </Wrapper>
  )
);
ProgressInline.displayName = 'ProgressInline';
