import { expect, jest, test } from '@jest/globals';
import { scanBuilding, LowConfidenceError } from '../visionService';

const respond = (body: unknown) =>
  jest.fn(async () => ({ ok: true, json: async () => body })) as unknown as typeof fetch;

test('maps a confident classifier label to the canonical building id', async () => {
  global.fetch = respond({ building_name: 'Uc Side', confidence: 0.9, error: null });
  await expect(scanBuilding('img')).resolves.toBe('CUC');
});

test('throws LowConfidenceError carrying the guess when the backend flags LOW_CONFIDENCE', async () => {
  global.fetch = respond({ building_name: 'Gates', confidence: 0.3, error: 'LOW_CONFIDENCE' });
  await expect(scanBuilding('img')).rejects.toMatchObject({
    name: 'LowConfidenceError', buildingId: 'GHC', confidence: 0.3,
  });
});

test('LowConfidenceError is an Error subclass', () => {
  expect(new LowConfidenceError('GHC', 0.2)).toBeInstanceOf(Error);
});
