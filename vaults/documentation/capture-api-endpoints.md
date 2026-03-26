# Capture API Endpoints

2 endpoint files under `app/server/api/capture/`, using [[nitro-file-based-routing]].

| Method | Path | Action |
|---|---|---|
| POST | `/api/capture/rate` | Calculate [[capture-rate-formula|capture rate]] with ball modifier breakdown. Auto-detects [[legendary-species-detection|legendary species]]. Accepts optional `ballType`, optional `encounterId`/`trainerId` for full [[ball-condition-service|ball condition context]] |
| POST | `/api/capture/attempt` | Execute capture using [[capture-roll-mechanics|1d100 roll]]. Validates [[capture-accuracy-gate|accuracy gate]] when `accuracyRoll` provided. On success: sets ownerId, origin=`captured`, [[pokemon-loyalty|loyalty=2]]. Applies post-capture effects (Heal Ball, Friend Ball, Luxury Ball). Checks [[trainer-owned-species-tracking|new species]]. Broadcasts `capture_attempt` WebSocket event |

## See also

- [[api-endpoint-layout]]
- [[poke-ball-system]]
- [[capture-rate-formula]]
- [[capture-roll-mechanics]]
- [[pokemon-loyalty]] — captured Pokemon start at loyalty 2
