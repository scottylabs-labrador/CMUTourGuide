import AsyncStorage from '@react-native-async-storage/async-storage';

const UNLOCKED_BUILDINGS_KEY = 'unlocked_buildings';

export const getUnlockedBuildings = async (): Promise<string[]> => {
  const data = await AsyncStorage.getItem(UNLOCKED_BUILDINGS_KEY);
  if (!data) return [];
  
  return JSON.parse(data);
};

export const unlockBuilding = async (buildingId: string): Promise<void> => {
  if (buildingId == "Error") {
    return;
  }
  const unlocked = await getUnlockedBuildings();
  
  // Prevent duplicates
  if (!unlocked.includes(buildingId)) {
    unlocked.push(buildingId);
    await AsyncStorage.setItem(UNLOCKED_BUILDINGS_KEY, JSON.stringify(unlocked));
  }
};

export const isBuildingUnlocked = async (buildingId: string): Promise<boolean> => {
  const unlocked = await getUnlockedBuildings();
  return unlocked.includes(buildingId);
};

export const resetProgress = async (): Promise<void> => {
  await AsyncStorage.removeItem(UNLOCKED_BUILDINGS_KEY);
};

