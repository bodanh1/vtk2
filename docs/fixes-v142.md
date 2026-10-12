# v142 — independent Auto point switches

- Wire the new automatic skill-point switch to the level-up handler independently from the attribute-point switch. Previously the legacy attribute option spent both categories.
- Preserve old characters' combined behavior until they explicitly edit Auto settings. First Auto edit stores the old skill choice before applying changes, so toggling attributes does not silently enable skill spending.
- Focused regression tests cover separate on/off combinations and legacy undefined autoSk.
