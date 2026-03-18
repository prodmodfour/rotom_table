# Levels
	- A pokemon can have a level that is between 1 and 20

# Species
	- A pokemon has a Species that determines its starting state at level 1
	- Determines Base Stats, Species Traits, Evolution Chain, Movement Capabilities, Breeding Information
	- Informs Type, Size Information, Diet and Habitat
	
# Base Stats
	- These are the listed stats of a species
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
	- These are the stats that an individual instance of a pokemon has. They are different to base as they are modified through various sources
	- HP
	- Attack
	- Defense
	- Special Attack
	- Special Defense
	- Speed
	- Stamina


## Derived Stats
	- Health
		- (Level * 5) + (HP * 3) + 10
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
	
# Innate Traits
	- These are traits that the pokemon has or can unlock due to its species

# Type
	- N Types, where N is a positive integer that is usually less than 3. 

# Evolution Chains
	- The ability to change Species to one that is further along the Evolution Chain if it meets the required conditions
	- Cannot be modified by traits

# Size Information
	- Height
	- Weight
	- Size Class [Miniscule, Tiny, Small, Medium, Large, Huge, Gargantuan]

# Breeding Information
	- Egg Groups
	- Hatch Rate

# Diet and Habitat
	- Where it is suited to living
	- What it is suited to eating

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
	- These are traits that the pokemon has unlocked due to its own personal story

# Skill List
	- The skills that the Pokemon can use
	- The modifier for each skill

# Move List
	- A list of moves available to the pokemon and their unlock conditions

# PTU -> PTR Notes
	- Getting rid of Base Stat Relations
	- Getting rid of Natures
	- Traits replace Abilities, Capabilities and Natures. 
	- No Features
	- No Edges
	- Changed level range from 1 - 100 to 1 - 20
	- No moves known limit
