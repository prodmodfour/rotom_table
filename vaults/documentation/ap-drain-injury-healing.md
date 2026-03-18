Trainers (but not Pokemon) can heal one injury by draining 2 [[trainer-action-points]]. This bypasses the 24-hour timer required by [[natural-injury-healing]] but still counts toward the daily 3-injury cap.

Implemented in `server/api/characters/[id]/heal-injury.post.ts` with `method: 'drain_ap'`. The endpoint validates sufficient available AP before proceeding.

## See also

- [[rest-healing-system]]
- [[natural-injury-healing]]
