# Vận hành tài khoản và lưu cloud

## Mốc quay lại

Bản ổn định trước thay đổi: tag `stable-before-cloud-accounts-2026-10-08`, commit `1e41d69`.

Hệ thống mới bổ sung `cloud_accounts`, `cloud_sessions`, `cloud_saves`, `cloud_pvp_links`; không xóa hay thay cột tài khoản/nhân vật PvP cũ. Schema được tạo tự động khi API nhận yêu cầu đầu tiên. `cloud_saves` giữ bản hiện tại và bản trước cùng revision; đây là bảo vệ theo tiến trình, không thay thế sao lưu toàn bộ D1.

Phiên Codex không có thông tin đăng nhập Cloudflare nên chưa xuất được bản sao D1 hoặc xác nhận cấu hình/quota thật. Chủ tài khoản có thể sao lưu qua Dashboard D1 hoặc lệnh đã đăng nhập Wrangler:

```sh
npx wrangler d1 export jx-idle-final-db --remote --output backup-before-cloud.sql
```

File sao lưu chứa dữ liệu tài khoản riêng tư; không commit lên GitHub. Nên giữ bản xuất riêng và sử dụng D1 Time Travel nếu gói hiện tại hỗ trợ.

## Bật/tắt

Tính năng mặc định bật trên cùng origin `game.vltk.workers.dev`; không cần secret mới. Nếu đã bật Turnstile cho đăng ký PvP, đăng ký cloud cũng dùng cấu hình đó.

Để dừng khẩn cấp: đặt biến runtime `CLOUD_ACCOUNTS_ENABLED=0` trong Worker game, triển khai lại. API cloud trả thông báo tạm tắt, localStorage và file jxsave vẫn dùng được; đăng xuất vẫn được xử lý. Đặt `1` hoặc xóa biến để bật lại.

Cookie phiên: HttpOnly, Secure, SameSite=Strict, hết hạn sau 30 ngày, path `/api` để liên kết PvP. Mật khẩu dùng PBKDF2-SHA256 100.000 vòng, salt riêng; cần kiểm tra CPU/thời gian thực tế trên gói Workers đang dùng. Không có mã khôi phục, API đặt lại mật khẩu hoặc liên hệ email khôi phục, theo yêu cầu người vận hành.

## Người chơi

- Đăng nhập/đăng ký ở màn chọn nhân vật, menu ⋯ → Tài khoản hoặc Hệ thống → Tài khoản và lưu cloud.
- Khi đăng ký, người chơi xác nhận tự ghi nhớ tên đăng nhập và mật khẩu; không có chức năng khôi phục tài khoản hoặc đặt lại mật khẩu. Xem dữ liệu tại máy rồi chọn đưa lên tài khoản; không cần tạo lại nhân vật.
- Ba ô nhân vật và dữ liệu chung của cả ba chế độ được gửi cùng gói: kho, vật liệu, gia tộc/bang hội, bộ sưu tập. Thông tin âm thanh và UI giữ riêng ở từng máy. Token đăng nhập, token chat/PvP, bản nháp góp ý và sandbox không đưa vào snapshot.
- Trước khi chuyển máy, bấm Lưu ngay và đợi báo thành công. Trên máy khác đăng nhập rồi bấm Chơi tiếp ở ô muốn dùng.
- Chơi tiếp chuyển quyền ghi sang máy mới. Máy cũ được giữ bản tại máy nhưng dừng tải lên khi máy chủ phát hiện quyền đã đổi. Không tự gộp EXP/tiền/đồ giữa các máy.
- Bản guest và bản thuộc từng tài khoản được lưu riêng tại máy trước khi thay thế. Đăng xuất phục hồi khu vực guest; không xóa bản lưu riêng của tài khoản. Có nút chọn bản lưu riêng tại máy để đưa lên lại nếu cần.
- Khôi phục bản trước là thao tác rõ ràng; sau khi tải, lưu lại để tạo revision mới. Đồng bộ chỉ nhận khi revision và quyền thiết bị vẫn khớp.
- Mất mạng vẫn lưu máy. iOS có thể ngừng trang ngay khi đóng/ẩn, vì vậy gửi khi ẩn tab chỉ là bổ sung; không coi là bảo đảm.

Liên kết PvP xác minh bằng token đang có trên máy nguồn và lưu quan hệ với tài khoản PvP cũ. Thiết bị mới dùng phiên cloud để truy cập nhân vật đã liên kết; không chuyển token PvP trong snapshot và không cấp thêm giờ chơi đo được.

## Quay lại bản ổn định

1. Tắt cloud bằng biến runtime nếu API mới có vấn đề.
2. Khi vẫn truy cập được, yêu cầu người chơi Lưu ngay hoặc xuất jxsave cho tiến trình mới; giữ các bảng cloud và bản sao D1.
3. Có thể chọn deployment cũ trong Cloudflare hoặc dùng `git revert` đối với commit triển khai tính năng, rồi push main để Workers Builds triển khai lại. Tag ở trên xác định chính xác bản trước thay đổi; không force-push lịch sử main.
4. Không khôi phục database cũ đè lên database mới nếu chưa lưu riêng dữ liệu phát sinh. Quay lại code không cần xóa các bảng cloud.
5. LocalStorage vẫn dùng tên cũ cho các ô đang chơi, nên bản cũ tiếp tục đọc dữ liệu tại máy. Dữ liệu tài khoản trên server được giữ để khôi phục/bật lại sau.

## Giới hạn thực tế

Gói cloud tối đa 900 KB UTF-8; request tối đa giới hạn HTTP hiện có. Giữ một bản trước để giới hạn dung lượng. Tự đồng bộ mỗi 30 giây khi trang hiện, có heartbeat để giữ quyền chơi (lease 180 giây). Save bị giới hạn 180 lần/giờ/tài khoản; đăng ký/đăng nhập giới hạn theo IP. Cookie yêu cầu HTTPS thật hoặc localhost tin cậy; bản chạy file:// không dùng chức năng cloud cookie.

Với 100 người chơi liên tục, nhịp 30 giây có thể tạo khoảng 288.000 request/ngày chỉ riêng lưu/heartbeat. Kiểm tra quota và theo dõi Workers/D1 trước khi tăng lượng người chơi. Tính năng này sao lưu trạng thái client, không thay thế một máy chủ mô phỏng game/chống gian lận đầy đủ; PvP vẫn giữ cơ chế kiểm định riêng.

## Kiểm tra đã chuẩn bị

API: mật khẩu/salt/cookie, quyền sở hữu và origin, công tắc tắt, ba ô/mọi chế độ/kho, revision cạnh tranh, lease và chuyển máy, bản lưu trước, đăng xuất/hết hạn phiên, lọc bí mật và giới hạn dung lượng, liên kết PvP cũ. Trình duyệt: đăng ký và xác nhận ghi nhớ thông tin đăng nhập, đưa dữ liệu guest lên, máy B chơi tiếp, chặn máy A, mất mạng/lưu tại máy/nối lại, đăng xuất giữ bản lưu riêng. Kiểm tra mobile bằng viewport iPhone; môi trường chưa có WebKit/Safari thật.

Tên đăng nhập tối thiểu 4 ký tự (tối đa 24; chữ không dấu, số, _); mật khẩu tối thiểu 4 ký tự (tối đa 128). Không có khôi phục tài khoản hoặc đặt lại mật khẩu.
