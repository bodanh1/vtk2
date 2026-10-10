# Kinh tế server v98

Tài khoản cloud dùng snapshot D1 làm nguồn dữ liệu. Browser gửi cấu hình điều khiển và hành động; tiền, vật phẩm, level, điểm và stash gửi thay thế không được chấp nhận. Nhân vật mới bắt đầu bằng bộ starter do server tạo. Dữ liệu của người chơi cũ được giữ làm baseline một lần; cơ chế này không kết luận tài sản cũ có hợp lệ hay không.

## Xử lý và tải

- Đồng bộ thường mỗi 30 giây; không có request cho mỗi đòn đánh/quái chết. Trình duyệt giữ map, sprites và hoạt ảnh.
- Server dùng catalogue/giá và các hàm game hiện có cho shop, kho, ghép/nâng đồ, quà, mặt nạ, chuyển sinh và hoạt động. Admin vẫn dùng endpoint riêng đã kiểm tra tài khoản danh.
- Farming dùng mô hình DPS/HP theo stage, loại quái và thời gian checkpoint của server. Tốc độ chỉ 1 / 1.5 / 2. Offline tối đa 8 giờ/lần và 12 giờ/ngày (UTC+7), hiệu quả giảm sau 2 giờ. Drop được lấy mẫu theo batch có giới hạn.
- Hoạt động dùng ngân sách sát thương theo thời gian server và trạng thái tầng/đợt của server; không nhận số quái chết hay phần thưởng do browser khai báo. Đây là mô hình idle theo đợt, chưa tái hiện đầy đủ vị trí, né đòn, tử vong, bình thuốc và tiêu hao nội lực của combat browser. Tốc độ tăng trưởng/drop thực tế cần theo dõi sau rollout; không cam kết cân bằng hoặc FPS giống phiên bản cũ.
- Request ID, lease thiết bị và revision được kiểm tra trong transaction D1: retry/cạnh tranh không cấp đồ hai lần. Ledger chỉ lưu chênh lệch tiền, giữ 30 ngày; không nhân bản snapshot lớn cho từng giao dịch.
- Chợ chỉ giao dịch giữa các tài khoản cùng cơ chế kinh tế. Trong quá trình chuyển đổi, người bán cũ phải đăng nhập lại để migrate; listing của họ vẫn được giữ. Trước giao dịch, server kết toán thời gian bằng trang bị đang có.
- Người chơi khách vẫn lưu tại máy. Không nhập tài sản khách/file vào tài khoản sử dụng kinh tế server.

Kiểm tra: test giả tiền/inventory, starter mới, giá shop, phát lại/race, kho, số âm, offline cap, chợ, ghép Bạch Kim; Chrome cục bộ chạy Worker API với SQLite trong bộ nhớ. Benchmark 50 đợt cấp 100: median khoảng 5.6ms, p95 khoảng 10ms trên máy phát triển; không tương đương CPU/quota Cloudflare. Gói Worker raw 5.88MB, không gửi thêm vào download game của browser.

## Backup và restore

Backup mã nguồn **trước mọi sửa đổi**: tag `backup/pre-server-economy-2026-10-10`, commit `0d04d41c44982f1f37daec869a86c240f3e8b220`. Git bundle chứa toàn bộ lịch sử nằm ngoài repo tại `../backups/pre-server-economy-2026-10-10/vtk2-v97.bundle`; đã kiểm tra bằng `git bundle verify`.

Backup dữ liệu D1 được đóng băng một lần khi schema v98 khởi tạo, trước migrate/ghi dữ liệu kinh tế mới. Đây là thời điểm triển khai, không phải bản export D1 tại thời điểm tạo tag. `economy_backups` giữ snapshot tài khoản/bản trước; `economy_market_backup` giữ escrow chợ; `economy_backup_marks` đánh dấu lần đóng băng. Các tài khoản phát sinh sau đó được backup trước lần migrate riêng. Không có mật khẩu/token trong export backup game.

Admin đăng nhập danh có thể đọc `/api/cloud/economy/backup?page=0`, tiếp tục tăng page đến rows rỗng; escrow toàn cục ở `/api/cloud/economy/backup?market=1&page=0`. Endpoint chỉ đọc, không có nút restore tự động.

Nếu muốn rollback:

1. Tạm dừng ghi API/tài khoản và xuất D1 hiện tại để giữ dữ liệu phát sinh sau rollout. Chỉ tắt `SERVER_ECONOMY_ENABLED` không rollback tài khoản đã migrate.
2. Tạo một commit khôi phục các file tracked từ tag backup trên main và push để deploy v97; không force-push lịch sử. Có thể dùng Git bundle để dựng checkout độc lập trước khi thực hiện.
3. Khi đã dừng ghi, khôi phục snapshot/revision của `cloud_saves` từ `economy_backups`, bỏ lease cũ; khôi phục toàn bộ `market_listings` từ JSON trong `economy_market_backup`. Xóa các request/removed-marker chợ phát sinh sau mốc backup để không chặn đồ đã phục hồi. Không thay đổi cloud_accounts/cloud_sessions hay thông tin đăng nhập. Phải làm cùng một transaction và kiểm tra số dòng trước khi mở lại game.
4. Việc rollback dữ liệu sẽ bỏ tiến trình/giao dịch mới sau mốc backup. Chỉ thực hiện theo yêu cầu restore rõ ràng của chủ server; tài liệu này không tự chạy thao tác đó.

## Bạch Kim

Công thức hiện tại trong `rdata.js` là công thức cộng đồng: hai bản của cùng template Hoàng Kim, có ánh xạ Bạch Kim, chưa mặc. Không có bằng chứng công thức này lấy trực tiếp từ client. Giữ nguyên giá và tỉ lệ 25%. Đồ cũ thiếu refId được nhận diện bằng metadata legacy duy nhất; không đoán ánh xạ từ tên giống nhau. Giao diện hiển thị số Hoàng Kim, số có mẫu Bạch Kim, số loại đủ cặp và số đang mặc; chọn khác mẫu có giải thích ngay. Nhiều món khác nhau cùng môn phái vẫn không được coi là một cặp.
