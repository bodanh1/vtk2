# Bóng nhân vật từ client

- Trích xuất 542 atlas SPR từ PAK theo bảng `settings/npcres`, giữ palette RGB, alpha và toàn bộ khung hình theo hướng.
- Người và bot: chọn bóng theo giới tính, vũ khí và hành động; dùng pha khung hình thân đã lấy mẫu.
- Cưỡi ngựa: dùng bóng Ride gốc của client; chung pha với rig và chung tỉ lệ 0.8. Chênh điểm gốc Y giữa native client (190) và rig H5 (220) được bù 30 pixel trước khi scale.
- NPC/quái: ghép nguồn thân trong bảng NPC với file `b.spr` đi kèm và đồng bộ khung hình. Một số nguồn không chứa bóng gốc; khi đó chiếu chính sprite thân hiện tại xuống mặt đất, có cache giới hạn 64 khung.
- Gỡ hình elip đen ở các vòng vẽ người, bot, quái và rig. Giữ vòng màu ngũ hành phục vụ gameplay.
- Ảnh QA: `shadow-rig-preview.png`, `shadow-npc-preview.png`.

Nhập lại: `node tools/import-client-shadows.mjs "../Client_VLTK_SHXT"`.
Kiểm tra: `node worker/build-game.mjs`, `node --test "worker/test/*.test.js"` (49 bài đạt).
Manifest nguồn đầy đủ: `client-shadow-manifest.json` (không đưa lên Cloudflare assets).
