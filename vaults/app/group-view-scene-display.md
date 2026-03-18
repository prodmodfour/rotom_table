# Group View Scene Display

When the [[group-view-tab-state]] is set to "scene" and an active scene exists, the [[group-view-page]] shows a read-only scene rendering. It includes:

- A background image (if set) covering the viewport at 80% opacity
- A weather overlay with CSS animations specific to each weather type (rain drops, snow particles, hail, sandstorm shimmer, fog blur, sun pulse, wind streaks)
- A location header with the location name and description, rendered over a dark gradient
- Pokemon sprites positioned on the canvas by their percentage coordinates, each showing a name label with level
- Character avatars as circular frames positioned on the canvas
- Groups as dashed-border rectangles with name labels and member count badges

When no active scene exists, the display shows a clapperboard icon, the heading "No Active Scene", and the message "The GM will set up a scene for the narrative view."

Each weather type has distinct background gradients — sunny is warm yellow, rain is dark slate, fog is grey with `backdrop-filter: blur`, harsh sunlight is deep orange, heavy rain is dark navy, strong winds are steel blue-grey.
