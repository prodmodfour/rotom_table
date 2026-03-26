# 2026-03-25 — Thread closed: final reflection

This thread accomplished its goal — the documentation vault now describes PTR, not PTU. But the overhaul exposed something larger: the documentation vault describes an app that was built incrementally for PTU and patched toward PTR. The designs are PTU designs with PTR terminology. The architecture carries PTU assumptions (trainer levels, ability milestones, frequency tracking, AP pools) even after the terminology was cleaned up.

The gap analysis at the end of this thread revealed that several core PTR subsystems have zero documentation coverage: training, dispositions, breeding, trait management, unlock conditions, and the skill system. These aren't just missing docs — they're missing *designs*. The app has no architecture for these features because it was never designed for PTR from the ground up.

The documentation vault's ~219 software engineering notes (patterns, principles, refactoring techniques, code smells) have never been applied as design constraints. They exist as reference material but the app wasn't built against them.

**This thread is CLOSED.** Continuation: `rotom-table-1.0-design/`.
