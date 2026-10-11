# v120 — Đường Môn Tụ Tiễn cưỡi ngựa

Nút Lên ngựa còn một điều kiện tạm chặn toàn bộ Đường Môn, dù kiểm tra từng kỹ năng và bộ hoạt ảnh đã hỗ trợ từ các bản trước. Bỏ điều kiện này, giữ kiểm tra ngựa đã trang bị, yêu cầu trang bị và nhân vật còn sống.

Đối chiếu trực tiếp settings/skills.txt:

| Skill | Mã | HorseLimit | EqtLimit | CharAnimId |
| --- | --- | --- | --- | --- |
| Thiên La Địa Võng | 58 | 0 (cả hai) | 102 (Tụ Tiễn) | 11 (RideMagic) |
| Bạo Vũ Lê Hoa | 302 | 0 (cả hai) | 102 (Tụ Tiễn) | 11 (RideMagic) |
| Mạn Thiên Hoa Vũ | 54 | 1 (đi bộ) | 102 | 11 |
| Phích Lịch đơn | 45 | 0 (cả hai) | -2 (không hạn chế) | 11 |

H5 giữ ngựa khi đánh skill 58/302 với vũ khí ranged d=1, k=2; skill 54 tự xuống ngựa. Sai loại vũ khí không xuất chiêu. Dùng lại RideMagic HM01 của client đã port, có kiểm tra cả nam/nữ và các lớp ngựa, không thêm ảnh hoặc request mạng.

Kiểm tra: kiểm tra nút mount-ui thực sự cho Đường Môn lên/xuống ngựa, kỹ năng 58/302 giữ ngựa, 54 xuống ngựa, sai vũ khí/không có ngựa; bộ kiểm tra mount.test và mounted-attacks.test đối chiếu HorseLimit/EqtLimit/CharAnimId với client và hoạt ảnh HM01.
