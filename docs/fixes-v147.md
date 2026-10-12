# v147 — KNB shop tabs, native luck consumables and mounts

- Move exactly11 pictured mounts (k15,16,17,22–29) from all city horse goods into KNB goods. Existing owned items, requirements, sprite IDs and attributes remain intact; other city mounts are unchanged.
- Price against the existing native strength audit: Hỏa Tinh Kim Hổ Vương500; eight equal-stat appearances k22–29 at1050; Kim Tinh Bạch Hổ Vương1100; Long Tinh Hắc Hổ Vương1600. Equal strength has equal price.
- Three linked shop tabs: Mặt nạ / Ngựa / Thuốc. Keep existing mask catalog, search and prices. Tiên Thảo Lộ stays2KNB /60minutes in Thuốc.
- Quế Hoa Tửu and Thiên Sơn Bảo Lộ cost50KNB each, bought and used immediately. Native magicscript definitions125/72 and skill Lua450/441 specify +20luck /30minutes and +10luck /60minutes. Buying an already-active identical effect is blocked to avoid wasting KNB. Both can be active; expiry is saved on the character.
- Extract exact native item icons zq_icon_004.spr / tianshanyulu.spr from ui.pak; two transparent PNGs total2609bytes. Source audit: client-luck-consumables.json.
- Luck bonus applies only within farm equipment-drop rolls, improving native affix count / selection. It does not affect city/crafting item previews, KNB chance or guaranteed rewards. Reset drop-scope flags in finally, including exceptions.
- Change KNB chance from1% to0.3% and update HUD tooltip. Keep one roll per monster.
- Tests cover50KNB charging, durations, expiry, duplicate use, insufficient balance, mount ownership / exact metadata, city removal, strength pricing, tabs, scoped quality bonus and0.3% boundary.
- Protect consumable expiry fields with the existing local guard. Explicitly disabling Vượt ải / selecting a farm stage now stays disabled instead of being reenabled by the old three-clears retry; legacy recovery after defeat is retained.
