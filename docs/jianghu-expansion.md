# Hoạt động giang hồ H5 — v85

Tính năng được viết mới cho source H5, tham khảo giao diện công khai tại https://volam.vinarpg.com/. Không đưa mã nguồn của trang tham khảo vào dự án. Giữ bộ sprite, giới hạn cấp 180 và cơ chế đồ bộ của client/H5.

| Nhóm | Triển khai |
|---|---|
| Tháp II | Mở sau TS5, 2000 tầng, quái cấp 200–325, 1000 lượt/tuần, thất bại lùi 10 tầng. Thưởng lần đầu; cơ hội đồ bộ 2% mỗi 10 tầng từ tầng 50. Đồ giữ template client hiện tại, không tạo đồ cấp 200 giả. |
| Tâm pháp | Giữ ba tâm pháp hiện có, nhận ở TS1–TS5. Mở chuyển sinh tối đa 10. |
| Điểm nâng cao | TS6–TS10 mỗi lần thêm 1 điểm; tổng tối đa 5. Khai Sơn +2% sát thương/điểm, Hộ Tháp giảm 1% sát thương nhận/điểm, Hồi Khí thêm 2% hồi máu sau tầng/điểm. Chỉ trong Tháp II. |
| Biến thể | Luyện công: kỹ năng đạt 5 sao chọn Uy lực (+25% sát thương), Liên kích (+20% tốc độ), Lan rộng (tầm +25%, đạn thêm xuyên, bẫy rộng hơn). Một lựa chọn/kỹ năng/lượt, làm mới ở lượt sau. |
| Bảy phó bản | Dược Vương Cốc, Thiên Bảo Khố, Lâm An Hoàng Lăng, Phong Đô Quỷ Thành, Kiếm Các Thục Đạo, Mạc Cao Bí Cảnh, Hoa Sơn Luận Kiếm. Hoa Sơn mở ở cấp 180 để phù hợp trần H5. 2 lần hoàn thành/ngày/mỗi phó bản, 5–9 phòng, 120–330 giây. Hết giờ/rời/chết không mất lượt, không nhận thưởng. |
| Thưởng phó bản | Hạng S/A/B theo 50%/75%/100% thời hạn; Phúc Duyên, KNB, 10–30 phút Tiên Thảo Lộ, Huyền Tinh hoặc ngân lượng tùy chế độ. Đồ bộ 0,6% × hạng, ngựa 0,3% × hạng. |
| Phong Lăng Độ | Cấp 75, 180 giây, 3 lượt thưởng/tuần. S hạ trùm, A gây 50% máu, B 20%, C 5%; dưới 5% không mất lượt. 3–15 KNB, 10–50 Phúc Duyên. |
| Kho chung, rèn/khảm, bộ lọc | Tiếp tục sử dụng hệ thống sẵn có (`stash.js`, `forge.js`, `loot.js`, `inventory-menu.js`), không tạo hệ thống trùng. |
| Auto, chat, BXH, luyện công | Tiếp tục hệ thống sẵn có. |

Mở hoạt động mới ở **Phần thưởng → Tháp II / Phó bản / Phong Lăng Độ**. Biến thể xuất hiện khi chọn nâng cấp trong Luyện Công.

Dữ liệu dài hạn nằm trong `S.rw.jianghu`, được lưu cùng nhân vật/tài khoản. Hoạt động đang chạy nằm trong `R.tower`, dừng khi tải lại trang; không tiếp tục hoạt động hoặc trao thưởng khi offline. Quota phó bản đổi theo ngày; quota tháp/thuyền đổi theo tuần. Kỷ lục giữ lâu dài.

Không thêm sprite hoặc tải nền mới. Tối đa 6 quái mỗi phòng; dùng chung chiến đấu, bản đồ và hoạt ảnh H5. Thưởng hoạt động chỉ trả khi qua phòng cuối hoặc kết thúc thuyền; không có loot thường từ quái phó bản để ngăn lặp vào/rời farm miễn phí.

Kiểm tra: hoàn thành/timeout, quota ngày và tuần, rollover trong trận, khóa cấp/chuyển sinh, thưởng tầng một lần, lùi tầng, giới hạn điểm, tác dụng điểm riêng Tháp II, biến thể thực sự đổi sát thương/tốc độ/xuyên đạn và làm mới mỗi lượt.
