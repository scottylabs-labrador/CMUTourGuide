// Hermes lacks AbortSignal.timeout(), so build timeouts from AbortController + a timer.
export const VISION_TIMEOUT_MS = 35_000; // backend waits up to 30s on Modal
export const CHAT_TIMEOUT_MS = 45_000;

export class TimeoutError extends Error {
  name = 'TimeoutError';
}

export const isAbortError = (e: unknown) =>
  e instanceof Error && e.name === 'AbortError';

export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  // Forward an external abort (e.g. user pressed cancel) to our controller
  const onAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', onAbort);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    if (timedOut) throw new TimeoutError(`Request timed out after ${timeoutMs}ms`);
    throw e;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}
