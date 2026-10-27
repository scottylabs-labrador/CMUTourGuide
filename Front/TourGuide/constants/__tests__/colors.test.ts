import { expect, test } from '@jest/globals';
import { getMapBuildingStyle, VISITED_GREEN, IRON_GRAY, hexToRgba } from '../colors';

const style = (unlocked: boolean, routeActive = false, inRoute = false) =>
  getMapBuildingStyle({ unlocked, inRoute, isNext: false, routeActive });

// Unlocked reads green everywhere, so red only ever means "on this tour"
test('unlocked buildings are green with or without a route', () => {
  expect(style(true).stroke).toBe(VISITED_GREEN);
  expect(style(true).dot).toBe(VISITED_GREEN);
  expect(style(true, true, true).stroke).toBe(VISITED_GREEN);
  expect(style(true, true, false).stroke).toBe(hexToRgba(VISITED_GREEN, 0.35));
});

test('locked buildings stay gray without a route', () => {
  expect(style(false).stroke).toBe(IRON_GRAY);
});
