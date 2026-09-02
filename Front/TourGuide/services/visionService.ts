import { ENDPOINTS } from '../constants/api';
import { canonicalBuildingId } from '../config/buildingIdMap';
import { fetchWithTimeout, VISION_TIMEOUT_MS } from './http';

// Backend flags a recognised-but-unsure result; the threshold lives server-side so it can be tuned without a release
export class LowConfidenceError extends Error {
  name = 'LowConfidenceError';
  constructor(public buildingId: string, public confidence: number) {
    super(`Low confidence (${confidence.toFixed(2)}) for ${buildingId}`);
  }
}

export async function scanBuilding(base64Image: string, signal?: AbortSignal): Promise<string> {
  const res = await fetchWithTimeout(ENDPOINTS.vision, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64Image }),
  }, VISION_TIMEOUT_MS, signal);

  if (!res.ok) {
    throw new Error(`Vision API error: ${res.status}`);
  }

  const data = await res.json();
  const buildingId = canonicalBuildingId(data.building_name);
  if (data.error === 'LOW_CONFIDENCE') throw new LowConfidenceError(buildingId, data.confidence);
  return buildingId;
}
