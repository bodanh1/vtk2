> Bản v98 đã triển khai kinh tế tài khoản do server quản lý. Xem [server-economy.md](server-economy.md) để biết phạm vi, mô hình idle theo đợt và cách restore. Nội dung bên dưới ghi lại giới hạn của v97.

# Bảo mật thời gian và tiền — v97

Tốc độ thực tế bị giới hạn x2, kể cả hệ số bảng điều khiển cũ. Save x2 được giữ khi tải lại; save cũ x2.5 được chuyển về x2. API cloud, online và bundle giao dịch dùng chung kiểm tra tốc độ và số dư: từ chối tiền âm, không hữu hạn, sai kiểu hoặc vượt độ chính xác số JavaScript. Chợ vẫn dùng giao dịch nguyên tử, revision và chống phát lại.

Đồng hồ phần thưởng/offline và các hoạt động dùng performance.now trong phiên, được đồng bộ giờ máy chủ qua các phản hồi cloud thành công. Đổi giờ hệ điều hành trong phiên không cộng thêm thời gian. Chơi khách vẫn dùng mốc giờ máy lúc mở trang. Giới hạn thời gian lên cấp lịch sử giữ nguyên để tránh gắn cờ người chơi cũ từng được phép x2.5.

## Giới hạn còn tồn tại

Đây là gia cố, chưa phải chống hack tiền hoàn chỉnh. Client vẫn tạo phần thưởng, vật phẩm và số dư; người sửa JavaScript hoặc save có thể gửi một số dư giả nhưng hợp lệ. Đồng hồ trình duyệt cũng không phải bằng chứng tin cậy. Chữ ký save công khai chỉ kiểm tra lỗi dữ liệu. Không dùng ngưỡng tăng tiền tùy ý vì bán đồ, chuyển kho, sự kiện và cấp đồ admin có thể tạo tăng lớn hợp lệ.

## Thiết kế cần triển khai để chống gian lận thật sự

1. Máy chủ sở hữu số dư và inventory; client gửi hành động, không gửi số dư thay thế. Khách chơi offline cần tách khỏi nền kinh tế giao dịch.
2. Farming/offline: máy chủ tính phần thưởng từ thời gian server và checkpoint, giới hạn x2; lưu seed/drop, phí và kết quả trong một transaction có action ID duy nhất.
3. Shop, bán đồ, kho, thưởng sự kiện, admin và chợ dùng cùng ledger có debit/credit; vật phẩm có ID server duy nhất. Chợ không được nhận tiền từ bundle client.
4. Chuyển tài khoản cũ bằng snapshot baseline có kiểm duyệt; khóa chức năng nhập/thay save để không mint tiền hoặc nhân bản đồ qua tài khoản mới.
5. Kiểm thử request trùng, hai thiết bị, clock jump, rollback, reconnect và bất biến tổng tiền/đồ trước khi bật giao dịch với tài khoản mới.

Các thay đổi nền tảng này cần thực hiện đồng bộ mọi nguồn tiền và vật phẩm trước khi có thể tuyên bố chống sửa tiền.
