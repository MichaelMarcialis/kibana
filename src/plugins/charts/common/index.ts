/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

export const COLOR_MAPPING_SETTING = 'visualization:colorMapping';

export {
  CustomPaletteArguments,
  CustomPaletteState,
  SystemPaletteArguments,
  PaletteOutput,
  defaultCustomColors,
  palette,
  systemPalette,
} from './palette';

export { paletteIds } from './constants';

export {
  ColorSchemas,
  ColorSchema,
  RawColorSchema,
  ColorMap,
  vislibColorMaps,
  colorSchemas,
  getHeatmapColors,
  truncatedColorMaps,
  truncatedColorSchemas,
  ColorMode,
  LabelRotation,
  defaultCountLabel,
} from './static';

export { ColorSchemaParams, Labels, Style } from './types';
