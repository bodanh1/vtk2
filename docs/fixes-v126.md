# v126 — tên và màu chat Admin

Tên nhân vật của tài khoản danh hiện đỏ đậm trong khung chat. Vai trò do cookie tài khoản được xác thực khi tạo phiên chat; không tin tên nhân vật hoặc trường isAdmin gửi từ trình duyệt. Lịch sử chat và thông báo WebSocket dùng cùng cờ xác thực. Không đổi cấu trúc DB, không truy vấn tài khoản theo mỗi tin nhắn.

Tên chứa admin (không phân biệt hoa/thường, chuẩn hóa Unicode) chỉ dành cho tài khoản danh. Kiểm tra tạo/đổi tên ở giao diện, đăng ký online, lưu cloud/online và phiên chat. Cache phiên chat tách theo tài khoản để đăng nhập/đăng xuất không dùng nhầm vai trò. Tài khoản danh được đặt admin, admin1, admin2, admin3; các nhân vật tên khác của danh cũng có màu đỏ.
