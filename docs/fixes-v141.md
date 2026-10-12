# v141 — callable Kỳ ngộ reward

- Production browser logs exposed an existing modes_play error: `e[2()]` called the number2 instead of the reward function stored at index2. Change to `e[2]()`.
- Regression test runs a callable Kỳ ngộ reward and checks message, counter and save; bundle build passed.
- Auto switch / settings are visible in production after the static asset budget correction. Responsive checks and actual iPhone Safari have different coverage; no claim of on-device Safari testing.
