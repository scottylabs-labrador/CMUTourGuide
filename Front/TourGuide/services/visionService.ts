import { ENDPOINTS } from '../constants/api';
import { canonicalBuildingId } from '../config/buildingIdMap';
import { fetchWithTimeout, VISION_TIMEOUT_MS } from './http';

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
  return canonicalBuildingId(data.building_name);
}
