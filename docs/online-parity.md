# Đối chiếu online v95

| Tính năng | CTC | PHLT | 2.0 |
|---|---|---|---|
| Đăng ký trước cấp 40, tên online duy nhất | Có | Có | Có |
| Heartbeat 60 giây, đồng bộ online 5 phút, đồng bộ khi ẩn trang | Có | Có | Có |
| Cloud 30 giây, khôi phục liên kết khi đổi thiết bị | Có | Có | Có |
| Bậc cấp, lực chiến server, xếp hạng lực chiến theo bậc | Có | Bổ sung | Bổ sung |
| Kiểm định đồ/điểm và thông báo riêng theo chế độ | Có | Bổ sung | Bổ sung |
| Xếp hạng cấp/lực chiến, chat, đếm người online, Chợ đen | Có | Có | Có |

Các nút Xếp hạng lực chiến / Thông báo kiểm định nằm trong Hệ thống → Chơi Online, không thêm nút trên màn hình chiến đấu. Danh sách tải khi mở, không polling thêm.

Kiểm định dùng đúng trần phẩm chất mỗi chế độ, mẫu native Hoàng Kim/Bạch Kim và dữ liệu khảm Tím. Bạch Kim không hợp lệ ở PHLT; Hoàng Kim/Tím không hợp lệ ở CTC. Ngưỡng giờ tính EXP/tốc độ/chuyển sinh; 2.0 có admin nên không dùng kiểm định giờ cày CTC. Điểm võ công giữ sau chuyển sinh được tính trong ngân sách hợp lệ. Cờ online đã phát hiện được giữ tới khi admin duyệt; không thể xóa bằng một lần sync sạch.

Thêm cột chars.mode và chỉ mục (mode,bracket,flagged,power); bản online cũ tự lấy mode từ snapshot khi nâng schema lần đầu. Không lặp việc quét dữ liệu khi cold start sau đó. Không đổi save nhân vật, tài khoản, giới hạn phẩm chất, tiền hay tỉ lệ rơi.

Tống Kim, Công thành, bang hội/gia tộc và tổ đội bot đã mở cả ba chế độ; đây vẫn là hoạt động mô phỏng/NPC trong game hiện có. Hệ thống không có máy chủ realtime PvP người-với-người; bản này không tuyên bố bổ sung realtime PvP.

Kiểm thử online-modes, online-gear, validate và player-rankings: đăng ký/link/sync mọi chế độ, chống đổi mode, xếp hạng/thông báo không trộn chế độ, cờ tồn tại sau sync sạch, toàn bộ mẫu đồ native hợp lệ, đồ bị sửa và đồ sai trần bị từ chối, điểm sau chuyển sinh không gắn cờ nhầm.
