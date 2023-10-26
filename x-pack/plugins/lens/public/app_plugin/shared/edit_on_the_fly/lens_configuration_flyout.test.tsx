/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import { EuiFlyoutBody } from '@elastic/eui';
import { mountWithProvider } from '../../../mocks';
import type { Query, AggregateQuery } from '@kbn/es-query';
import { coreMock } from '@kbn/core/public/mocks';
import {
  mockVisualizationMap,
  mockDatasourceMap,
  mockStoreDeps,
  mockDataPlugin,
} from '../../../mocks';
import { TextBasedLangEditor } from '@kbn/text-based-languages/public';
import { SuggestionPanel } from '../../../editor_frame_service/editor_frame/suggestion_panel';
import type { LensPluginStartDependencies } from '../../../plugin';
import { createMockStartDependencies } from '../../../editor_frame_service/mocks';
import type { TypedLensByValueInput } from '../../../embeddable/embeddable_component';
import { VisualizationToolbar } from '../../../editor_frame_service/editor_frame/workspace_panel';
import { ConfigPanelWrapper } from '../../../editor_frame_service/editor_frame/config_panel/config_panel';
import { LensEditConfigurationFlyout } from './lens_configuration_flyout';
import type { EditConfigPanelProps } from './types';

let container: HTMLDivElement | undefined;

beforeEach(() => {
  container = document.createElement('div');
  container.id = 'lensContainer';
  document.body.appendChild(container);
});

afterEach(() => {
  if (container && container.parentNode) {
    container.parentNode.removeChild(container);
  }

  container = undefined;
});

describe('LensEditConfigurationFlyout', () => {
  const mockStartDependencies =
    createMockStartDependencies() as unknown as LensPluginStartDependencies;
  const data = mockDataPlugin();
  (data.query.timefilter.timefilter.getTime as jest.Mock).mockReturnValue({
    from: 'now-2m',
    to: 'now',
  });
  const startDependencies = {
    ...mockStartDependencies,
    data,
  };

  function prepareAndMountComponent(
    props: ReturnType<typeof getDefaultProps>,
    query?: Query | AggregateQuery
  ) {
    const lensStore = {
      preloadedState: {
        datasourceStates: {
          testDatasource: {
            isLoading: false,
            state: 'state',
          },
        },
        activeDatasourceId: 'testDatasource',
        query: query as Query,
      },
      storeDeps: mockStoreDeps({
        datasourceMap: props.datasourceMap,
        visualizationMap: props.visualizationMap,
      }),
    };
    return mountWithProvider(<LensEditConfigurationFlyout {...props} />, lensStore, {
      attachTo: container,
    });
  }

  function getDefaultProps(
    { datasourceMap = mockDatasourceMap(), visualizationMap = mockVisualizationMap() } = {
      datasourceMap: mockDatasourceMap(),
      visualizationMap: mockVisualizationMap(),
    }
  ) {
    const lensAttributes = {
      title: 'test',
      visualizationType: 'testVis',
      state: {
        datasourceStates: {
          testDatasource: {},
        },
        visualization: {},
        filters: [],
        query: {
          esql: 'from index1 | limit 10',
        },
      },
      filters: [],
      query: {
        esql: 'from index1 | limit 10',
      },
      references: [],
    } as unknown as TypedLensByValueInput['attributes'];

    return {
      attributes: lensAttributes,
      updatePanelState: jest.fn(),
      coreStart: coreMock.createStart(),
      startDependencies,
      visualizationMap,
      datasourceMap,
      closeFlyout: jest.fn(),
      datasourceId: 'testDatasource',
    } as unknown as EditConfigPanelProps;
  }

  it('should display the header and the link to editor if necessary props are given', async () => {
    const navigateToLensEditorSpy = jest.fn();
    const props = getDefaultProps();
    const newProps = {
      ...props,
      displayFlyoutHeader: true,
      isInlineFlyoutVisible: true,
      navigateToLensEditor: navigateToLensEditorSpy,
    };
    const { instance } = await prepareAndMountComponent(newProps);
    expect(instance.find('[data-test-subj="editFlyoutHeader"]').exists()).toBe(true);
    instance.find('[data-test-subj="navigateToLensEditorLink"]').at(1).simulate('click');
    expect(navigateToLensEditorSpy).toHaveBeenCalled();
  });

  it('should call the closeFlyout callback if cancel button is clicked', async () => {
    const closeFlyoutSpy = jest.fn();
    const props = getDefaultProps();
    const newProps = {
      ...props,
      closeFlyout: closeFlyoutSpy,
    };
    const { instance } = await prepareAndMountComponent(newProps);
    expect(instance.find(EuiFlyoutBody).exists()).toBe(true);
    instance.find('[data-test-subj="cancelFlyoutButton"]').at(1).simulate('click');
    expect(closeFlyoutSpy).toHaveBeenCalled();
  });

  it('should call the updatePanelState callback if cancel button is clicked', async () => {
    const updatePanelStateSpy = jest.fn();
    const props = getDefaultProps();
    const newProps = {
      ...props,
      updatePanelState: updatePanelStateSpy,
    };
    const { instance } = await prepareAndMountComponent(newProps);
    expect(instance.find(EuiFlyoutBody).exists()).toBe(true);
    instance.find('[data-test-subj="cancelFlyoutButton"]').at(1).simulate('click');
    expect(updatePanelStateSpy).toHaveBeenCalled();
  });

  it('should call the updateByRefInput callback if cancel button is clicked and savedObjectId exists', async () => {
    const updateByRefInputSpy = jest.fn();
    const props = getDefaultProps();
    const newProps = {
      ...props,
      closeFlyout: jest.fn(),
      updateByRefInput: updateByRefInputSpy,
      savedObjectId: 'id',
    };
    const { instance } = await prepareAndMountComponent(newProps);
    instance.find('[data-test-subj="cancelFlyoutButton"]').at(1).simulate('click');
    expect(updateByRefInputSpy).toHaveBeenCalled();
  });

  it('should call the saveByRef callback if apply button is clicked and savedObjectId exists', async () => {
    const updateByRefInputSpy = jest.fn();
    const saveByRefSpy = jest.fn();
    const props = getDefaultProps();
    const newProps = {
      ...props,
      closeFlyout: jest.fn(),
      updateByRefInput: updateByRefInputSpy,
      savedObjectId: 'id',
      saveByRef: saveByRefSpy,
    };
    const { instance } = await prepareAndMountComponent(newProps);
    instance.find('[data-test-subj="applyFlyoutButton"]').at(2).simulate('click');
    expect(updateByRefInputSpy).toHaveBeenCalled();
    expect(saveByRefSpy).toHaveBeenCalled();
  });

  it('should compute the frame public api correctly', async () => {
    const props = getDefaultProps();
    const { instance } = await prepareAndMountComponent(props);
    expect(instance.find(ConfigPanelWrapper).exists()).toBe(true);
    expect(instance.find(VisualizationToolbar).exists()).toBe(true);
    expect(instance.find(VisualizationToolbar).prop('framePublicAPI')).toMatchInlineSnapshot(`
      Object {
        "activeData": Object {},
        "dataViews": Object {
          "indexPatternRefs": Array [],
          "indexPatterns": Object {},
        },
        "datasourceLayers": Object {
          "a": Object {
            "datasourceId": "testDatasource",
            "getFilters": [MockFunction],
            "getMaxPossibleNumValues": [MockFunction],
            "getOperationForColumnId": [MockFunction],
            "getSourceId": [MockFunction],
            "getTableSpec": [MockFunction],
            "getVisualDefaults": [MockFunction],
            "hasDefaultTimeField": [MockFunction],
            "isTextBasedLanguage": [MockFunction] {
              "calls": Array [
                Array [],
                Array [],
              ],
              "results": Array [
                Object {
                  "type": "return",
                  "value": false,
                },
                Object {
                  "type": "return",
                  "value": false,
                },
              ],
            },
          },
        },
        "dateRange": Object {
          "fromDate": "2021-01-10T04:00:00.000Z",
          "toDate": "2021-01-10T08:00:00.000Z",
        },
      }
    `);
  });

  it('should compute the activeVisualization correctly', async () => {
    const props = getDefaultProps();
    const { instance } = await prepareAndMountComponent(props);
    expect(instance.find(VisualizationToolbar).prop('activeVisualization')).toMatchInlineSnapshot(`
      Object {
        "DimensionEditorComponent": [MockFunction],
        "appendLayer": [MockFunction],
        "clearLayer": [MockFunction],
        "getConfiguration": [MockFunction] {
          "calls": Array [
            Array [
              Object {
                "frame": Object {
                  "activeData": Object {},
                  "dataViews": Object {
                    "indexPatternRefs": Array [],
                    "indexPatterns": Object {},
                  },
                  "datasourceLayers": Object {
                    "a": Object {
                      "datasourceId": "testDatasource",
                      "getFilters": [MockFunction],
                      "getMaxPossibleNumValues": [MockFunction],
                      "getOperationForColumnId": [MockFunction],
                      "getSourceId": [MockFunction],
                      "getTableSpec": [MockFunction],
                      "getVisualDefaults": [MockFunction],
                      "hasDefaultTimeField": [MockFunction],
                      "isTextBasedLanguage": [MockFunction] {
                        "calls": Array [
                          Array [],
                          Array [],
                        ],
                        "results": Array [
                          Object {
                            "type": "return",
                            "value": false,
                          },
                          Object {
                            "type": "return",
                            "value": false,
                          },
                        ],
                      },
                    },
                  },
                  "dateRange": Object {
                    "fromDate": "2021-01-10T04:00:00.000Z",
                    "toDate": "2021-01-10T08:00:00.000Z",
                  },
                },
                "layerId": "layer1",
                "state": Object {},
              },
            ],
            Array [
              Object {
                "frame": Object {
                  "activeData": Object {},
                  "dataViews": Object {
                    "indexPatternRefs": Array [],
                    "indexPatterns": Object {},
                  },
                  "datasourceLayers": Object {
                    "a": Object {
                      "datasourceId": "testDatasource",
                      "getFilters": [MockFunction],
                      "getMaxPossibleNumValues": [MockFunction],
                      "getOperationForColumnId": [MockFunction],
                      "getSourceId": [MockFunction],
                      "getTableSpec": [MockFunction],
                      "getVisualDefaults": [MockFunction],
                      "hasDefaultTimeField": [MockFunction],
                      "isTextBasedLanguage": [MockFunction] {
                        "calls": Array [
                          Array [],
                          Array [],
                        ],
                        "results": Array [
                          Object {
                            "type": "return",
                            "value": false,
                          },
                          Object {
                            "type": "return",
                            "value": false,
                          },
                        ],
                      },
                    },
                  },
                  "dateRange": Object {
                    "fromDate": "2021-01-10T04:00:00.000Z",
                    "toDate": "2021-01-10T08:00:00.000Z",
                  },
                },
                "layerId": "layer1",
                "state": Object {},
              },
            ],
          ],
          "results": Array [
            Object {
              "type": "return",
              "value": Object {
                "groups": Array [
                  Object {
                    "accessors": Array [],
                    "dataTestSubj": "mockVisA",
                    "filterOperations": [MockFunction],
                    "groupId": "a",
                    "groupLabel": "a",
                    "layerId": "layer1",
                    "supportsMoreColumns": true,
                  },
                ],
              },
            },
            Object {
              "type": "return",
              "value": Object {
                "groups": Array [
                  Object {
                    "accessors": Array [],
                    "dataTestSubj": "mockVisA",
                    "filterOperations": [MockFunction],
                    "groupId": "a",
                    "groupLabel": "a",
                    "layerId": "layer1",
                    "supportsMoreColumns": true,
                  },
                ],
              },
            },
          ],
        },
        "getDescription": [MockFunction] {
          "calls": Array [
            Array [
              Object {},
            ],
            Array [
              Object {},
            ],
          ],
          "results": Array [
            Object {
              "type": "return",
              "value": Object {
                "label": "",
              },
            },
            Object {
              "type": "return",
              "value": Object {
                "label": "",
              },
            },
          ],
        },
        "getLayerIds": [MockFunction] {
          "calls": Array [
            Array [
              Object {},
            ],
            Array [
              Object {},
            ],
          ],
          "results": Array [
            Object {
              "type": "return",
              "value": Array [
                "layer1",
              ],
            },
            Object {
              "type": "return",
              "value": Array [
                "layer1",
              ],
            },
          ],
        },
        "getLayerType": [MockFunction] {
          "calls": Array [
            Array [
              "layer1",
              Object {},
            ],
            Array [
              "layer1",
              Object {},
            ],
          ],
          "results": Array [
            Object {
              "type": "return",
              "value": "data",
            },
            Object {
              "type": "return",
              "value": "data",
            },
          ],
        },
        "getRenderEventCounters": [MockFunction],
        "getSuggestions": [MockFunction],
        "getSupportedLayers": [MockFunction],
        "getVisualizationTypeId": [MockFunction],
        "id": "testVis",
        "initialize": [MockFunction],
        "removeDimension": [MockFunction],
        "removeLayer": [MockFunction],
        "setDimension": [MockFunction],
        "switchVisualizationType": [MockFunction],
        "toExpression": [MockFunction],
        "toPreviewExpression": [MockFunction],
        "visualizationTypes": Array [
          Object {
            "groupLabel": "testVisGroup",
            "icon": "empty",
            "id": "testVis",
            "label": "TEST",
          },
        ],
      }
    `);
  });

  it('should not display the editor if canEditTextBasedQuery prop is false', async () => {
    const props = getDefaultProps();
    const newProps = {
      ...props,
      canEditTextBasedQuery: false,
    };
    const { instance } = await prepareAndMountComponent(newProps);
    expect(instance.find(TextBasedLangEditor).exists()).toBe(false);
  });

  it('should not display the editor if canEditTextBasedQuery prop is true but the query is not text based', async () => {
    const props = getDefaultProps();
    const newProps = {
      ...props,
      canEditTextBasedQuery: true,
      attributes: {
        ...props.attributes,
        query: {
          type: 'kql',
          query: '',
        },
        state: {
          ...props.attributes.state,
          query: {
            type: 'kql',
            query: '',
          },
        },
      } as unknown as TypedLensByValueInput['attributes'],
    };
    const { instance } = await prepareAndMountComponent(newProps);
    expect(instance.find(TextBasedLangEditor).exists()).toBe(false);
  });

  it('should display the editor and the suggestions if canEditTextBasedQuery prop is true', async () => {
    const props = getDefaultProps();
    const newProps = {
      ...props,
      canEditTextBasedQuery: true,
    };
    const { instance } = await prepareAndMountComponent(newProps);
    expect(instance.find(TextBasedLangEditor).exists()).toBe(true);
    expect(instance.find(SuggestionPanel).exists()).toBe(true);
  });
});
