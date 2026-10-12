# v151 — Bộ lọc nhặt theo bộ trang bị

- Hành trang → bộ lọc, và Auto → bộ lọc nhặt/bán dùng chung lựa chọn mới “Theo bộ trang bị”. Có thể thêm nhiều bộ, bỏ từng bộ, lọc danh sách theo môn phái. Nhớ cùng dữ liệu nhân vật và chu kỳ lưu hiện tại.
- Mã lựa chọn `kind:grp`, phân biệt Hoàng Kim/Bạch Kim có cùng mã nhóm. Dùng dữ liệu client hiện có, nhãn theo phần tên chung và mã bộ, không ghép các nhóm khác nhau chỉ vì trùng tên. Chỉ hiện loại đồ bộ có trong chế độ hiện tại.
- Thêm bộ bật chế độ Theo bộ trang bị: chỉ nhặt đúng những bộ chọn, không dùng màu/cấp/chỉ số hay yêu cầu mặc được để vô tình bỏ món cần sưu tầm. Không chọn bộ nào thì không nhặt trang bị. Tiền/nguyên liệu vẫn theo cơ chế cũ. Có thể quay lại Thông minh/Nhặt hết/Theo bộ lọc bất cứ lúc nào.
- Các bộ trong túi vẫn được bảo vệ theo cơ chế đồ quý hiện có. Bộ khớp được nhặt, giữ sau dọn tự động; đồ không khớp ở đất không bị chạy tới nhặt. Nhặt tay vẫn dùng được.
- Danh mục và ánh xạ nhóm lưu cache một lần, chỉ tạo giao diện khi mở bộ lọc; không thêm ảnh, thư viện, polling hoặc bảng D1. Khóa giới hạn 64 lựa chọn và bỏ mã không tồn tại khi nạp dữ liệu.
