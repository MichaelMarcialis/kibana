/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import { pure } from 'recompose';
import chrome from 'ui/chrome';
import { documentationLinks } from 'ui/documentation_links';

import { HeaderPage } from '../../components/header_page';
import { GlobalTime } from '../../containers/global_time';

import { EmptyPage } from '../../components/empty_page';
import { WithSource, indicesExistOrDataTemporarilyUnavailable } from '../../containers/source';
import { SpyRoute } from '../../utils/route/spy_routes';

import * as i18n from './translations';

const basePath = chrome.getBasePath();

export const DetectionEngineComponent = pure(() => {
  return (
    <>
      <HeaderPage subtitle={i18n.PAGE_SUBTITLE} title={i18n.PAGE_TITLE} />

      {/* <WithSource sourceId="default">
        {({ indicesExist }) =>
          indicesExistOrDataTemporarilyUnavailable(indicesExist) ? (
            <GlobalTime>{({ setQuery }) => <p>Testing...</p>}</GlobalTime>
          ) : (
            <EmptyPage
              actionPrimaryIcon="gear"
              actionPrimaryLabel={i18n.EMPTY_ACTION_PRIMARY}
              actionPrimaryUrl={`${basePath}/app/kibana#/home/tutorial_directory/siem`}
              actionSecondaryIcon="popout"
              actionSecondaryLabel={i18n.EMPTY_ACTION_SECONDARY}
              actionSecondaryTarget="_blank"
              actionSecondaryUrl={documentationLinks.siem}
              data-test-subj="empty-page"
              title={i18n.EMPTY_TITLE}
            />
          )
        }
      </WithSource> */}
      <SpyRoute />
    </>
  );
});
DetectionEngineComponent.displayName = 'DetectionEngineComponent';
