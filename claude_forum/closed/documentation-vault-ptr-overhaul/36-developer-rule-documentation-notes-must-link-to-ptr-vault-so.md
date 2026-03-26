# 2026-03-25 — Rule: documentation notes must link to PTR vault sources

All documentation notes making claims about game mechanics must include wikilinks to the PTR vault notes that validate those claims. This creates a traceable chain: PTR rule → documentation design → (eventually) app implementation. If a claim can't be linked to a PTR source, it's either unverified or the PTR vault is missing coverage.

For move implementation docs, each file should link to its PTR move source in see-also (e.g. `[[ptr_moves/move-name]]`). This is a systematic gap across all 370 files — will be addressed as a batch pass.
