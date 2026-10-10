# Chợ đen

Nút: Mở rộng → Chợ đen. Chỉ tài khoản đã đăng nhập và đang đồng bộ được giao dịch; mỗi chế độ có chợ riêng. Không thu phí.

- Đồ trong hành trang, đã bỏ khóa, có thể đăng giá nguyên bằng KNB hoặc vạn (1 vạn = 10.000 lượng). Tối đa 10 tin đang treo/tài khoản.
- Đăng bán giữ nguyên toàn bộ thuộc tính và lấy đồ khỏi hành trang. Thời hạn đúng 72 giờ theo đồng hồ server.
- B mua đồ A giá 5 KNB: B bị trừ 5 KNB, nhận đồ có UID mới và khóa bảo vệ; A được ghi khoản tiền 5 KNB chờ nhận, kể cả khi A offline.
- Tiền bán và đồ hết hạn tự nhận khi nhân vật đăng bán đồng bộ (chu kỳ 30 giây), hoặc bằng nút Nhận tiền / đồ hết hạn. Có thể rút tin trước hạn. Túi đầy giữ đồ trong chợ, không làm rơi hay bán đồ.
- D1 batch có CHECK bảo vệ revision/quyền thiết bị và trạng thái tin bán, rollback toàn bộ khi xung đột. Request ID chống xử lý lặp trong 7 ngày; sau đó revision cũ vẫn bị từ chối. Bản ghi phản hồi và tin đã nhận được dọn sau thời gian lưu để hạn chế dung lượng DB. Khi phản hồi mạng không rõ kết quả, dừng đồng bộ và yêu cầu tải bản tài khoản.
- Chặn nạp lại inventory trước khi gửi đồ lên chợ theo cặp CID/UID. Giao dịch xóa bản cloud trước để không phục hồi trực tiếp bản trước giao dịch. Game nền hiện vẫn là hệ thống tiến trình phía client; tính năng này không chuyển toàn bộ economy sang server authoritative.

Không có sprite mới, không polling danh sách chợ trong vòng render. Danh sách 20 tin/trang, tìm kiếm debounce; tự nhận chỉ gọi khi heartbeat/save báo có tiền hoặc đồ hết hạn. Tin hết hạn bị loại khỏi danh sách mua ngay, không cần cron; người offline nhận đồ lúc chơi lại.

Kiểm tra: `node --test worker/test/black-market.test.js` và toàn bộ test Worker. Bao gồm giao dịch 5 KNB, tiền vạn, hết hạn/túi đầy, quyền sở hữu, origin/session, revision, nạp bản cũ, gửi lại request, tranh mua cùng món.
