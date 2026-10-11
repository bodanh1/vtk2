# v118 — Ô nhân vật, boss hoạt động và hiệu ứng buff client

- Bảng tài khoản có nút Tạo nhân vật ở ô trống, gồm ô 2 và 3. Khi đang chơi, lưu nhân vật hiện tại trước; kiểm tra quyền thiết bị, phiên bản lưu và ô vẫn trống trước khi tải. Giữ toàn bộ ba ô và kho; không ghi đè ô đã có nhân vật. Bảng xem trước bản lưu không có nút tạo.
- Sáu mẫu boss129–boss134 chưa xuất hiện trong world/mask H5: đủ đứng, chạy, đánh, chịu đòn, chết; luân phiên ở tầng boss Tháp I/II và phòng cuối phụ bản. Đổi hình dạng, giữ nguyên tên, template, chỉ số, phần thưởng và tỉ lệ rơi của hoạt động.
- 21 hiệu ứng trạng thái buff theo StateSpecialId trong skills.txt và bảng trạng thái NPC: Nga My, Thiếu Lâm, Thiên Vương, Thúy Yên, Cái Bang, Thiên Nhẫn, Võ Đang, Côn Lôn. Các phái không có nguồn trạng thái phù hợp không được gán vòng sáng giả.
- Buff theo các kỹ năng đã học và đang áp dụng trong calc(), hiện liên tục vì H5 đang áp dụng buff tự động. Tối đa hai lớp mỗi vị trí Foot/Body/Head như client. Body phân lớp trước/sau theo khoảng khung gốc; Head/Body bù 38 đơn vị client khi cưỡi, Foot neo chân ngựa. Xóa cache khi recalc và ẩn khi chết/offline simulation.
- Giảm hiệu ứng: giữ một vòng chân tĩnh, bỏ các lớp khác. Không tạo thêm hạt, không tăng FX_MAX, không thêm yêu cầu máy chủ.
- Atlas cắt vùng trống, buff tối đa 8 khung, boss tối đa 6 khung/hướng (8 hướng). WebP lossless, đối chiếu toàn bộ RGBA sau mã hóa. Tổng khoảng 4,38 MiB (buff khoảng 339 KiB), tải theo sprite thực sự xuất hiện; ảnh không nằm trong precache. Tất cả atlas sau giải mã tổng 13.872.672 pixel; đây là ngân sách tài nguyên, chưa phải phép đo FPS trên iPhone.

Nguồn: settings/skills.txt, settings/npcres/×´Ì¬Í¼ÐÎ¶ÔÕÕ±í.txt, settings/npcres/ÆÕÍ¨npc×ÊÔ´.txt và PAK theo package.ini. Đối chiếu KNpcRes.cpp, CStateMagicTable và KSprControl.cpp: vòng đời trạng thái độc lập hiệu ứng xuất chiêu, chu kỳ theo 18 tick/giây, vị trí theo sprite header và fallback NPC 160/192.

Tái tạo: node tools/import-client-buffs-bosses.mjs, rồi Python có Pillow chạy tools/compress-client-buffs-bosses.py. Báo cáo nguồn, PAK, neo, số khung, dung lượng nằm trong client-buffs-bosses.json.

Kiểm tra: build Worker; toàn bộ worker/test; kiểm tra buff bám tọa độ, rút điểm/chết, giảm hiệu ứng/cưỡi ngựa, lựa chọn boss theo hoạt động; tạo ô trống, ô đã có nhân vật, phiên bản lưu thay đổi và lỗi lưu hiện tại. Cơ chế economy trên server tiếp tục tắt, local guard v116 và backup trước local guard vẫn giữ.
