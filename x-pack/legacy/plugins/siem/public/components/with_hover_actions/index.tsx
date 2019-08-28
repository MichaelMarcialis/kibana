/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import * as React from 'react';
import { pure } from 'recompose';
import styled, { css } from 'styled-components';

interface Props {
  /**
   * The contents of the hover menu. It is highly recommended you wrap this
   * content in a `div` with `position: absolute` to prevent it from effecting
   * layout, and to adjust it's position via `top` and `left`.
   */
  hoverContent: JSX.Element;
  /**
   * The content that will be wrapped with hover actions. In addition to
   * rendering the `hoverContent` when the user hovers, this render prop
   * passes `showHoverContent` to provide a signal that it is in the hover
   * state.
   */
  render: () => JSX.Element;
}

const HoverActionsPanelContainer = styled.div.attrs({
  className: 'siemContextMenu__actions',
})`
  // height: 100%;
  // position: relative;

  color: ${props => props.theme.eui.textColors.default};
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  z-index: 9000;

  background: #fff;

  display: flex;
  align-items: center;

  opacity: 0;
  visibility: hidden;

  .siemContextMenu:hover & {
    opacity: 1;
    visibility: visible;
  }
`;

HoverActionsPanelContainer.displayName = 'HoverActionsPanelContainer';

const HoverActionsPanel = pure<{ children: JSX.Element }>(({ children }) => (
  <HoverActionsPanelContainer data-test-subj="hover-actions-panel-container">
    {children}
  </HoverActionsPanelContainer>
));

HoverActionsPanel.displayName = 'HoverActionsPanel';

const WithHoverActionsContainer = styled.div.attrs({
  className: 'siemContextMenu',
})`
  // display: flex;
  // flex-direction: row;
  // height: 100%;
  // padding-right: 5px;

  position: relative;
`;

WithHoverActionsContainer.displayName = 'WithHoverActionsContainer';

/**
 * Decorates it's children with actions that are visible on hover.
 * This component does not enforce an opinion on the styling and
 * positioning of the hover content, but see the documentation for
 * the `hoverContent` for tips on (not) effecting layout on-hover.
 *
 * In addition to rendering the `hoverContent` prop on hover, this
 * component also passes `showHoverContent` as a render prop, which
 * provides a signal to the content that the user is in a hover state.
 */
export class WithHoverActions extends React.PureComponent<Props> {
  public render() {
    const { hoverContent, render } = this.props;

    return (
      <WithHoverActionsContainer>
        <>{render()}</>
        <HoverActionsPanel>{hoverContent}</HoverActionsPanel>
      </WithHoverActionsContainer>
    );
  }
}
