/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { PLUGIN_ID } from '../../common/constants';

// Prototype-only: the side navigation records visited "New" items under this localStorage key (see
// `useNewItems` in @kbn/ui-side-navigation). There's no public API to reset it.
const NEW_NAV_ITEMS_STORAGE_KEY = 'core.chrome.sidenav.newItems';
const BOOST_NAV_ITEM_ID = `management:${PLUGIN_ID}`;

/** Forgets that this browser visited Search boost, so its "New" nav badge shows again after a reload. */
export const resetNewNavBadge = (): void => {
  const stored = localStorage.getItem(NEW_NAV_ITEMS_STORAGE_KEY);
  if (!stored) {
    return;
  }

  try {
    const visitedItemIds = JSON.parse(stored);
    if (Array.isArray(visitedItemIds)) {
      localStorage.setItem(
        NEW_NAV_ITEMS_STORAGE_KEY,
        JSON.stringify(visitedItemIds.filter((id) => id !== BOOST_NAV_ITEM_ID))
      );
    }
  } catch {
    // Leave unreadable state alone; the badge simply stays hidden.
  }
};
