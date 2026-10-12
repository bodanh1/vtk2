# v139 — stage feedback and compact market

- Dược Vương Cốc is level110–120. Stage112 needs character106 under the existing +5 level gate. When the fourth wave completes but progress is gated, show the required character level in the status strip and a deduplicated log / toast. Do not bypass progression gates or grant unearned stages.
- Replace fixed elapsed fight timeout with a no-progress timeout: sample ordinary wave HP / living count once per second and reset the stall timer when damage or kills occur. Long boss fights that still make progress no longer continually restart after45seconds. Bot-only damage does not reset this timer.
- Chợ đen uses the same12px body / button size and14px heading as the admin menu, with compact rows and28x30 icons. Keep16px editable controls and40px button touch targets on mobile to prevent Safari zoom.
- Tests cover the reported level105 / Dược Vương case, advancing at106,120seconds of a slow boss fight, actual no-progress detection and previous Auto / map regressions.
