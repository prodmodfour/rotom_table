# Encounter Template Grid Config Uses Separate Columns

Grid configuration in the [[encounter-template-prisma-model]] is stored as six separate nullable columns (`gridWidth`, `gridHeight`, `gridCellSize`, `gridIsometric`, `gridCameraAngle`, `gridMaxElevation`) rather than as a JSON blob.

The [[encounter-template-api-endpoints|API endpoints]] restructure these columns into a nested `gridConfig` object in responses and flatten the object back into individual columns on writes. The three isometric fields (`gridIsometric`, `gridCameraAngle`, `gridMaxElevation`) are captured by the `from-encounter` endpoint but not by the standard create/update endpoints.
