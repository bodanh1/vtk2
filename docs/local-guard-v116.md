# v116 — Thử lớp bảo vệ dữ liệu tại máy
Mốc dự phòng trước thay đổi: `backup/pre-local-guard-2026-10-11` (commit `412bcad4`). Mốc này giữ nguyên cơ chế tính tiền/EXP tại máy, lưu tài khoản và giao dịch hiện tại.

Lớp thử nghiệm ngăn sửa trực tiếp biến nhân vật và ghi đè bản lưu từ console/script ngoài các file game. Bảo vệ tiền, EXP, KNB, cấp, điểm, tốc độ tối đa x2, thay đổi hành trang/trang bị và điểm thuộc tính/kỹ năng. Không chặn mở DevTools, không dùng vòng lặp dò F12, không gửi thêm dữ liệu lên máy chủ. Kiểm tra chỉ chạy khi ghi trường được bảo vệ; định dạng bản lưu giữ nguyên.

Giới hạn: chỉ là lớp cản sửa thông thường. Không xác thực được toàn bộ nguồn gốc vật phẩm; sửa thuộc tính bên trong vật phẩm, can thiệp mã tải về, hoặc kiểm soát debugger vẫn có thể vượt qua. Trình duyệt không cung cấp stack sẽ giữ tương thích, không bật chặn. Không phải chống gian lận tuyệt đối.

Kiểm tra: bộ kiểm thử đầy đủ đạt trước bước bổ sung kiểm tra gọi hàm từ console; 5 kiểm thử bảo vệ đạt sau bước bổ sung. Có kiểm tra tương thích định dạng stack Safari; chưa kiểm tra trên iPhone thật. Không dùng tài khoản thật để kiểm tra.

## Quay lại
Revert commit thêm lớp bảo vệ (commit ghi nhận tài liệu này), đẩy lên main và chờ Cloudflare triển khai. Không sửa hay khôi phục database, không thay bản lưu tài khoản của người chơi. Bản lưu được tạo trong v116 vẫn đọc được bằng bản trước vì pack/unpack không đổi.

Nếu muốn lấy toàn bộ mã đúng thời điểm trước thử nghiệm, tạo bản phục hồi từ tag trên; không reset cưỡng bức nhánh chính. Khi quay lại cần tăng tên cache service worker để các trình duyệt đã lưu v116 nhận lại mã cũ.
