# v119 — Dọn kho bán đồ và giới hạn buff theo môn phái

- Dọn kho bán toàn bộ vật phẩm chưa khóa trong hành trang, cộng itemValue của từng món vào ngân lượng như bán riêng lẻ. Chỉ giữ locked; không dùng bộ lọc, manualKeep, độ quý hiếm, trang bị bộ, ngựa, khảm hay cường hóa làm điều kiện giữ. Trang bị đang mặc và kho khác không nằm trong phạm vi nút này. Hộp xác nhận và mô tả giao diện đổi từ xóa sang bán.
- Bán thừa và tự bán tiếp tục dùng bộ lọc và các quy tắc bảo vệ của chúng.
- Chỉ số trước đây duyệt tất cả S.sk và có thể áp dụng buff/kỹ năng khác phái còn trong bản lưu. Giờ dùng danh sách kỹ năng của FAC để kiểm tra khi học, tính cấp hiệu dụng, áp dụng buff/bị động/lời nguyền/bổ trợ sát thương và lập danh sách chiêu tấn công. Không xóa kỹ năng hay điểm trong dữ liệu cũ.
- Cache hiệu ứng buff kiểm tra cả phái và đối tượng bảng kỹ năng để không dùng lại vòng sáng của nhân vật/phái trước. Buff vẫn dùng sprite và vị trí gốc đã port ở v118; không thêm ảnh, request máy chủ hoặc hạt hiệu ứng.

Kiểm tra: build Worker, toàn bộ worker/test; chèn các kỹ năng khác phái vào dữ liệu từng môn phái để so chỉ số với bản không có buff; buff Nga My đúng phái vẫn tác dụng; không học được buff Nga My bằng Thiếu Lâm; đổi phái/nhân vật không giữ cache vòng sáng; bán cả đồ quý/ngựa/nhặt tay và giữ đồ khóa, trang bị đang mặc; bán lại kho đã dọn không tăng tiền lần hai. Economy server vẫn tắt.
