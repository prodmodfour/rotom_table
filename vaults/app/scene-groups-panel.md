# Scene Groups Panel

A collapsible left-side panel in the [[scene-editor-page]] titled "Groups." Shows a "+" button to create a new group and a collapse toggle.

When no groups exist, the panel displays "No groups. Click + to create one." Created groups appear as list items with inline-editable names, member counts, and a delete button. Selecting a group highlights it on the [[scene-canvas]].

Groups are displayed on the canvas as dashed-border rectangles. Entities dragged into a group's area become members. Deleting a group unassigns all its members (sets their groupId to null) rather than removing them from the scene.
