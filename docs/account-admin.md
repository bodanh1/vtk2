# Admin tài khoản

Tài khoản cloud đã tồn tại có tên đăng nhập `danh` là admin. Máy chủ xác định quyền từ cookie phiên đăng nhập và bản ghi tài khoản; tên nhân vật, dữ liệu lưu và tham số gửi từ trình duyệt không cấp quyền. Tên `danh` được dành riêng, không đăng ký mới qua API công khai. Đăng nhập không phân biệt hoa thường. Các tên tài khoản khác được chuẩn hóa chữ thường và có UNIQUE trong cơ sở dữ liệu.

Nút Admin cạnh Xếp hạng chỉ hiện khi API xác nhận `isAdmin`. Menu gồm trang bị, thú cưỡi đủ sprite H5, Hoàng Kim, Bạch Kim, nguyên liệu, thuốc, tiền/bảo vật; tìm kiếm không dấu, lọc loại/phái và phân trang 40 món. Thuốc/nguyên liệu vào kho tương ứng. Tiên Thảo Lộ thêm thời gian hiệu ứng như cửa hàng hiện tại. Trang bị vào hành trang, khóa bảo vệ, không tự mặc. Phẩm chất và yêu cầu sử dụng của chế độ vẫn áp dụng.

`GET /api/cloud/admin/catalogue` và `POST /api/cloud/admin/grant` yêu cầu phiên admin. Cấp đồ kiểm tra quyền thiết bị, revision, slot, mã danh mục, số lượng và chỗ trống. Trình duyệt tạm dừng mô phỏng trong lúc đồng bộ/cấp đồ. Bản lưu và nhật ký `admin_grants` cập nhật nguyên tử; requestId chống cấp hai lần khi gửi lại. Chỉ trả phần thay đổi để giữ phản hồi nhỏ. Nhật ký không chứa mật khẩu/token. Không liên quan khóa ADMIN_KEY của các công cụ quản trị góp ý/PvP cũ.

Danh mục lấy từ dữ liệu game đang port, không phát những vật phẩm PC chưa có cơ chế H5. Tham chiếu đồ bộ/mảnh và thú cưỡi được sinh bằng `node tools/build-admin-reference.mjs` sau `node worker/build-game.mjs`, không đưa sprite hay toàn bộ ref.js vào Worker. Chạy lại khi thay dữ liệu vật phẩm/ref/thú cưỡi. Lược đồ được ensureSchema tạo tự động; SQL tham chiếu nằm trong migrations/0005_account_admin.sql.

Nếu mất kết nối khi nhận đồ, dừng đồng bộ để tránh ghi đè kết quả đã cấp. Mở Tài khoản và tải bản máy chủ để tiếp tục.
