# Tài khoản và đồng bộ đa thiết bị — đề xuất

Ngày khảo sát: 08/10/2026. Bản thiết kế dùng cho triển khai; xem `cloud-accounts-operations.md` để vận hành và quay lại. Yêu cầu cuối cùng: tên/mật khẩu tối thiểu 4 ký tự, không có khôi phục tài khoản.

## Hiện trạng đã xác minh

- `js/save.js`: ba ô nhân vật lưu localStorage, file jxsave là phương thức chuyển dữ liệu thủ công.
- `js/stash.js`: kho chung lưu riêng tại `jxidle_stash`; chỉ lưu S sẽ bỏ sót kho.
- `js/online.js` và `worker/src/account.js`: tài khoản PvP dùng bearer token, chỉ Công Thành Chiến, đăng ký trước cấp 40; lưu snapshot mỗi 5 phút.
- `/api/me` chỉ trả thông tin tóm tắt, không trả snapshot. Chưa có API đăng nhập tên/mật khẩu hay giao diện tải tiến trình về.
- `/api/sync` ghi snapshot mới mà không kiểm tra phiên bản máy gửi. Chưa phù hợp để hai máy đồng bộ cùng tài khoản.
- D1 đang dùng: `jx-idle-final-db`. Có thể bổ sung bảng, không cần mua tên miền hay tạo máy chủ riêng.

## Trải nghiệm đề xuất

1. Nút Tài khoản ở màn chọn nhân vật và trong Hệ thống. Đăng ký tên đăng nhập/mật khẩu; tên nhân vật độc lập với tên đăng nhập.
2. Đăng ký lần đầu: xem ba ô hiện tại và kho chung, chọn đưa tiến trình đang có lên tài khoản. Nhân vật mọi chế độ và cấp độ đều được lưu.
3. Máy khác: đăng nhập, xem danh sách nhân vật lưu trên tài khoản, chọn Chơi tiếp. Nếu máy đang có nhân vật khách, giữ bản sao cục bộ và cho chọn rõ trước khi thay thế.
4. Khi chơi: lưu máy trước, gửi lên tài khoản khi dữ liệu đổi, khoảng 60 giây; nút Lưu ngay và trạng thái Đã lưu / Chờ đồng bộ / Mất mạng / Có phiên mới.
5. Trước khi chuyển máy: Lưu ngay và xác nhận thành công. Gửi khi ẩn tab là bổ sung, không phải bảo đảm vì iOS có thể dừng trang ngay.
6. Đăng xuất ngừng đồng bộ, xóa phiên đăng nhập. Dữ liệu khách và dữ liệu từng tài khoản phải được tách để tránh ghi nhầm.
7. Mất mạng vẫn chơi trên máy hiện tại. Khi có mạng, chỉ gửi nếu phiên bản máy chủ còn khớp; nếu máy khác đã chơi thì cho chọn bản để tiếp tục, không tự gộp đồ/EXP.

## Dữ liệu và kiến trúc

- Thêm bảng định danh tài khoản, phiên đăng nhập, gói lưu và bản lưu trước; giữ nguyên bảng PvP hiện có. Không biến token PvP thành mật khẩu.
- Gói lưu gồm schema version, ba ô nhân vật, kho chung, phiên bản tăng dần và thời điểm lưu do máy chủ cấp. Cập nhật cả gói nguyên tử để giao dịch chuyển đồ giữa kho và nhân vật không bị lưu lệch.
- Không gửi toàn bộ localStorage: loại token PvP, token chat, bí mật đăng nhập, trạng thái sandbox/admin và bản nháp góp ý. Cài đặt âm thanh/kích thước giao diện nên giữ riêng từng thiết bị.
- Lưu có điều kiện theo revision: chỉ chấp nhận khi revision gửi lên bằng revision hiện tại; cập nhật và kiểm tra phải nguyên tử trong D1. Không dùng đồng hồ thiết bị hay cấp độ cao nhất để quyết định bản mới.
- Mỗi tài khoản có một phiên được phép ghi. Máy mới nhận quyền chơi sau thao tác rõ ràng; máy cũ không tiếp tục tự tải lên. Có thời hạn và cơ chế nhận lại quyền khi mất kết nối.
- Xử lý xung đột ngoại tuyến: giữ cả bản cục bộ và bản máy chủ để người dùng xem, chọn; không cộng dồn tiền/đồ từ hai bản.
- Tiến trình khách cấp cao được phép sao lưu; không tự cấp tư cách PvP hay giờ chơi đo được. PvP vẫn kiểm định theo hệ thống cũ. Khi tải xuống cần liên kết đúng nhân vật PvP và xác thực riêng, không nhét token PvP vào snapshot.
- Nhiệm vụ offline chỉ được tính một lần trên tiến trình được chọn; kiểm tra mốc thời gian ở cả chuyển máy và khôi phục.

## Đăng nhập

- Mật khẩu được băm chậm với salt riêng bằng thuật toán/libraries phù hợp Workers, cần đo thời gian và giới hạn CPU trước khi chốt tham số. Không lưu mật khẩu thô hoặc dùng SHA-256 đơn thuần cho mật khẩu.
- Cookie phiên HttpOnly, Secure, SameSite và bảo vệ CSRF/Origin cho thao tác ghi. Có hết hạn, đăng xuất, thu hồi phiên; không lưu mật khẩu trên trình duyệt.
- Giới hạn đăng ký/đăng nhập/đồng bộ; tùy cấu hình Turnstile. Ràng buộc dung lượng request, cấu trúc save, số ô và quyền sở hữu.
- Theo yêu cầu cập nhật của người vận hành: không triển khai khôi phục tài khoản, mã khôi phục hoặc đặt lại mật khẩu. Người chơi bắt buộc tự ghi nhớ tên đăng nhập và mật khẩu từ lúc tạo.

## Thứ tự thực hiện và kiểm tra

1. API tài khoản, phiên và lưu/tải có revision; bổ sung schema không thay đổi dữ liệu PvP cũ.
2. UI đăng ký/đăng nhập ở màn chọn nhân vật, xem nhân vật trên cloud, đưa dữ liệu khách lên lần đầu.
3. Đồng bộ nền, quyền ghi giữa máy, xử lý offline/xung đột, kho chung và bản lưu trước.
4. Đăng xuất, hết hạn phiên và trạng thái lỗi rõ ràng.

Kiểm tra bắt buộc: đăng ký A rồi chơi tiếp B; mọi chế độ/cấp độ; đủ ba ô và kho; hai máy ghi đồng thời; máy cũ tải lên sau khi B chơi; đứt mạng khi gửi; iOS ẩn/đóng tab; zero/invalid save; phiên hết hạn; đăng xuất rồi đổi tài khoản; không nhân đôi phần thưởng offline/đồ kho; giữ nguyên PvP và chat; không mất dữ liệu khách khi đăng nhập.

Giới hạn dung lượng và nhịp đồng bộ phải thử trên save thực tế trước khi phát hành. Tự lưu 60 giây với 100 người chơi liên tục tương đương khoảng 144.000 lượt tải lên/ngày, chưa gồm đăng nhập/heartbeat; cần kiểm tra quota D1/Workers của tài khoản Cloudflare. Không hứa đồng bộ tức thời hoặc hoàn toàn miễn phí ở mọi quy mô.
