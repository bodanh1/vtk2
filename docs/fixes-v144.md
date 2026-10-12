# v144 — readable Auto setting switches

- Replace small native-client checkbox art with38x23px gold slide switches. On thumb moves right, off thumb stays left, matching the quick Auto switch.
- Keep a real labeled checkbox with switch semantics, keyboard focus and onchange handlers. Entire44px-tall row is clickable; no bitmap / extra script / timer is added.
- Regression checks cover switch markup, rightward checked-state transform and row touch target.
