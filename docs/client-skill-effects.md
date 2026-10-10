# Hiệu ứng kỹ năng client — v90

Nguồn: `Client_VLTK_SHXT/settings/missles.txt`, `skills.txt` và sprite trong PAK theo thứ tự `package.ini`. `KMissleRes.cpp` dùng `IMAGE_RENDER_STYLE_ALPHA_NOT_BE_LIT` với alpha 255: H5 sử dụng màu/alpha gốc qua `source-over`, không làm trắng màu bằng `screen`.

- Chuyển đủ 202 lớp bay/va chạm/kết thúc/xuất chiêu, không thiếu nguồn.
- Dùng chung sprite trùng: 127 atlas, so với 202 ảnh trước.
- Cắt vùng trống, giữ giới hạn số khung hình H5; không nhân thêm hiệu ứng.
- WebP lossless, kiểm tra toàn bộ pixel RGBA sau mã hóa; không sửa màu hoặc alpha.
- Tọa độ neo theo header SPR; thời gian missile theo AnimFileInfo (18 tick/giây), bù số khung được lấy mẫu.
- Chỉ tải khi `drawFxSprite` dùng tới. Không đưa atlas vào danh sách precache.
- Bộ cũ 13,59 MiB, bộ mới 17,45 MiB. Tổng diện tích ảnh sau giải mã giảm từ 169.701.693 xuống 93.378.268 pixel (khoảng 45%). Đây là số liệu tài nguyên, không phải đo FPS trên thiết bị thực tế.
- Giữ `FX_MAX`, chế độ giảm hiệu ứng và giới hạn hiệu ứng dây chuyền đang có.
- Không khôi phục lớp nứt đất đen tự vẽ của H5.

Tái tạo: `node tools/import-client-skill-effects.mjs`, sau đó chạy `tools/compress-client-skill-effects.py` bằng Python có Pillow/WebP. Tool giữ nguyên bản đồ skill/missile của H5. Các sprite cũ không còn được tham chiếu được bỏ khỏi source.

`docs/client-skill-effects.json` ghi đường dẫn nguồn, PAK, hash, khung hình và dung lượng cho từng lớp. File báo cáo và công cụ không được tải xuống trình duyệt người chơi.
