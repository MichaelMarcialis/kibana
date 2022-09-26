/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { i18n } from '@kbn/i18n';
import { EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiIcon, EuiPanel } from '@elastic/eui';
import type { BucketContainerProps } from './types';

export const DefaultBucketContainer = ({
  isInvalid,
  invalidMessage,
  onRemoveClick,
  removeTitle,
  children,
  isNotRemovable,
  'data-test-subj': dataTestSubj,
}: BucketContainerProps) => {
  return (
    <EuiPanel paddingSize="none" data-test-subj={dataTestSubj} hasShadow={false} hasBorder>
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false}>{/* Empty for spacing */}</EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiIcon
            size="s"
            color={isInvalid ? 'danger' : 'subdued'}
            type={isInvalid ? 'alert' : 'grab'}
            title={
              isInvalid
                ? invalidMessage
                : i18n.translate('xpack.lens.customBucketContainer.dragToReorder', {
                    defaultMessage: 'Drag to reorder',
                  })
            }
          />
        </EuiFlexItem>
        <EuiFlexItem grow={true}>{children}</EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            iconSize="s"
            iconType="cross"
            color="danger"
            data-test-subj="lns-customBucketContainer-remove"
            onClick={onRemoveClick}
            aria-label={removeTitle}
            title={removeTitle}
            disabled={isNotRemovable}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
};
