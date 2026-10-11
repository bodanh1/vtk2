# Cải tiến treo máy v106 — 2026-10-11

Tham khảo luồng chơi đã khảo sát tại volamidle, triển khai bằng hệ thống và sprite sẵn có của vtk2.

- Mở rộng: Auto mục tiêu, Kho Rèn, Mã Trường, Boss tuần, Hiệu năng.
- Auto: luyện công, phó bản theo cấp/lượt, tự nộp/nhận Dã Tẩu, Tháp I. Rời hoạt động tắt mục tiêu. Phó bản hết lượt/thất bại quay về luyện công hoặc chuyển bản còn lượt.
- Dã Tẩu giới hạn 40 lượt/ngày; mỗi 20 nhiệm vụ thêm 5 Phúc Duyên. Giữ đồ khóa và nhặt tay. Không tự mua vật liệu nhiệm vụ.
- Kho Rèn 120 ô, tùy chọn đồ trắng/xanh theo cấp dòng thuộc tính; tự rèn dùng tối đa 6 phôi/lần, trả phôi chưa dùng. Rút thủ công đánh dấu giữ khỏi tự bán.
- Mã Trường 60 ô, sưu tập tính một lần theo tên/chỉ số. Thuần dưỡng 10 cấp, đổi ngựa giữ tối thiểu 80% cấp. Bonus sinh lực/EXP sưu tập giới hạn 5%, sinh lực thuần dưỡng giới hạn 2%.
- Boss tuần cấp 30, 3 lượt/tuần, 75 giây; nhận một rương theo hạng tốt nhất. Thưởng được xác nhận bằng thời gian và sức đánh trên server, không nhận sát thương do trình duyệt gửi.
- Chợ đen lọc loại đồ/phẩm chất/tiền, giá tăng giảm, đồ phù hợp và đủ tiền. Lọc trước đếm/phân trang, giữ cơ chế treo 3 ngày và hai loại tiền.
- Tối đa vẽ 30 FPS theo thời gian thực, giảm hiệu ứng; không tải sprite mới, không gửi yêu cầu theo từng đòn đánh. Dùng checkpoint hiện tại, không thêm ghi D1 theo frame.
- EXP đồng hành nhận đủ nhiều cấp trong một đợt xử lý server.

Kiểm tra: toàn bộ bộ kiểm thử worker; kiểm thử mới kho đầy/đồ khóa/nhặt tay, giới hạn boss, replay chuyển đồ, runtime auto và lọc chợ trước phân trang. Giao diện khách cục bộ mở đủ bảng, không có lỗi console. Chưa thực hiện kiểm thử tải nhiều người chơi hoặc Safari thiết bị thật.

Khôi phục mã trước bản này: tag backup/pre-idle-v106-2026-10-11 tại d2eed893. Tag khôi phục source, không đảo ngược giao dịch/dữ liệu người chơi.
