Three A-D-range moves in the [[movedata-reference-table]] have `damageBase: null` despite dealing damage: Beat Up, Counter, and Bide. Their damage base column in the [[moves-csv-source-file]] contains `See Effect` rather than a number, and the [[move-seed-parses-csv-into-database]] stores this as `null`.

Beat Up triggers Struggle Attacks from the user and adjacent allies (Dark-typed). Counter reflects physical damage at double the amount received. Bide stores damage taken and releases it to adjacent foes. All three derive their damage from runtime context rather than a fixed DB value.

In the [[gm-moves-tab-roll-buttons]], moves with null damage base do not display Attack or Damage roll buttons — only their effect text is shown.
