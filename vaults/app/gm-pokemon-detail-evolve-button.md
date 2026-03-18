The [[gm-pokemon-detail-page]] header contains an "Evolve" button with an icon. Clicking it sends a `POST /api/pokemon/:id/evolution-check` request to check whether the Pokemon is eligible to evolve.

If the check succeeds and multiple evolution targets exist (branching evolution), a selection modal appears. The user selects the target, then an [[evolution-confirm-modal]] opens with a multi-step flow for stat redistribution, ability remapping, and move learning.

If the check fails (e.g., the API returns 404 for a species without evolution data), an error alert appears at the bottom of the page: "Evolution check failed: [POST] \"/api/pokemon/.../evolution-check\": 404 Server Error". The alert has a "Dismiss" button.

The Evolve button is hidden when in [[gm-pokemon-detail-edit-mode]].

## See also

- [[evolution-service]]
- [[evolution-check-utility]]
