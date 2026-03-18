The GM layout (`layouts/gm.vue`) includes an "Advance Day" button with a sun icon in the header. Clicking it opens a confirmation dialog, then triggers the global [[new-day-reset]] via the [[rest-healing-composable]]'s `newDayGlobal()` function.

The button shows a loading state during the API call and a success alert when complete.

## See also

- [[gm-view-routes]]
- [[rest-healing-system]]
