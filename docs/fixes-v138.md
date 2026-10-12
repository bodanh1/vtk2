# v138 — Auto settings and alternate training grounds

- Replace Tự tìm quái and the combined Tự cày preset with a gold wrench / Auto switch beside the minimap toggle. Touch controls have 44px targets; settings selects use 16px text to avoid iOS focus zoom.
- Auto off pauses automatic movement, attacks and pickup. Skill buttons / keys 1–4 request a manual attack with normal range, resource and weapon / mounted restrictions. Temporary manual movement still resumes Auto through the existing idle timer.
- Separate target finding / attack, boss and gold-boss priority, search range, allowed skill slots, HP / MP thresholds and optional retreat at low HP. Buffs retain this server's existing learned passive behavior, rather than adding cosmetic switches that do not change combat.
- Reuse current loot / sell filter, auto equipment / spending / forging. Settings are character save fields. Toggling Auto does not overwrite them. No new UI interval or server request.
- Correct movement braces so manual control no longer follows an old automatic target. Maintain wave-monster priority over bot-only monsters.
- Seven optional training grounds use missing native map artwork: Nhạn Đãng, Kiếm Các Trung Nguyên, La Tiêu, Vũ Di, Miêu Lĩnh, Điểm Thương and Trường Bạch Nam. Keep original stages and level cap 180; reuse existing level, monster and reward templates. These are lightweight 512px background crops from client overview JPGs, not a full native scene / collision port. Total compressed artwork: 793,598 bytes, lazy-loaded on entry.
- Client path evidence: `pak-reference/Sources/Core/Src/Scene/ScenePlaceMapC.cpp` appends `24.jpg`; KScenePlaceC uses `\\Maps\\<maplist path>`. Audit: `client-training-maps.json`; repeat import with `tools/import-training-maps.mjs` and JX_PYTHON pointing at Pillow Python.
- Validation: full Worker tests passed, plus focused Auto / map progression tests and bundle build. Visual testing after deployment covers desktop and narrow portrait viewport; actual iPhone Safari should still be checked on-device.

Research: https://volam.vinarpg.com/ Auto settings UI. Reimplemented against this server's state and combat rules; no foreign source or asset copied.
