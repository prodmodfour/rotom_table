import type { PtuSkillName } from './trainerSkills'

/** A PTU background modifies skill ranks (PTU Core pp. 14-15) */
export interface TrainerBackground {
  name: string
  description: string
  /** Skill raised to Adept */
  adeptSkill: PtuSkillName
  /** Skill raised to Novice */
  noviceSkill: PtuSkillName
  /** 3 skills lowered to Pathetic */
  patheticSkills: [PtuSkillName, PtuSkillName, PtuSkillName]
}

/** Sample backgrounds from PTU Core p. 14 */
export const SAMPLE_BACKGROUNDS: TrainerBackground[] = [
  {
    name: 'Fitness Training',
    description: 'Maybe you\'re a career soldier; maybe you\'re just a fitness nut.',
    adeptSkill: 'Athletics',
    noviceSkill: 'Acrobatics',
    patheticSkills: ['Guile', 'Intuition', 'Focus']
  },
  {
    name: 'Book Worm',
    description: 'Why go outside? Everything you need to know is right here on Bulbapedia!',
    adeptSkill: 'General Ed',
    noviceSkill: 'Pokemon Ed',
    patheticSkills: ['Athletics', 'Acrobatics', 'Combat']
  },
  {
    name: 'Hermit',
    description: 'You don\'t like people, and they tend to not like you.',
    adeptSkill: 'Occult Ed', // PTU: "Adept Education Skill" — player's choice; Occult Ed as default
    noviceSkill: 'Perception',
    patheticSkills: ['Charm', 'Guile', 'Intuition']
  },
  {
    name: 'Old Timer',
    description: 'Age comes with wisdom and experience, and bad hips.',
    adeptSkill: 'Focus',
    noviceSkill: 'Intuition',
    patheticSkills: ['Acrobatics', 'Combat', 'Technology Ed']
  },
  {
    name: 'Quick and Small',
    description: 'You\'re kind of skinny and weak, but smart and quick.',
    adeptSkill: 'Acrobatics',
    noviceSkill: 'Guile',
    patheticSkills: ['Athletics', 'Intimidate', 'Command']
  },
  {
    name: 'Rough',
    description: 'You\'re the kind of guy that\'s likely to end up with a nickname like Knuckles.',
    adeptSkill: 'Combat',
    noviceSkill: 'Intimidate',
    patheticSkills: ['Charm', 'Guile', 'Perception']
  },
  {
    name: 'Silver Tongued',
    description: 'You always know just what to say, but it\'s best no one ask you to get sweaty.',
    adeptSkill: 'Guile',
    noviceSkill: 'Charm',
    patheticSkills: ['Athletics', 'Combat', 'Survival']
  },
  {
    name: 'Street Rattata',
    description: 'Growing up on the street is rough. Well, for all those other suckers.',
    adeptSkill: 'Guile',
    noviceSkill: 'Perception',
    patheticSkills: ['Focus', 'General Ed', 'Survival']
  },
  {
    name: 'Super Nerd',
    description: 'You\'re smart and cunning, but your social skills...',
    adeptSkill: 'Technology Ed',
    noviceSkill: 'Guile',
    patheticSkills: ['Charm', 'Intimidate', 'Intuition']
  },
  {
    name: 'Wild Child',
    description: 'Maybe you were raised by Mightyenas. Or maybe you just had lousy parents.',
    adeptSkill: 'Survival',
    noviceSkill: 'Athletics',
    patheticSkills: ['General Ed', 'Technology Ed', 'Medicine Ed']
  },
  {
    name: 'At Least He\'s Pretty',
    description: 'Looks aren\'t everything... but they\'re better than nothing, right?',
    adeptSkill: 'Charm',
    noviceSkill: 'Command',
    patheticSkills: ['Combat', 'Intimidate', 'Perception']
  }
]
