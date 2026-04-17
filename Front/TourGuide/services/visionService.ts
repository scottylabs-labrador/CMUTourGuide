import { ENDPOINTS } from '../constants/api';
import { canonicalBuildingId } from '../config/buildingIdMap';

export async function scanBuilding(base64Image: string): Promise<string> {
  const res = await fetch(ENDPOINTS.vision, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image }),
  });

  if (!res.ok) {
    throw new Error(`Vision API error: ${res.status}`);
  }

  const data = await res.json();
  return canonicalBuildingId(data.building_name);
}
