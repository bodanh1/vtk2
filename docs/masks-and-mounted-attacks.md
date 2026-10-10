# Mặt nạ và hoạt ảnh cưỡi ngựa

Mặt nạ là mỹ phẩm riêng của từng nhân vật: `maskOwned` ghi danh sách đã mua, `maskId` là mẫu đang đeo. Không ghi vào `eq`, không thêm thuộc tính, không đổi lực chiến. Mua sở hữu vĩnh viễn; giá được chọn ngẫu nhiên 50–100 KNB khi nhập danh mục và giữ ổn định trong manifest. Mẫu đã mua không bị tính tiền lần nữa.

Shop Bảo vật có mục Mặt nạ: tìm kiếm, 16 mẫu/trang, mua rồi chọn Đeo/Tháo. Ô Mặt nạ gốc (224,75; 28×41) hiển thị ngoại hình đang đeo và mở tủ mặt nạ. Hoạt ảnh mặt nạ lấy theo NPC template của client (npcs.txt đánh chỉ số từ 0; KNpc.cpp đọc template +2). Ưu tiên ngoại hình mặt nạ khi vẽ nhân vật, giữ nguyên trạng thái thú cưỡi và luật dùng kỹ năng. Tháo sẽ trả lại bộ trang bị bình thường.

Nhập được 236 ngoại hình NPC khác nhau có đủ đứng/chạy/đánh; các biến thể dùng cùng ngoại hình gộp thành một mẫu. Manifest `docs/client-masks.json` ghi đầy đủ nguồn/hash, giá và các mục không đủ dữ liệu. 173 dòng bị bỏ do template không có resource NPC thông thường hoặc thiếu sprite; số này không bao gồm các dòng được gộp trùng. Hoạt ảnh tối đa 6 frame mẫu mỗi hướng, giữ đủ hướng và thời lượng gốc; không nạp toàn bộ sprite vào bộ nhớ. Đổi mặt nạ giải phóng cache ảnh của mẫu trước. Metadata được precache, ảnh chỉ tải khi đang đeo/xem trang shop.

Đánh trên ngựa dùng HorseLimit/EqtLimit cho 240 kỹ năng, giữ nguyên nguồn `settings/skills.txt`. Hệ thống đã có RideCut/RidePuncture/RideMagic cho các mẫu thú cưỡi đang hỗ trợ. Bổ sung CharAnimId: Attack1 (9) → RideCut, Attack2 (10) → RidePuncture, Magic (11) → RideMagic; loại bỏ việc đoán động tác theo vũ khí. Chỉ làm ấm các ảnh của bộ cưỡi đang sử dụng, đồng bộ thời lượng theo sprite cưỡi. Nhân vật và bot dùng chung cơ chế.

Tái nhập: `node tools/import-client-masks.mjs`, `node tools/import-client-mount-skills.mjs`. Giá mặt nạ được lấy lại từ manifest hiện có để không thay đổi khi nhập lại.
