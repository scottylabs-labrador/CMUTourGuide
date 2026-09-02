import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { fetchWithTimeout, TimeoutError } from '../http';

const abortError = () => Object.assign(new Error('Aborted'), { name: 'AbortError' });

// Fake fetch that rejects with AbortError when its signal fires, otherwise resolves after `delay`
const mockFetch = (delay: number) =>
  jest.fn((_url: string, init: RequestInit) =>
    new Promise<Response>((resolve, reject) => {
      const t = setTimeout(() => resolve({ ok: true } as Response), delay);
      init.signal?.addEventListener('abort', () => { clearTimeout(t); reject(abortError()); });
    }),
  );

beforeEach(() => { jest.useFakeTimers(); });
afterEach(() => { jest.useRealTimers(); });

test('resolves when the request finishes before the timeout', async () => {
  global.fetch = mockFetch(100) as any;
  const p = fetchWithTimeout('u', {}, 1000);
  jest.advanceTimersByTime(100);
  await expect(p).resolves.toEqual({ ok: true });
});

test('rejects with TimeoutError when the request stalls', async () => {
  global.fetch = mockFetch(10_000) as any;
  const p = fetchWithTimeout('u', {}, 1000);
  jest.advanceTimersByTime(1000);
  await expect(p).rejects.toBeInstanceOf(TimeoutError);
});

test('external abort cancels the request with AbortError, not TimeoutError', async () => {
  global.fetch = mockFetch(10_000) as any;
  const controller = new AbortController();
  const p = fetchWithTimeout('u', {}, 1000, controller.signal);
  controller.abort();
  await expect(p).rejects.toMatchObject({ name: 'AbortError' });
});

test('passes its own signal through to fetch', async () => {
  const f = mockFetch(0);
  global.fetch = f as any;
  const p = fetchWithTimeout('u', { method: 'POST' }, 1000);
  jest.advanceTimersByTime(0);
  await p;
  expect(f.mock.calls[0][1]).toMatchObject({ method: 'POST', signal: expect.any(AbortSignal) });
});
