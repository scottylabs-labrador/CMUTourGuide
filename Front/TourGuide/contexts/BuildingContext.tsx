import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUnlockedBuildings, unlockBuilding as unlockBuildingStorage, resetProgress } from '../utils/buildingStorage';

interface BuildingContextType {
  unlockedBuildings: string[];
  unlockBuilding: (buildingId: string) => Promise<void>;
  isUnlocked: (buildingId: string) => boolean;
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
    try {
      // Check if already unlocked
      if (!unlockedBuildings.includes(buildingId)) {
        await unlockBuildingStorage(buildingId);
        setUnlockedBuildings(prev => [...prev, buildingId]);
      }
    } catch (error) {
      console.error('Error unlocking building:', error);
    }
  };

  const isUnlocked = (buildingId: string): boolean => {
    return unlockedBuildings.includes(buildingId);
  };

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
        clearStorage,
        isLoading,
      }}
    >
      {children}
    </BuildingContext.Provider>
  );
};

