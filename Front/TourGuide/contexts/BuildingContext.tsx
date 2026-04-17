import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { getUnlockedBuildings, unlockBuilding as unlockBuildingStorage, resetProgress } from '../utils/buildingStorage';
import { SCANNABLE_BUILDING_IDS, isScannableBuilding } from '../config/scannableBuildings';

interface BuildingContextType {
  /** Scannable buildings the user has explicitly unlocked (persisted). */
  unlockedBuildings: string[];
  unlockBuilding: (buildingId: string) => Promise<void>;
  /**
   * True if the building is unlocked for viewing. Non-scannable buildings are
   * always unlocked; scannable buildings must be found via camera scan.
   */
  isUnlocked: (buildingId: string) => boolean;
  /** True if the building is part of the scan-to-unlock set. */
  isScannable: (buildingId: string) => boolean;
  /** The canonical list of scannable building IDs. */
  scannableBuildingIds: readonly string[];
  /** Number of scannable buildings the user has unlocked. */
  unlockedScannableCount: number;
  /** Total number of scannable buildings. */
  totalScannableCount: number;
  clearStorage: () => Promise<void>;
  isLoading: boolean;
}

const BuildingContext = createContext<BuildingContextType | undefined>(undefined);

export const useBuildings = () => {
  const context = useContext(BuildingContext);
  if (!context) {
    throw new Error('useBuildings must be used within BuildingProvider');
  }
  return context;
};

interface BuildingProviderProps {
  children: ReactNode;
}

export const BuildingProvider: React.FC<BuildingProviderProps> = ({ children }) => {
  const [unlockedBuildings, setUnlockedBuildings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUnlockedBuildings = async () => {
      try {
        const unlocked = await getUnlockedBuildings();
        setUnlockedBuildings(unlocked);
      } catch (error) {
        console.error('Error loading unlocked buildings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUnlockedBuildings();
  }, []);

  const unlockBuilding = async (buildingId: string) => {
    if (buildingId == "Error") {
      return;
    }
    // Non-scannable buildings are always unlocked; no need to persist them.
    if (!isScannableBuilding(buildingId)) {
      return;
    }
    try {
      if (!unlockedBuildings.includes(buildingId)) {
        await unlockBuildingStorage(buildingId);
        setUnlockedBuildings(prev => [...prev, buildingId]);
      }
    } catch (error) {
      console.error('Error unlocking building:', error);
    }
  };

  const isUnlocked = (buildingId: string): boolean => {
    if (!isScannableBuilding(buildingId)) return true;
    return unlockedBuildings.includes(buildingId);
  };

  const unlockedScannableCount = useMemo(
    () => unlockedBuildings.filter(isScannableBuilding).length,
    [unlockedBuildings]
  );

  const clearStorage = async () => {
    try {
      await resetProgress();
      setUnlockedBuildings([]);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  };

  return (
    <BuildingContext.Provider
      value={{
        unlockedBuildings,
        unlockBuilding,
        isUnlocked,
        isScannable: isScannableBuilding,
        scannableBuildingIds: SCANNABLE_BUILDING_IDS,
        unlockedScannableCount,
        totalScannableCount: SCANNABLE_BUILDING_IDS.length,
        clearStorage,
        isLoading,
      }}
    >
      {children}
    </BuildingContext.Provider>
  );
};
