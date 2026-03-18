# Mounted Token Renders Rider Overlay

`VTTMountedToken.vue` renders a mounted pair on the [[battle-grid]]: the mount token appears at full size with the rider sprite overlaid at 60% scale in the lower-right corner. An intercept badge (per PTU p.218) is shown on the mount.

In 2D mode ([[flat-grid-uses-canvas-plus-dom-tokens]]), mounted pairs use this dedicated component instead of two separate `VTTToken` instances. In isometric mode ([[isometric-canvas-renders-everything-on-canvas]]), mounts are rendered differently — both sprites are drawn on the canvas with the rider offset.

Both the mount and rider are individually selectable via separate click handlers.

## See also

- [[grid-movement-selects-speed-by-terrain]] — mounted pairs share a movement pool
