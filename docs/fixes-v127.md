# v127 — chat Admin đỏ cả dòng

Tô đỏ cả tên và nội dung tin nhắn đã được server xác thực isAdmin. Làm mới cache phiên chat để nhận vai trò danh đúng khi cập nhật. API production vẫn trả message thiếu isAdmin sau v126 do phòng chat đang dùng phiên bản cũ; chuyển sang phòng v2 và nhập 50 tin gần nhất từ phòng cũ một lần. Giữ lịch sử hiển thị, không đổi dữ liệu người chơi; các phiên token cũ kết nối lại tự động. Chỉ tin mới được phiên xác thực đánh dấu đỏ, không gán quyền cho lịch sử chỉ dựa vào tên Admin.
