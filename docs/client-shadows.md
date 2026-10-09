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

## Tối ưu v64

- Texture bóng giảm một nửa mỗi chiều, lọc RGBA theo alpha để tránh viền tối. Giữ mọi hướng và khung nguồn; nhân tỉ lệ lúc vẽ để giữ điểm đặt chân/kích thước. Đường dẫn `-half.png` tránh dùng atlas cũ trong cache trình duyệt.
- Bộ atlas nếu giải mã toàn bộ giảm từ khoảng 2.390 MiB xuống 603 MiB (75%); thực tế trình duyệt chỉ tải các atlas cần cho cảnh hiện tại. Đây là bộ nhớ ảnh phía trình duyệt, không phải RAM của Cloudflare Worker.
- Không tạo bóng chiếu dự phòng khi bóng gốc đang tải.
- Bóng dự phòng dùng strip theo hướng, tối đa 4 tư thế/hành động, LRU tối đa 128 strip hoặc 16 MiB pixel, tối đa 2 lần tạo mỗi khung. Có thể xuất hiện dần khi lần đầu vào cảnh đông; bóng gốc vẫn giữ đủ khung hoạt ảnh.
- Bỏ vẽ quái, xác và vật phẩm ngoài màn hình (có biên 200/80 pixel); vẫn cập nhật nhịp hoạt ảnh và thời gian sống.
- Benchmark mô phỏng cache: 96 đối tượng/180 khung, canvas mới 17.280 → 96. Đây là số cấp phát qua canvas mock, không phải đo FPS thiết bị thật. Chạy `node tools/benchmark-shadow-cache.mjs`.
- 52 bài kiểm tra đạt. Thống kê cache có thể xem tại `window.__clientShadowPerf`.
