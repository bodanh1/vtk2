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

Cửa hàng hiện bán các mã loại 0–8, đến Phi Vân. Các bản ghi mới trùng tên, chỉ số và yêu cầu được gộp thành một lựa chọn. Giá mua các loại thêm bằng hai lần giá gốc, cùng quy tắc giá dòng Hoàng Mã. Dòng mã loại 0 với 10 bậc gồm: Liệt Hoàng Mã, Hoàng Mã, Hoàng Phiêu, Đại Uyển Hoàng Mã, Phi Hoàng. Giá mua theo bậc: 5.000, 5.000, 10.000, 10.000, 20.000, 20.000, 50.000, 50.000, 100.000, 100.000 lượng.

Dữ liệu còn có yêu cầu chuyển sinh ở một số thú cưỡi; bảng trên chỉ ghi yêu cầu cấp. Có dữ liệu vật phẩm không đồng nghĩa đã có cách mua hoặc nhận mọi loại trong game. Phần vẽ cưỡi ngựa dùng bộ `img/mount-horse-armored.png` khi đứng/đi chậm và bộ `img/mount-horse-gallop.png` khi chạy: tám hướng, tám khung chạy mỗi hướng (64 khung), một vòng khoảng 0,6 giây. Quần và ủng lấy trực tiếp từ phần thân sprite trang phục đang mặc, tách hai chân và mở đùi hai bên yên, co gối thành dáng ngồi theo hướng; thay áo cập nhật cả phần chân. Áo/mũ/mặt/vũ khí vẫn dùng sprite trang bị của nhân vật. Ngựa rộng 103px; màu lông chọn theo 11 icon ngựa trong shop. Khung ngựa chỉ giữ vùng ảnh liên thông của chính con ngựa để loại mảnh của ô bên cạnh. Texture màu dùng chung và giới hạn cache 192 khung.

Bản mới được dựng theo ảnh và video người dùng cung cấp, chưa phải bộ SPR gốc của game trong video. Chuyển động chân người hiện dùng tư thế ngồi riêng, không phải bộ quần/ủng gốc theo từng trang bị. Xem `docs/horse-riding-preview.gif` để xem thử bốn hướng chạy.

## Ngựa gốc từ client (09/10/2026)

Bổ sung 249 atlas PNG từ PAK của Client_VLTK_SHXT: ba lớp HorseBack/HorseMiddle/HorseFront, đứng (RideStand), đi (RideWalk), chạy (RideRun), tám hướng. Renderer dùng cùng đồng hồ hoạt ảnh cho các lớp, giữ màu gốc và ánh xạ từ item/horse.txt + horseres.txt. Dữ liệu nữ không tìm thấy trong các gói hiện có nên dùng sprite ngựa nam khi đủ lớp; nhân vật nữ vẫn dùng trang phục nữ. Một số mã thiếu lớp/hoạt ảnh tiếp tục dùng renderer dự phòng. Người cưỡi hiện giữ cách ghép trang phục của bản H5; chưa chuyển toàn bộ sprite Ride của quần áo/vũ khí.

Provenance (đường dẫn SPR, hash, PAK ưu tiên, kích thước và frame) nằm trong mount-client-manifest.json. Asset tải theo ngựa đang mặc, không precache toàn bộ bộ ngựa. Công cụ dùng package.ini để lấy thứ tự override, kiểm tra độ dài giải nén NRV2B và RLE/palette trước khi xuất ảnh. PNG được crop theo bounds chung mọi frame để giảm bộ nhớ texture, giữ cùng tọa độ gốc (160,220).

Tái tạo từ thư mục repository:

    node tools/import-client-mounts.mjs "đường dẫn tới Client_VLTK_SHXT"
    node tools/compact-client-mounts.mjs

Tham khảo cấu trúc PAK/SPR và NRV2B: https://github.com/Mignet/Jx/tree/master/Sources/Engine/Src . Không đưa EXE/DLL hoặc PAK gốc vào bản deploy. Công cụ import không tham gia build Cloudflare; asset và dữ liệu đã xuất được commit sẵn.

## Sửa mã ngựa và rig người cưỡi (09/10/2026)

Bản trước tra nhầm cột số 40 trong horse.txt, khiến nhiều ngựa trỏ về cùng bộ hình. Client tra theo ParticularType và Level: dòng dữ liệu horseres (bỏ header) = k*10+lvl; giá trị cột 2 trừ 2 là chỉ số equip zero-based của bảng NPC. Các sprite mã 0–8 trong cửa hàng lần lượt là MA_HH_009, 005, 008, 004, 007, 006, 011, 012, 013. Các bậc cùng loại có thể dùng chung ngoại hình theo bảng gốc.

Renderer hiện dùng mount-rig-data.js và mount-rig.js. Người cưỡi dùng sprite Ride gốc cho đầu/tóc/thân/tay/vũ khí của cả nam và nữ, cùng tọa độ và tỷ lệ với ngựa. Đã bỏ renderer uốn chân/cắt thân từ sprite đi bộ. Thứ tự các phần HorseFront=12, HorseMiddle=13, HorseBack=14 và người lấy từ bảng texture sort, có override theo hướng/hành động/frame. Một đồng hồ và frame nguồn của thân điều khiển cả ngựa và người để tránh lệch nhịp giữa atlas đầy đủ và atlas lấy mẫu.

Có 4.484 sheet trong manifest rig (gồm 249 sheet ngựa đã có); bộ mới tải theo trang bị đang dùng, không precache toàn bộ ảnh. Ảnh người cưỡi được lấy tối đa 8 frame/hướng, giữ màu/palette/alpha và tọa độ từ SPR. Một số tham chiếu cosmetic không có trong các PAK, và hai sprite vũ khí có header frame/direction bất hợp lệ; manifest ghi lại để kiểm tra. Khi chưa có rig đầy đủ hoặc ảnh chưa tải xong, hiển thị nhân vật bình thường thay vì ghép người đứng lên ngựa. Bản xem thử: horse-rig-preview.png (ba loại ngựa, nam/nữ, tám hướng).

Tái tạo rig:

    node tools/import-client-riding.mjs "đường dẫn tới Client_VLTK_SHXT"
    node tools/preview-client-riding.mjs

Importer chuẩn hóa đường dẫn tương đối (bảng ngựa nữ tham chiếu ../man), đọc action theo vị trí cột gốc kể cả bảng có header tiếng Trung, hỗ trợ PAK nén nguyên sprite và nén từng frame. Tham khảo GetHorseRes trong Sources/Core/Src/KItemChangeRes.cpp và GetName/Draw/GetSort trong KNpcResNode.cpp, KNpcRes.cpp của source Mignet/Jx đã dùng để kiểm chứng. Cache import nằm trong tools/.riding-import-cache.json, được bỏ qua trong Git và deploy.

Ba chỉ số trang phục 64/66/67 thiếu sprite cưỡi trong client được ghép bằng bộ trang phục cưỡi mặc định gốc (cùng thân/tay), vẫn giữ đúng loại ngựa và đầu/vũ khí đang mặc. Vì vậy một số áo đặc biệt có thể hiện kiểu áo mặc định khi cưỡi. Đã kiểm tra toàn bộ 9 loại × 10 bậc × 2 giới tính × 3 hành động cửa hàng đều có rig.
