/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { estimateDataStreamsVcuRange, estimateIndicesVcuRange } from './vcu_estimate';

const base = { minBoost: 1, maxBoost: 4, extraCopy: false, prewarm: false, pinned: false };

describe('estimateIndicesVcuRange', () => {
  it('scales linearly with boost', () => {
    const one = estimateIndicesVcuRange({ ...base, maxBoost: 1 });
    const four = estimateIndicesVcuRange(base);

    expect(four.atPeak).toBeCloseTo(one.atPeak * 4);
    expect(four.atRest).toBeCloseTo(one.atRest);
  });

  it('costs nothing at rest with a minimum boost of 0', () => {
    expect(estimateIndicesVcuRange({ ...base, minBoost: 0 }).atRest).toBe(0);
  });

  it('doubles the range with one extra copy', () => {
    const single = estimateIndicesVcuRange(base);
    const extraCopy = estimateIndicesVcuRange({ ...base, extraCopy: true });

    expect(extraCopy.atRest).toBeCloseTo(single.atRest * 2);
    expect(extraCopy.atPeak).toBeCloseTo(single.atPeak * 2);
  });

  it('raises the at-rest estimate with prewarm and pin, without lowering the peak below it', () => {
    const estimate = estimateIndicesVcuRange({
      ...base,
      maxBoost: 1,
      prewarm: true,
      pinned: true,
    });

    expect(estimate.atRest).toBeGreaterThan(
      estimateIndicesVcuRange({ ...base, maxBoost: 1 }).atRest
    );
    expect(estimate.atPeak).toBeGreaterThanOrEqual(estimate.atRest);
  });
});

describe('estimateDataStreamsVcuRange', () => {
  const profile = {
    recent: { minBoost: 1, maxBoost: 1, maxAgeDays: 1 },
    standard: { minBoost: 1, maxBoost: 1, maxAgeDays: 7 },
    background: { minBoost: 1, maxBoost: 1 },
  };

  it('costs more when the recent period covers more days', () => {
    const oneDay = estimateDataStreamsVcuRange(profile);
    const sevenDays = estimateDataStreamsVcuRange({
      ...profile,
      recent: { ...profile.recent, maxAgeDays: 7 },
    });

    expect(sevenDays.atRest).toBeGreaterThan(oneDay.atRest);
  });

  it('raises the peak, but not the at-rest estimate, with a higher maximum boost', () => {
    const unboosted = estimateDataStreamsVcuRange(profile);
    const boosted = estimateDataStreamsVcuRange({
      ...profile,
      recent: { ...profile.recent, maxBoost: 4 },
    });

    expect(boosted.atRest).toBeCloseTo(unboosted.atRest);
    expect(boosted.atPeak).toBeGreaterThan(unboosted.atPeak);
  });
});
