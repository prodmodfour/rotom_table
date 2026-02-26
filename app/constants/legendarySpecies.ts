/**
 * Legendary Pokemon species list for PTU capture rate calculations.
 *
 * PTU 1.05 p.310: Legendary Pokemon subtract 30 from capture rate.
 * This list covers canonical legendaries and mythicals from Gen 1-8
 * as present in the PTU pokedex data.
 *
 * Names match the Title Case format stored in SpeciesData.name
 * (e.g., "Mewtwo", "Ho-Oh", "Type: Null").
 */

export const LEGENDARY_SPECIES: ReadonlySet<string> = new Set([
  // Gen 1
  'Articuno',
  'Zapdos',
  'Moltres',
  'Mewtwo',
  'Mew',

  // Gen 2
  'Raikou',
  'Entei',
  'Suicune',
  'Lugia',
  'Ho-Oh',
  'Celebi',

  // Gen 3
  'Regirock',
  'Regice',
  'Registeel',
  'Latias',
  'Latios',
  'Kyogre',
  'Groudon',
  'Rayquaza',
  'Jirachi',
  'Deoxys',

  // Gen 4
  'Uxie',
  'Mesprit',
  'Azelf',
  'Dialga',
  'Palkia',
  'Heatran',
  'Regigigas',
  'Giratina',
  'Cresselia',
  'Phione',
  'Manaphy',
  'Darkrai',
  'Shaymin',
  'Arceus',

  // Gen 5
  'Victini',
  'Cobalion',
  'Terrakion',
  'Virizion',
  'Tornadus',
  'Thundurus',
  'Reshiram',
  'Zekrom',
  'Landorus',
  'Kyurem',
  'Keldeo',
  'Meloetta',
  'Genesect',

  // Gen 6
  'Xerneas',
  'Yveltal',
  'Zygarde',
  'Diancie',
  'Hoopa',
  'Volcanion',

  // Gen 7
  'Type: Null',
  'Silvally',
  'Tapu Koko',
  'Tapu Lele',
  'Tapu Bulu',
  'Tapu Fini',
  'Cosmog',
  'Cosmoem',
  'Solgaleo',
  'Lunala',
  'Nihilego',
  'Buzzwole',
  'Pheromosa',
  'Xurkitree',
  'Celesteela',
  'Kartana',
  'Guzzlord',
  'Necrozma',
  'Magearna',
  'Marshadow',
  'Poipole',
  'Naganadel',
  'Stakataka',
  'Blacephalon',
  'Zeraora',

  // Gen 8
  'Zacian',
  'Zamazenta',
  'Eternatus',
  'Kubfu',
  'Urshifu',
  'Regieleki',
  'Regidrago',
  'Glastrier',
  'Spectrier',
  'Calyrex',
])

/**
 * Check if a species name corresponds to a legendary/mythical Pokemon.
 * Case-insensitive comparison against the canonical list.
 */
export function isLegendarySpecies(speciesName: string): boolean {
  // Direct lookup first (most common path — names already in Title Case)
  if (LEGENDARY_SPECIES.has(speciesName)) {
    return true
  }

  // Case-insensitive fallback for edge cases
  const nameLower = speciesName.toLowerCase()
  for (const legendary of LEGENDARY_SPECIES) {
    if (legendary.toLowerCase() === nameLower) {
      return true
    }
  }

  return false
}
