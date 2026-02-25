// App settings types

// Damage calculation mode
export type DamageMode = 'set' | 'rolled';

// App-wide settings
export interface AppSettings {
  damageMode: DamageMode;
  defaultGridWidth: number;
  defaultGridHeight: number;
  defaultCellSize: number;
  tunnelUrl?: string | null;
}

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  damageMode: 'rolled',
  defaultGridWidth: 20,
  defaultGridHeight: 15,
  defaultCellSize: 40,
};
