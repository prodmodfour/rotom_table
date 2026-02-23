// Spatial types for VTT (Virtual Tabletop) functionality

// Camera angle for isometric view (0 = default, 1 = 90deg CW, 2 = 180deg, 3 = 270deg)
export type CameraAngle = 0 | 1 | 2 | 3;

// Grid position (cell coordinates)
export interface GridPosition {
  x: number;
  y: number;
  z?: number; // Elevation level (0 = ground, positive = above, negative = below)
}

// Pixel position (for rendering)
export interface PixelPosition {
  px: number;
  py: number;
}

// Grid configuration
export interface GridConfig {
  enabled: boolean;
  width: number;      // Number of cells wide
  height: number;     // Number of cells tall
  cellSize: number;   // Pixels per cell
  background?: string; // URL to background image
  // Isometric grid settings
  isometric: boolean;         // Feature flag: false = flat 2D (default), true = isometric
  cameraAngle: CameraAngle;   // 0 | 1 | 2 | 3 (cardinal rotation)
  maxElevation: number;       // Max elevation levels (default 5)
}

// Token on the grid (combatant representation)
export interface TokenState {
  combatantId: string;
  position: GridPosition;
  size: number;        // Token size in cells (1 = 1x1, 2 = 2x2, etc.)
  visible: boolean;    // For fog of war (future feature)
  elevation: number;   // For flying/burrowing (0 = ground level)
}

// Movement capabilities (from PTU species data)
export interface MovementSpeeds {
  overland: number;
  swim: number;
  sky: number;
  burrow: number;
  levitate: number;
  teleport: number;
}

// Terrain type for map cells
export type TerrainType =
  | 'normal'
  | 'difficult'    // 2x movement cost (PTU: Slow Terrain)
  | 'blocking'     // Cannot pass
  | 'water'        // Requires swim (PTU: Underwater)
  | 'earth'        // Requires burrow (PTU: Earth Terrain)
  | 'rough'        // -2 accuracy penalty (PTU: Rough Terrain)
  | 'hazard'       // Damage on entry (app-specific)
  | 'elevated';    // Height difference (app-specific)

// Terrain cell data
export interface TerrainCell {
  position: GridPosition;
  type: TerrainType;
  elevation: number;
  note?: string;
}

// Range types from PTU moves
export type RangeType =
  | 'melee'              // Adjacent only (1 cell)
  | 'ranged'             // Specific distance
  | 'self'               // Targets self only
  | 'burst'              // Circle around user or target
  | 'cone'               // Cone from user
  | 'line'               // Line from user
  | 'close-blast'        // Square adjacent to user
  | 'ranged-blast'       // Square at range
  | 'cardinally-adjacent' // Only orthogonal adjacent (not diagonal)
  | 'field';             // Affects entire battlefield

// Parsed range from move data
export interface ParsedRange {
  type: RangeType;
  distance: number;  // For ranged, burst, cone, line, close-blast
  // For burst/cone/line/close-blast, this is the size parameter
}

// Area of effect result (cells affected by a move)
export interface AffectedArea {
  cells: GridPosition[];
  origin: GridPosition;
  range: ParsedRange;
}

// Distance calculation result
export interface DistanceResult {
  cells: number;      // Grid distance in cells
  meters: number;     // PTU uses 1 cell = 1 meter
  inRange: boolean;   // Whether target is in range
}

// Movement path for token
export interface MovementPath {
  start: GridPosition;
  end: GridPosition;
  path: GridPosition[];  // Intermediate cells
  totalCost: number;     // Movement points spent
  valid: boolean;        // Whether movement is legal
  reason?: string;       // If invalid, why
}

// WebSocket events for VTT
export type VTTWebSocketEvent =
  | { type: 'position_update'; data: { combatantId: string; position: GridPosition } }
  | { type: 'grid_config_update'; data: GridConfig }
  | { type: 'terrain_update'; data: { cells: TerrainCell[] } }
  | { type: 'token_size_update'; data: { combatantId: string; size: number } };
