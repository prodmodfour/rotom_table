Sleep is classified as a volatile condition in [[status-condition-categories]] but does not clear on recall or switching. PTU's specific Sleep text overrides the general volatile behavior — the condition persists until the Pokemon wakes up naturally or is cured.

This is the motivating case for [[condition-independent-behavior-flags]]. Without per-condition flags, Sleep's behavior would require a hardcoded exception to the volatile category rule: "clear all volatile conditions on recall, except Sleep." That exception pattern doesn't scale — it embeds game knowledge in control flow rather than in data.

With behavior flags, Sleep simply has `clears-on-recall: false` while most other volatile conditions have `clears-on-recall: true`. No special case needed. The system treats Sleep the same as any other condition — it just reads different flag values.

This is [[specific-text-over-general-category]] applied concretely: Sleep's specific text ("persists until cured") overrides the general volatile rule ("clears on recall").

## See also
- [[condition-independent-behavior-flags]] — the system that makes this clean
- [[decouple-behaviors-from-categories]] — the design principle Sleep motivates
- [[specific-text-over-general-category]] — the underlying rule at work
- [[status-condition-categories]] — where Sleep is classified as volatile
