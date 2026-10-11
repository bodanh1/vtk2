# v112 — Sửa vị trí mặt nạ
Sprite có CenterX/CenterY bằng 0 dùng điểm neo mặc định 160/192 khi chiều rộng lớn hơn 160, đúng KRepresentShell3.cpp của client. Bản nhập trước đọc 0 thành điểm neo nên hình đứng, chạy và đánh bị lệch sang phải/xuống dưới.

Sửa metadata của 1.089/1.215 bộ hoạt ảnh, giữ nguyên PNG, kích thước, số khung hình và giá mặt nạ. Sửa công cụ nhập để giữ đúng điểm neo trong lần nhập tiếp theo. Tăng phiên bản cache dữ liệu để trình duyệt nhận bản sửa.

Kiểm tra: 5 kiểm thử mặt nạ đạt; đối chiếu toàn bộ 1.215 bộ sprite với header client; kiểm tra tọa độ đứng/chạy/đánh ở 8 hướng và tính chất trang trí không thay đổi chỉ số.
