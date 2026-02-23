// Main types barrel file - re-exports all domain types
// Import from specific files for better tree-shaking, or from here for convenience

// Spatial types (VTT grid)
export * from './spatial';

// Combat types
export * from './combat';

// Character types (Pokemon, Human)
export * from './character';

// Encounter types
export * from './encounter';

// Habitat/encounter table types
export * from './habitat';

// Template types
export * from './template';

// API and WebSocket types
export * from './api';

// Settings types
export * from './settings';

// Species data types
export * from './species';

// Scene types (narrative scene system)
export * from './scene';

// Player view types
export * from './player';

// Type guards
export * from './guards';
