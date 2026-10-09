# Các thú cưỡi có trong source

Dữ liệu `data.js` → `JX.items[10]`: 330 bản ghi, 33 mã loại (`k`), 54 tên khác nhau. Nhiều bản ghi là các bậc của cùng một tên.

| Tên | Mã loại | Bậc đồ | Cấp nhân vật yêu cầu |
| --- | --- | --- | --- |
| Liệt Hoàng Mã | 0 | 1–2 | 20–25 |
| Hoàng Mã | 0 | 3–4 | 30–35 |
| Hoàng Phiêu | 0 | 5–6 | 40–45 |
| Đại Uyển Hoàng Mã | 0 | 7–8 | 50–55 |
| Phi Hoàng | 0 | 9–10 | 60–72 |
| Liệt Thanh Mã | 1 | 1–2 | 20–25 |
| Thanh Thông | 1 | 3–4 | 30–35 |
| Tử Lưu | 1 | 5–6 | 40–45 |
| Đại Uyển Thanh Mã | 1 | 7–8 | 50–55 |
| Hoa Lưu | 1 | 9–10 | 60–72 |
| Liệt Bạch Mã | 2 | 1–2 | 20–25 |
| Bạch Mã | 2 | 3–4 | 30–35 |
| Ngọc Hoa Thông | 2 | 5–6 | 40–45 |
| Đại Uyển Bạch Mã | 2 | 7–8 | 50–55 |
| Túc Sương | 2 | 9–10 | 60–72 |
| Liệt Hắc Mã | 3 | 1–2 | 20–25 |
| Hắc Mã | 3 | 3–4 | 30–35 |
| Hắc Kỳ | 3 | 5–6 | 40–45 |
| Đại Uyển Hắc Mã | 3 | 7–8 | 50–55 |
| Ô Chùy | 3 | 9–10 | 60–72 |
| Liệt Hồng Mã | 4 | 1–2 | 20–25 |
| Hồng Mã | 4 | 3–4 | 30–35 |
| Hồng Ly | 4 | 5–6 | 40–45 |
| Đại Uyển Hãn Huyết Mã | 4 | 7–8 | 50–55 |
| Xích Ký | 4 | 9–10 | 60–72 |
| Ô Vân Đạp Tuyết | 5 | 1–6 | 80 |
| Xích Thố | 5 | 2–7 | 80 |
| Tuyệt ảnh | 5 | 3–8 | 80 |
| Đích Lô | 5 | 4–9 | 80 |
| Chiếu Dạ Ngọc Sư Tử | 5 | 5–10 | 80 |
| Bôn Tiêu | 6 | 1–10 | 120 |
| Phiên Vũ | 7, 30 | 1–10 | 150 |
| Phi Vân | 8 | 1–10 | 100 |
| Xích Long Câu | 9, 31 | 1–10 | 130 |
| Tuyệt Địa | 10 | 1–10 | 150 |
| Du Huy | 11 | 1–10 | 130 |
| Đằng Vụ | 12 | 1–10 | 150 |
| Siêu Quang | 13, 32 | 1–10 | 150 |
| Kim Tinh Hổ Vương | 14 | 1–10 | 150 |
| Hỏa Tinh Kim Hổ Vương | 15 | 1–10 | 150 |
| Kim Tinh Bạch Hổ Vương | 16 | 1–10 | 150 |
| Long Tinh Hắc Hổ Vương | 17 | 1–10 | 180 |
| Hãn Huyết Long Câu | 18 | 1–10 | 150 |
| Phong Vân Bạch Mã | 19 | 1–10 | 150 |
| Phong Vân Chiến Mã | 20 | 1–10 | 150 |
| Phong Vân Thần Mã | 21 | 1–10 | 150 |
| Sư tử | 22 | 1–10 | 150 |
| Lạc đà | 23 | 1–10 | 150 |
| Dương Đà | 24 | 1–10 | 150 |
| Hươu đốm | 25 | 1–10 | 150 |
| Dương Sa | 26 | 1–10 | 150–undefined |
| Ngự Phong | 27 | 1–10 | 150 |
| Truy điện | 28 | 1–10 | 150 |
| Lưu Tinh | 29 | 1–10 | 150 |

Cửa hàng hiện chỉ bán mã loại 0 với 10 bậc: Liệt Hoàng Mã, Hoàng Mã, Hoàng Phiêu, Đại Uyển Hoàng Mã, Phi Hoàng. Giá mua theo bậc: 5.000, 5.000, 10.000, 10.000, 20.000, 20.000, 50.000, 50.000, 100.000, 100.000 lượng.

Dữ liệu còn có yêu cầu chuyển sinh ở một số thú cưỡi; bảng trên chỉ ghi yêu cầu cấp. Có dữ liệu vật phẩm không đồng nghĩa đã có cách mua hoặc nhận mọi loại trong game. Phần vẽ cưỡi ngựa trên map hiện dùng chung một bộ ảnh ngựa tám hướng, chưa phân biệt hình dáng theo từng loại.
