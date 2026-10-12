# v131 — bot mặc định trên map

Nhân vật mới và tiến trình cũ tự bật 5–10 bot lần đầu sau cập nhật, không cần vào menu tạo. Giữ số lượng đã có nếu trong khoảng 5–10; số khác chuyển về một mức ngẫu nhiên trong khoảng này. Mỗi map luyện công duy trì số đó, không cộng dồn khi gọi mỗi frame hoặc tải lại. Thay đổi thủ công sau cập nhật vẫn được giữ.

Dùng cơ chế sinh rải 40ms hiện có, chỉ trên map luyện công; không thêm bot vào tháp/phó bản/Tống Kim/công thành/Luyện công sinh tồn. Cache bộ trang bị/chỉ số theo bot, chế độ và cấp để không tính lại khi đổi ải trong cùng map.
