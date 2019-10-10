/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { EuiBetaBadge, EuiBadge, EuiFlexGroup, EuiFlexItem, EuiTitle } from '@elastic/eui';
import React from 'react';
import styled, { css } from 'styled-components';

import { DefaultDraggable } from '../draggables';
import { LinkBack, LinkBackProps } from '../link_back';
import { Subtitle, SubtitleProps } from '../subtitle';

interface HeaderProps {
  border?: boolean;
}

const Header = styled.header.attrs({
  className: 'siemHeaderPage',
})<HeaderProps>`
  ${({ border, theme }) => css`
    margin: ${theme.eui.euiSizeL} 0;

    ${border &&
      css`
        border-bottom: ${theme.eui.euiBorderThin};
        padding-bottom: ${theme.eui.euiSizeL};
      `}
  `}
`;
Header.displayName = 'Header';

const FlexItem = styled(EuiFlexItem)`
  display: block;
`;
FlexItem.displayName = 'FlexItem';

const Badge = styled(EuiBadge)`
  letter-spacing: 0;
`;
Badge.displayName = 'Badge';

interface BackOptions {
  href: LinkBackProps['href'];
  text: LinkBackProps['text'];
}

interface BadgeOptions {
  beta?: boolean;
  text: string;
  tooltip?: string;
}

interface DraggableArguments {
  field: string;
  value: string;
}

export interface HeaderPageProps extends HeaderProps {
  backOptions?: BackOptions;
  badgeOptions?: BadgeOptions;
  children?: React.ReactNode;
  draggableArguments?: DraggableArguments;
  subtitle?: SubtitleProps['text'];
  subtitle2?: SubtitleProps['text'];
  title: string | React.ReactNode;
}

export const HeaderPage = React.memo<HeaderPageProps>(
  ({
    backOptions,
    badgeOptions,
    border,
    children,
    draggableArguments,
    subtitle,
    subtitle2,
    title,
    ...rest
  }) => (
    <Header border={border} {...rest}>
      <EuiFlexGroup alignItems="center">
        <FlexItem>
          {backOptions && (
            <LinkBack
              data-test-subj="header-page-back-link"
              href={backOptions.href}
              text={backOptions.text}
            />
          )}

          <EuiTitle size="l">
            <h1 data-test-subj="header-page-title">
              {!draggableArguments ? (
                title
              ) : (
                <DefaultDraggable
                  data-test-subj="header-page-draggable"
                  id={`header-page-draggable-${draggableArguments.field}-${draggableArguments.value}`}
                  field={draggableArguments.field}
                  value={`${draggableArguments.value}`}
                />
              )}
              {badgeOptions && (
                <>
                  {' '}
                  {badgeOptions.beta ? (
                    <EuiBetaBadge
                      label={badgeOptions.text}
                      tooltipContent={badgeOptions.tooltip}
                      tooltipPosition="bottom"
                    />
                  ) : (
                    <Badge color="hollow">{badgeOptions.text}</Badge>
                  )}
                </>
              )}
            </h1>
          </EuiTitle>

          {subtitle && <Subtitle data-test-subj="header-page-subtitle" text={subtitle} />}
          {subtitle2 && <Subtitle data-test-subj="header-page-subtitle-2" text={subtitle2} />}
        </FlexItem>

        {children && (
          <FlexItem data-test-subj="header-page-supplements" grow={false}>
            {children}
          </FlexItem>
        )}
      </EuiFlexGroup>
    </Header>
  )
);
HeaderPage.displayName = 'HeaderPage';
