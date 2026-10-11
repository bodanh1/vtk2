# v108 — đồng bộ tài khoản trên trình duyệt cũ / bộ nhớ đầy

Hai trường hợp tái hiện trong kiểm thử:

- Thiếu `crypto.randomUUID`: `economyPayload()` ném TypeError trước khi gửi yêu cầu, nên chu kỳ lưu EXP và thao tác kinh tế không đến server. Script tương thích 0,5 KB chạy trước mọi script game, tạo UUID v4 bằng `crypto.getRandomValues`, giữ nguyên hàm gốc nếu có. Không tăng số request hoặc thêm thư viện.
- Server đã trả bản lưu thành công nhưng `localStorage` ném `QuotaExceededError` / `SecurityError`: trước đây `economyApply()` dừng trước khi cập nhật revision và tính lại nhân vật. Nay việc ghi bản nhớ tại máy tách khỏi việc nhận dữ liệu server; EXP, revision và trạng thái nhân vật vẫn cập nhật. Trạng thái thông báo rõ tài khoản đã lưu trên server và bộ nhớ máy đầy/bị chặn. Không xóa dữ liệu tại máy để lấy chỗ trống. Các lỗi tính toán khác vẫn được báo.

Kiểm chứng: 38 bài kiểm tra về lưu EXP, mua bán, khôi phục checkpoint, quyền thiết bị, đăng nhập và hạn mức đều đạt. Kiểm thử mới chạy hai lần lưu liên tiếp khi bộ nhớ đầy (revision 1→2→3), ghi binding bị chặn rồi phục hồi, gửi cả lưu EXP và thao tác mua trên trình duyệt không có randomUUID, và kiểm tra ID đúng UUID v4 / không trùng.

Không truy cập dữ liệu riêng của người chơi hoặc xác định được tài khoản cụ thể đang phản ánh. Đây là các lỗi trong mã đã tái hiện; các trường hợp khác cần thông báo lỗi/tên tài khoản để đối chiếu. Không đổi công thức EXP, giá, tốc độ tối đa x2 hoặc cơ chế chống phát lại giao dịch.
