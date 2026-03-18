# Full Create Background and Skills Section

The second section of [[full-create-mode]]. Contains a Background dropdown and a [[skills-display]].

The Background dropdown defaults to "-- Select a Background --" and offers: Custom Background, then a separator, then named backgrounds: Fitness Training, Book Worm, Hermit, Old Timer, Quick and Small, Rough, Silver Tongued, Street Rattata, Super Nerd, Wild Child, At Least He's Pretty.

When a background is selected, a description paragraph appears (e.g., "Maybe you're a career soldier; maybe you're just a fitness nut." for Fitness Training), followed by a summary of the skill assignments it sets (e.g., "Adept: Athletics", "Novice: Acrobatics", "Pathetic: Guile", "Pathetic: Intuition", "Pathetic: Focus"). The named backgrounds are defined in the [[trainer-background-catalog-constant]].

The skills in the [[skills-display]] update to reflect the background's assignments.

Validation messages appear at the bottom when the background requirements are not met: the background should set exactly 1 skill to Adept, 1 to Novice, and 3 to Pathetic. A separate [[skill-rank-cap-warning]] may also appear.
