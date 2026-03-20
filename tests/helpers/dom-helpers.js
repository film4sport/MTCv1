// @ts-check
const { expect } = require('@playwright/test');

async function waitForCountAtLeast(locator, minimum, timeout = 5000) {
  await expect
    .poll(async () => {
      try {
        return await locator.count();
      } catch {
        return 0;
      }
    }, { timeout })
    .toBeGreaterThanOrEqual(minimum);
}

async function waitForCountExact(locator, expected, timeout = 5000) {
  await expect
    .poll(async () => {
      try {
        return await locator.count();
      } catch {
        return 0;
      }
    }, { timeout })
    .toBe(expected);
}

module.exports = {
  waitForCountAtLeast,
  waitForCountExact,
};
