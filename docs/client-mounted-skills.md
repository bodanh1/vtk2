# Quy định kỹ năng và thú cưỡi

Nguồn: skills.txt (HorseLimit, EqtLimit) và KSkills.cpp:178–239. HorseLimit 0: cả hai trạng thái; 1: chỉ đi bộ; 2: chỉ cưỡi. EqtLimit -2: không hạn chế; -1: tay không; 0–99: mã vũ khí cận chiến; 100–199: mã ám khí + 100.

H5 kiểm tra theo kỹ năng cụ thể, không cấm toàn bộ phái. Chiêu yêu cầu đi bộ tự xuống ngựa trước khi đánh; chiêu yêu cầu cưỡi chỉ đánh khi đã lên ngựa; sai vũ khí không trừ mana/không gây sát thương. Chỉ số chọn chiêu và luân phiên loại các chiêu không dùng được với vũ khí hiện tại.

| Phái | Kỹ năng | Mã | Trạng thái | Vũ khí |
| --- | --- | --- | --- | --- |
| Thiếu Lâm phái | Kim Cang Phục Ma | 10 | Đi bộ | -2 |
| Thiếu Lâm phái | Hàng Long Bất Vũ | 14 | Cả hai | -1 |
| Thiếu Lâm phái | Sư Tử Hống | 20 | Cả hai | -2 |
| Thiếu Lâm phái | Hoành Tảo Lục Hợp | 11 | Đi bộ | 2 |
| Thiếu Lâm phái | Ma Ha Vô Lượng | 19 | Cả hai | 1 |
| Thiếu Lâm phái | Long Trảo Hổ Trảo | 271 | Đi bộ | -1 |
| Thiếu Lâm phái | Đạt Ma Độ Giang | 318 | Đi bộ | -1 |
| Thiếu Lâm phái | Hoành Tảo Thiên Quân | 319 | Đi bộ | 2 |
| Thiếu Lâm phái | Vô Tướng Trảm | 321 | Cả hai | 1 |
| Thiên Vương Bang | Trảm Long quyết | 29 | Đi bộ | 4 |
| Thiên Vương Bang | Hồi Phong Lạc Nhạn | 30 | Đi bộ | 3 |
| Thiên Vương Bang | Kinh Lôi Trảm | 34 | Cả hai | 1 |
| Thiên Vương Bang | Hàng Vân Quyết | 31 | Đi bộ | 4 |
| Thiên Vương Bang | Dương Quan Tam Điệp | 35 | Đi bộ | 3 |
| Thiên Vương Bang | Bát Phong Trảm | 37 | Cả hai | 1 |
| Thiên Vương Bang | Đoạn Hồn Thích | 40 | Cả hai | -2 |
| Thiên Vương Bang | Vô Tâm Trảm | 32 | Cả hai | 1 |
| Thiên Vương Bang | Huyết Chiến Bát Phương | 41 | Đi bộ | 3 |
| Thiên Vương Bang | Thừa Long Quyết | 324 | Đi bộ | 4 |
| Thiên Vương Bang | Phá Thiên Trảm | 322 | Cả hai | 1 |
| Thiên Vương Bang | Truy Tinh Trục Nguyệt | 323 | Đi bộ | 3 |
| Thiên Vương Bang | Truy Phong Quyết | 325 | Đi bộ | 4 |
| Đường Môn | Phích Lịch đơn | 45 | Cả hai | -2 |
| Đường Môn | Địa Diệm Hỏa | 347 | Đi bộ | -2 |
| Đường Môn | Độc Thích Cốt | 303 | Đi bộ | -2 |
| Đường Môn | Đoạt Hồn Tiêu | 47 | Đi bộ | 100 |
| Đường Môn | Truy Tâm Tiễn | 50 | Đi bộ | 101 |
| Đường Môn | Mạn Thiên Hoa Vũ | 54 | Đi bộ | 102 |
| Đường Môn | Xuyên Tâm Thích | 343 | Đi bộ | -2 |
| Đường Môn | Hàn Băng Thích | 345 | Đi bộ | -2 |
| Đường Môn | Lôi Kích Thuật | 349 | Đi bộ | -2 |
| Đường Môn | Thiên La Địa Võng | 58 | Cả hai | 102 |
| Đường Môn | Tiểu Lý Phi Đao | 249 | Đi bộ | 101 |
| Đường Môn | Tán Hoa Tiêu | 341 | Đi bộ | 100 |
| Đường Môn | Bạo Vũ Lê Hoa | 302 | Cả hai | 102 |
| Đường Môn | Nhiếp Hồn Nguyệt ảnh | 339 | Đi bộ | 101 |
| Đường Môn | Cửu Cung Phi Tinh | 342 | Đi bộ | 100 |
| Đường Môn | Loạn Hoàn Kích | 351 | Đi bộ | -2 |
| Ngũ Độc Giáo | Độc Sa chưởng | 63 | Cả hai | -2 |
| Ngũ Độc Giáo | Huyết Đao Độc Sát | 65 | Cả hai | 1 |
| Ngũ Độc Giáo | Cửu Thiên Cuồng Lôi | 67 | Cả hai | -2 |
| Ngũ Độc Giáo | Xích Diệm Thực Thiên | 70 | Cả hai | -2 |
| Ngũ Độc Giáo | Băng Lam Huyền Tinh | 64 | Cả hai | -2 |
| Ngũ Độc Giáo | U Minh Khô Lâu | 68 | Đi bộ | -2 |
| Ngũ Độc Giáo | Vô Hình Độc | 69 | Cả hai | -2 |
| Ngũ Độc Giáo | Bách Độc Xuyên Tâm | 384 | Cả hai | -2 |
| Ngũ Độc Giáo | Vạn Độc Thực Tâm | 73 | Cả hai | -2 |
| Ngũ Độc Giáo | Xuyên Y Phá Giáp | 356 | Cả hai | -2 |
| Ngũ Độc Giáo | Xuyên Tâm Độc Thích | 72 | Cả hai | -2 |
| Ngũ Độc Giáo | Thiên Cương Địa Sát | 71 | Đi bộ | -2 |
| Ngũ Độc Giáo | Chu Cáp Thanh Minh | 74 | Cả hai | 1 |
| Ngũ Độc Giáo | Âm Phong Thực Cốt | 353 | Đi bộ | -2 |
| Ngũ Độc Giáo | Huyền Âm Trảm | 355 | Cả hai | 1 |
| Ngũ Độc Giáo | Đoạn Cân Hủ Cốt | 390 | Cả hai | -2 |
| Nga My phái | Phiêu Tuyết Xuyên Vân | 80 | Cả hai | -2 |
| Nga My phái | Nhất Diệp Tri Thu | 85 | Đi bộ | 0 |
| Nga My phái | Tứ Tượng Đồng Quy | 82 | Đi bộ | -2 |
| Nga My phái | Thôi Song Vọng Nguyệt | 385 | Đi bộ | 0 |
| Nga My phái | Bất Diệt Bất Tuyệt | 88 | Đi bộ | 0 |
| Nga My phái | Phật Quang Phổ Chiếu | 91 | Đi bộ | -2 |
| Nga My phái | Tam Nga Tề Tuyết | 328 | Đi bộ | 0 |
| Nga My phái | Phong Sương Toái ảnh | 380 | Đi bộ | -2 |
| Thúy Yên môn | Phong Hoa Tuyết Nguyệt | 99 | Cả hai | 1 |
| Thúy Yên môn | Phong Quyển Tàn Tuyết | 102 | Đi bộ | -2 |
| Thúy Yên môn | Vũ Đả Lê Hoa | 105 | Đi bộ | 1 |
| Thúy Yên môn | Phù Vân Tán Tuyết | 113 | Đi bộ | -2 |
| Thúy Yên môn | Mục Dã Lưu Tinh | 108 | Đi bộ | 1 |
| Thúy Yên môn | Bích Hải Triều Sinh | 111 | Đi bộ | -2 |
| Thúy Yên môn | Băng Tung Vô ảnh | 336 | Đi bộ | 1 |
| Thúy Yên môn | Băng Tâm Tiên Tử | 337 | Đi bộ | -2 |
| Cái Bang | Diên Môn Thác Bát | 119 | Cả hai | 2 |
| Cái Bang | Kiến Nhân Thần Thủ | 122 | Đi bộ | -2 |
| Cái Bang | Bổng Đả ác Cẩu | 125 | Đi bộ | 2 |
| Cái Bang | Kháng Long Hữu Hối | 128 | Đi bộ | -2 |
| Cái Bang | Phi Long Tại Thiên | 357 | Đi bộ | -2 |
| Cái Bang | Thiên Hạ Vô Cẩu | 359 | Đi bộ | 2 |
| Thiên Nhẫn Giáo | Tàn Dương Như Huyết | 135 | Cả hai | 3 |
| Thiên Nhẫn Giáo | Hỏa Liên Phần Hoa | 136 | Cả hai | -2 |
| Thiên Nhẫn Giáo | Đơn Chỉ Liệt Diệm | 145 | Đi bộ | -2 |
| Thiên Nhẫn Giáo | Ảo ảnh Phi Hồ | 137 | Cả hai | -2 |
| Thiên Nhẫn Giáo | Thôi sơn Điền Hải | 138 | Đi bộ | -2 |
| Thiên Nhẫn Giáo | Phi Hồng Vô Tích | 140 | Cả hai | -2 |
| Thiên Nhẫn Giáo | Liệt Hỏa Tình Thiên | 141 | Cả hai | 3 |
| Thiên Nhẫn Giáo | Bi Tô Thanh Phong | 364 | Cả hai | -2 |
| Thiên Nhẫn Giáo | Lịch Ma Đoạt Hồn | 143 | Cả hai | -2 |
| Thiên Nhẫn Giáo | Thâu Thiên Hoán Nhật | 142 | Cả hai | 3 |
| Thiên Nhẫn Giáo | Ma Diệm Thất Sát | 148 | Đi bộ | -2 |
| Thiên Nhẫn Giáo | Vân Long Kích | 361 | Cả hai | 3 |
| Thiên Nhẫn Giáo | Thiên Ngoại Lưu Tinh | 362 | Đi bộ | -2 |
| Thiên Nhẫn Giáo | Nhiếp Hồn Loạn Tâm | 391 | Cả hai | -2 |
| Võ Đang phái | Nộ Lôi Chỉ | 153 | Cả hai | -2 |
| Võ Đang phái | Thương Hải Minh Nguyệt | 155 | Đi bộ | 0 |
| Võ Đang phái | Kiếm Phi Kinh Thiên | 158 | Đi bộ | 0 |
| Võ Đang phái | Bác Cấp Nhi Phục | 164 | Đi bộ | -2 |
| Võ Đang phái | Vô Ngã Vô Kiếm | 165 | Đi bộ | -2 |
| Võ Đang phái | Tam Hoàn Thao Nguyệt | 267 | Đi bộ | 0 |
| Võ Đang phái | Thiên Địa Vô Cực | 365 | Đi bộ | -2 |
| Võ Đang phái | Nhân Kiếm Hợp Nhất | 368 | Đi bộ | 0 |
| Côn Lôn phái | Hô Phong Pháp | 169 | Cả hai | 1 |
| Côn Lôn phái | Cuồng Lôi Chấn Địa | 179 | Đi bộ | -2 |
| Côn Lôn phái | Thúc Phược Chú | 392 | Cả hai | -2 |
| Côn Lôn phái | Ki Bán phù | 174 | Cả hai | -2 |
| Côn Lôn phái | Thiên Tế Tấn Lôi | 172 | Đi bộ | 0 |
| Côn Lôn phái | Bắc Minh Đáo Hải | 393 | Cả hai | -2 |
| Côn Lôn phái | Khi Hàn Ngạo Tuyết | 175 | Cả hai | -2 |
| Côn Lôn phái | Khí Tâm phù | 181 | Cả hai | -2 |
| Côn Lôn phái | Mê Tung ảo ảnh | 90 | Cả hai | -2 |
| Côn Lôn phái | Cuồng Phong Sậu Điện | 176 | Đi bộ | 1 |
| Côn Lôn phái | Ngũ Lôi Chánh Pháp | 182 | Đi bộ | -2 |
| Côn Lôn phái | Ngạo Tuyết Tiêu Phong | 372 | Đi bộ | 1 |
| Côn Lôn phái | Lôi động Cửu Thiên | 375 | Đi bộ | -2 |
| Côn Lôn phái | Túy Tiên Tá Cốt | 394 | Cả hai | -2 |
