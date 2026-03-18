# Base Stats
	- These are the listed stats of a species
	- Trainers are the Human species
	- Base HP
	- Base Attack
	- Base Defense
	- Base Special Attack
	- Base Special Defense
	- Base Speed
	- Base Stamina
	- Base Stat Total
	- Cannot be modified by traits

# Stats
	- These are the stats that an individual instance of a trainer has. They are different to base as they are modified through various sources
	- HP
	- Attack
	- Defense
	- Special Attack
	- Special Defense
	- Speed
	- Stamina

## Derived Stats
	- Health
		- (HP * 3) + 10
	- Current Attack
		- ((Attack * Multipliers) * Combat Stage Factor) + Modifiers
	- Current Defense
		- ((Defense * Multipliers) * Combat Stage Factor) + Modifiers
	- Current Special Attack
		- ((Special Attack * Multipliers) * Combat Stage Factor) + Modifiers 
	- Current Special Defense
		- ((Special Defense * Multipliers) * Combat Stage Factor) + Modifiers
	- Current Speed
		- ((Speed * Multipliers) * Combat Stage Factor) + Modifiers

# Movement
## Movement Rates
	- Rate of movement per Movement Point spent in a given mode (0 means it cannot move in that mode)
		- Land
		- Sky
		- Water
		- Phase
		- Teleport
		
## Movement Points
	- A number of points that can be spent on movement
	- Has a maximum value (based on species, modifiable by traits)
	- Start combat with max value (unless theres a reason you don't)
	- Points carry over

# Learned Traits
	- These are traits that the trainer has unlocked due to its own personal story

# Size Information
	- Height
	- Weight
	- Size Class [Miniscule, Tiny, Small, Medium, Large, Huge, Gargantuan]

# Type
	- Humans are typeless

# Skill List
	- The skills that the trainer can use
	- The modifier for each skill

# Move List
	- A list of moves available to the trainer and their unlock conditions

# PTU -> PTR Notes
	- No levels
	- No Features
	- No Edges
	- No Classes
