# Sửa bán/vứt, đồng bộ và Đường Môn v107

- Tái hiện trên kiểm thử lỗi Không sở hữu vật phẩm: trước khi chạy lệnh bán/vứt, settle thời gian cũ có thể tự mặc hoặc tự bán chính món vừa chọn. Bán/vứt món trong túi của slot đang chơi được kiểm tra và xử lý trước settle, cùng một revision/requestId/transaction; từ chối món khóa và UID không thuộc túi, không gửi lại giao dịch.
- Bán hàng loạt hiện kết quả server thực tế thay vì báo 0 món trước khi phản hồi. Mở khóa được cả đồ bộ để người chơi chủ động bán từng món; tự bán vẫn bảo vệ đồ quý và đồ nhặt tay.
- Bật/tắt tự bán ngay trong Bộ lọc nhặt / bán. Bán thừa chỉ bán đồ không khớp lọc; có hướng dẫn đồ được bảo vệ.
- Checkpoint bị lệch ở thao tác hoặc trạng thái đã paused có thể tự nối lại cùng tài khoản/nhân vật, qua claim không takeover. Không replay mua/bán; khác thiết bị hoặc đăng nhập không hợp lệ vẫn yêu cầu chọn tiến trình. Không thay đổi kiểm tra revision hoặc quyền sở hữu.
- Đường Môn: dùng CharAnimId từ skills.txt làm nguồn động tác nhân vật, không dùng CharAnimId của hiệu ứng. 45/58/302 là Magic (11), trên ngựa dùng RideMagic. Các chiêu HorseLimit=1 vẫn xuống ngựa theo client.
- RideMagic dùng lại sprite HM01 đã nhập từ npcres man/woman; thời lượng lấy per/interval bộ cưỡi. Không thêm ảnh, không tăng tải sprite toàn bộ game.

Kiểm tra: test tái hiện bán thất bại trước sửa, bán/vứt khi auto mặc/bán đang chạy, khóa đồ, replay, hồi phục checkpoint không replay/không takeover; kiểm tra nguồn sprite, động tác ba chiêu Đường Môn cả hai giới tính. Bộ kiểm thử worker và giao diện khách cục bộ, console không lỗi. Chưa thao tác trên đồ/tài khoản người chơi thật.
