# Isometric Projection Transforms World to Screen

`useIsometricProjection` provides the pure math for converting between grid coordinates and pixel positions on the [[isometric-canvas-renders-everything-on-canvas]]. It implements world-to-screen and screen-to-world transformations that account for the current camera rotation ([[isometric-camera-rotates-cardinal-directions]]).

The composable also computes tile diamond point coordinates (the four corners of an isometric tile), depth sorting keys for [[isometric-depth-sorting-uses-painters-algorithm]], and a grid origin offset to keep the grid centered in the viewport regardless of camera angle.

Screen-to-world conversion (inverse projection) is used by `useIsometricInteraction` to determine which grid cell the cursor hovers over.
