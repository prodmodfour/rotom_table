# Isometric Depth Sorting Uses Painter's Algorithm

`useDepthSorting` defines a layer ordering for the [[isometric-canvas-renders-everything-on-canvas]]: terrain is drawn first, then the grid, then tokens, then fog. Within each layer, items are sorted by a depth key computed from their isometric position so that objects closer to the camera occlude those further away.

The depth key computation in [[isometric-projection-transforms-world-to-screen]] accounts for the current camera rotation so the sort order stays correct when the camera rotates ([[isometric-camera-rotates-cardinal-directions]]).

This painter's algorithm approach is why isometric mode renders tokens on the canvas rather than as DOM elements — tokens must interleave with terrain and fog in the draw order.
