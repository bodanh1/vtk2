# v149 — Oẳn tù tì trả kết quả 5 giây sau Đặt cược

- Bỏ hoàn toàn chu kỳ ván một phút và khóa 5 giây cuối phút. Khi chưa đặt không có đếm ngược.
- Bấm Đặt cược trừ tiền một lần, khóa Kéo / Búa / Bao, loại tiền, mức cược và nút cược. Kết quả cố định khi đặt, trả sau 5 giây theo đồng hồ game; mở khóa và chơi ván tiếp ngay.
- Dùng lại nhịp giao diện 500ms. Kiểm tra ván đến hạn trước nhánh cập nhật chữ mỗi giây, tránh trả muộn do bộ nhớ đệm giây. Không thêm vòng polling, ảnh hoặc yêu cầu mạng. Giữ vị trí cuộn bảng khi kết quả hiện.
- Ván đang chờ của bản cũ giữ nguyên cược/kết quả; rút thời gian chờ còn tối đa 5 giây khi mở nhân vật, không trừ lại tiền. Ván cũ đã hết hạn được trả ngay, đúng một lần. Lưu/tải lại vẫn giữ mốc hết hạn đã đặt.
- Giữ mức trả ×1,9, hoàn tiền khi hòa, tiền vạn / KNB, 12 ván lịch sử, không giới hạn lượt ngày và toàn bộ cơ chế Tài Xỉu của v148.
- Kiểm tra mốc 4.999/5.000 giây, khóa toàn bộ lựa chọn, nhấp đúp không cược lại, chơi tiếp ngay, 101 ván liên tục ở ba chế độ, dữ liệu chờ cũ, giữ dữ liệu khi đổi nhân vật và trả đúng một lần.
