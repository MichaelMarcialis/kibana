/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { PureComponent, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { injectI18n, FormattedMessage } from '@kbn/i18n/react';
import {
  EuiConfirmModal,
  EuiOverlayMask,
} from '@elastic/eui';

import { pauseFollowerIndex } from '../store/actions';
import { arrify } from '../../../common/services/utils';
import { areAllSettingsDefault } from '../services/follower_index_default_settings';

class Provider extends PureComponent {
  static propTypes = {
    onConfirm: PropTypes.func,
  }

  state = {
    isModalOpen: false,
    indices: []
  }

  onMouseOverModal = (event) => {
    // This component can sometimes be used inside of an EuiToolTip, in which case mousing over
    // the modal can trigger the tooltip. Stopping propagation prevents this.
    event.stopPropagation();
  };

  pauseFollowerIndex = (index) => {
    this.setState({ isModalOpen: true, indices: arrify(index) });
  };

  onConfirm = () => {
    this.props.pauseFollowerIndex(this.state.indices.map(index => index.name));
    this.setState({ isModalOpen: false, indices: [] });
    this.props.onConfirm && this.props.onConfirm();
  }

  closeConfirmModal = () => {
    this.setState({
      isModalOpen: false,
    });
  };

  renderModal = () => {
    const { intl } = this.props;
    const { indices } = this.state;
    const isSingle = indices.length === 1;
    const title = isSingle
      ? intl.formatMessage({
        id: 'xpack.crossClusterReplication.pauseFollowerIndex.confirmModal.pauseSingleTitle',
        defaultMessage: 'Pause follower index \'{name}\'?',
      }, { name: indices[0].name })
      : intl.formatMessage({
        id: 'xpack.crossClusterReplication.pauseFollowerIndex.confirmModal.pauseMultipleTitle',
        defaultMessage: 'Pause {count} follower indices?',
      }, { count: indices.length });
    const hasCustomSettings = indices.some(index => !areAllSettingsDefault(index));

    return (
      <EuiOverlayMask>
        { /* eslint-disable-next-line jsx-a11y/mouse-events-have-key-events */ }
        <EuiConfirmModal
          title={title}
          onCancel={this.closeConfirmModal}
          onConfirm={this.onConfirm}
          cancelButtonText={
            intl.formatMessage({
              id: 'xpack.crossClusterReplication.pauseFollowerIndex.confirmModal.cancelButtonText',
              defaultMessage: 'Cancel',
            })
          }
          buttonColor={hasCustomSettings ? 'danger' : 'primary'}
          confirmButtonText={
            hasCustomSettings ? intl.formatMessage({
              id: 'xpack.crossClusterReplication.pauseFollowerIndex.confirmModal.confirmButtonTextWithSettingWarning',
              defaultMessage: 'Pause and revert advanced settings to defaults',
            }) : intl.formatMessage({
              id: 'xpack.crossClusterReplication.pauseFollowerIndex.confirmModal.confirmButtonText',
              defaultMessage: 'Pause',
            })
          }
          onMouseOver={this.onMouseOverModal}
        >
          {isSingle ? (
            <Fragment>
              {
                hasCustomSettings ? (
                  <p>
                    <FormattedMessage
                      id="xpack.crossClusterReplication.pauseFollowerIndex.confirmModal.singlePauseDescriptionWithSettingWarning"
                      defaultMessage="The custom advanced settings on this follower index will be reverted to default
                        advanced settings."
                    />
                  </p>
                ) : null
              }
            </Fragment>
          ) : (
            <Fragment>
              <p>
                {
                  hasCustomSettings ? (
                    <FormattedMessage
                      id="xpack.crossClusterReplication.pauseFollowerIndex.confirmModal.multiplePauseDescriptionWithSettingWarning"
                      defaultMessage="The follower indices below will be paused. Custom advanced settings on one or more
                        of these follower indices will be reverted to default advanced settings."
                    />
                  ) : (
                    <FormattedMessage
                      id="xpack.crossClusterReplication.pauseFollowerIndex.confirmModal.multiplePauseDescription"
                      defaultMessage="These follower indices will be paused:"
                    />
                  )
                }
              </p>
              <ul>{indices.map(index => <li key={index.name}>{index.name}</li>)}</ul>
            </Fragment>
          )}
        </EuiConfirmModal>
      </EuiOverlayMask>
    );
  }

  render() {
    const { children } = this.props;
    const { isModalOpen } = this.state;

    return (
      <Fragment>
        {children(this.pauseFollowerIndex)}
        {isModalOpen && this.renderModal()}
      </Fragment>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  pauseFollowerIndex: (id) => dispatch(pauseFollowerIndex(id)),
});

export const FollowerIndexPauseProvider = connect(
  undefined,
  mapDispatchToProps
)(injectI18n(Provider));

