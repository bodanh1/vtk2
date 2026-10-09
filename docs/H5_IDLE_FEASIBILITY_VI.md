# Khảo sát client và thiết kế chuyển đổi H5 idle

Ngày: 09/10/2026. Phạm vi: khảo sát filesystem, mẫu cấu hình và Lua; chưa chạy game, chưa giải nén PAK, chưa xác minh server đang vận hành. Các thông số thiết kế bên dưới là đề xuất cho game mới.

## 1. Kết luận

Có thể xây webgame idle lấy dữ liệu và phong cách hình ảnh từ bộ client này. Đây là dự án chuyển đổi nội dung và viết lại runtime/backend. Chưa có bằng chứng về source engine hay source server đầy đủ trong thư mục đã khảo sát, nên chưa thể coi đây là một bản port engine trực tiếp.

## 2. Bằng chứng tại chỗ

- 3.537 file, tổng 4.877.505.694 byte (~4,88 GB thập phân).
- 2.214 TXT, 839 Lua, 214 INI, 151 Map, 29 PAK, 36 MP3, 10 DLL, 3 EXE.
- game.exe, engine.dll, represent2.dll, represent3.dll: runtime Windows dạng binary.
- script/ chủ yếu có skill/, ui/ và protocol.lua; không phải toàn bộ logic server.
- settings/ có item, droprate, event, activitysys, maps, npc, shop, task, faction, battles, partner, petsys, meridian, tong.
- settings/item/meleeweapon.txt có bảng tab-separated với tên, đường dẫn SPR, kích thước, giá, cấp và thuộc tính. Có các bảng ring, helm, boot, belt, horse, goldequip, platinaequip, fusion và nguyên liệu chế tạo.
- script/skill/wudu.lua có SKILLS và hàm kinh nghiệm SkillExpFunc; là nguồn tham khảo công thức và progression.
- settings/item/npcdroprate.ini: Count=57, RandRange=1000000, MoneyRate=20; mục đầu có RandRate=300. Chưa biết thứ tự các phép roll nên chưa quy đổi thành tỷ lệ trên mỗi kill.
- settings/item/autohangdroprate.ini: sáu mục cùng Genre=6, Detail=1, Particular=147, cấp 1–6; trọng số 418900, 450000, 120000, 10000, 1000, 100; tổng bằng 1000000. Nếu chọn một mục theo trọng số, cấp 6 là 0,01% trên mỗi lần chọn bảng; chưa xác minh tần suất gọi bảng hoặc ý nghĩa item.
- settings/event có dữ liệu quà Tết, Trung Thu, ghép vật phẩm và rương thưởng. Có settings/activitysys/activity.txt và activitydetail.txt.
- VLAuto có exe và hook DLL; VLAutoPro.ini có AttackBossFirst=1. Có thể tham khảo hành vi, cần xây auto thành cơ chế chính thức của game mới.
- package.ini liệt kê ui/slistcache, updatejx14 xuống các bản update cũ rồi các gói base. Cần kiểm chứng quy tắc override bằng extractor, giữ provenance của mọi asset.
- spr.pak bắt đầu bằng chữ ký PACK; chưa suy ra cấu trúc archive chỉ từ chữ ký.
- protocol.lua tham chiếu script/lib/objbuffer_head.lua và gamesetting.ini tham chiếu script/activitysys/g_npcdeath.lua; hai file không có dạng loose trong thư mục. Có thể nằm trong PAK hoặc thuộc bộ server khác.
- Văn bản hiển thị lỗi ký tự khi đọc mặc định; có cả tên file trông như mojibake. Cần xác định encoding theo từng nguồn trước khi chuyển UTF-8, giữ bản byte gốc.

## 3. Những gì tái sử dụng

| Thành phần | Hướng xử lý |
|---|---|
| Item, skill, NPC, recipe, drop | Import sang schema mới, giữ ID nguồn và báo lỗi liên kết thiếu |
| Sprite, icon, hiệu ứng | Giải nén PAK, decode SPR, xuất atlas ảnh và metadata frame/pivot |
| Bản đồ | Lấy vùng/địa danh cho hoạt động; thử một map nhỏ trước khi quyết định giữ bản đồ isometric |
| Nhạc, âm thanh | Chọn lọc và đóng gói theo vùng; xác nhận quyền sử dụng khi phát hành |
| Lua | Dịch công thức đã hiểu sang mô phỏng mới; kiểm tra API engine phụ thuộc |
| EXE, DLL, hook auto | Viết lại chức năng tương ứng cho trình duyệt và server |
| Event cũ | Tham khảo nội dung; lịch chạy, điều kiện và phát thưởng cần backend mới |

Không phân phối toàn bộ 4,88 GB cho lần tải đầu. Tách gói khởi động, gói vùng và gói cosmetic; tải theo nhu cầu. Ngân sách ban đầu dự kiến 10–20 MB, cần đo trên thiết bị mục tiêu để xác nhận.

## 4. Vòng chơi đề xuất

Chọn vùng và build → đặt auto → đánh quái hoặc làm nghề → nhận nguyên liệu/tiền/đồ hiếm → chế tạo/nâng cấp/giao dịch → mở vùng và boss → tham gia event → quay lại farm mục tiêu mới.

Dùng màn hình khu vực nhỏ với nhân vật và quái tự chiến đấu, kèm bảng tiến độ. Giữ chất võ lâm qua môn phái, ngũ hành, trang bị, boss và địa danh. Giai đoạn đầu nên tập trung vào PvE và nghề nghiệp.

## 5. Hệ thống bắt buộc

### Inventory

Phân biệt item definition và item instance. Đồ trang bị có ID duy nhất, affix, độ bền, cấp nâng, trạng thái khóa; nguyên liệu có stack. Túi, kho, trang bị và hộp nhận thưởng tách riêng. Filter tự nhặt/bán/phân giải theo rarity và thuộc tính; khóa đồ quý; khi túi đầy chuyển vào hộp giới hạn hoặc dừng theo lựa chọn. Mọi chuyển vật phẩm là giao dịch atomic, có nhật ký và request ID để không nhận hai lần.

### Auto và idle

Auto config gồm vùng, mục tiêu, thứ tự skill, ngưỡng dùng thuốc, lọc đồ, cách xử lý chết/túi đầy/hết nguyên liệu. Server chốt cấu hình và thời điểm bắt đầu. Khi offline, tính elapsed theo giờ server và giới hạn đã cấu hình, trừ vật tư rồi cấp thưởng một lần. Thay đổi build phải chốt phiên cũ trước. Không dựa vào timer của tab trình duyệt vì tab nền hoặc điện thoại ngủ sẽ ngừng chạy ổn định.

Online và offline dùng cùng luật năng suất cơ sở; tương tác trực tiếp có thể tối ưu lựa chọn hoặc tham gia hoạt động đặc biệt. Boss chung có trạng thái riêng theo thời gian thực. Thử mức offline cap 8 giờ ở prototype, đo hành vi rồi điều chỉnh.

### Loot pool và drop thấp

Tạm hiểu pool là nhóm phần thưởng có trọng số, dùng chung cho quái, boss, rương và event. Mỗi pool có phiên bản, điều kiện, số lần roll, entry trọng số, lượng, trạng thái giao dịch và cơ chế pity nếu có. Không mặc định mọi bảng đều chuẩn hóa về 100%; phải mô tả rõ chọn một entry, roll độc lập, hoặc nhóm loại trừ nhau.

Tách tài nguyên tiến độ chắc chắn khỏi đồ jackpot. Drop thấp vẫn có fragment, mastery hoặc token để phiên farm không vô ích. Đồ hiếm không nên là cửa bắt buộc để mở toàn bộ gameplay. Công khai đơn vị xác suất: mỗi kill, mỗi chest hay mỗi boss claim.

Ví dụ thiết kế mới: p=0,01%/kill, 600 kill/giờ thì kỳ vọng 0,06 món/giờ và thời gian trung bình đến món đầu khoảng 16,67 giờ. Sau 10.000 kill xác suất đã có ít nhất một món khoảng 63,2%, không phải chắc chắn. Đây là minh họa độc lập, không phải kết luận về client.

### Boss

Boss cá nhân cho progression; boss vùng và boss thế giới cho hoạt động chung. Ghi nhận contribution phía server; điều kiện đủ thưởng, giới hạn claim và lịch spawn rõ ràng. Phần thưởng cá nhân dựa trên đóng góp để tránh chỉ người last-hit được đồ. Trước khi mở boss chung cần có xử lý cạnh tranh claim và mô hình HP thống nhất.

### Skilling và farming

Nghề khai khoáng, hái dược, câu cá, trồng trọt, luyện đan, rèn và chế biến. Mỗi nghề có XP/mastery, tool, recipe, vùng tài nguyên và chuỗi tiêu hao. Đề xuất một slot chiến đấu và một slot nghề hỗ trợ; số slot là tham số balance. Farming gồm cả farm quái lẫn trồng trọt: plot, hạt giống, thời gian trưởng thành, sản lượng, kho bảo quản. Đây là hệ thống mới, chưa xác minh tồn tại đầy đủ trong client.

### Event

Lịch ngày/tuần/mùa, time zone hiển thị rõ, timestamp lưu UTC. Event chạy qua cấu hình versioned: điều kiện mở, nhiệm vụ, pool, currency, cửa hàng đổi và hạn nhận. Có trạng thái scheduled/active/claim-only/closed, chống claim lặp và quy định xử lý token hết hạn. Tránh quá nhiều lịch ép người chơi online cùng lúc; nên có cửa sổ tham gia rộng và lượt tích lũy.

## 6. Economy

Ba nhóm ban đầu: bạc giao dịch, nguyên liệu/đồ giao dịch và token hoạt động có kiểm soát. Vật phẩm khóa phải có lý do nguồn phát rõ. Chưa cần nhiều loại tiền premium trong prototype.

Nguồn vào: quái, nghề, quest, boss, event, bán NPC. Nguồn ra: chế tạo, sửa, thuốc, nâng cấp, reroll, mở kho và phí chợ. Chợ do server escrow vật phẩm/tiền; mua bán atomic, không dùng số dư client. Giới hạn thưởng theo tài khoản khi cần chống nhân bản sản lượng bằng nhiều nhân vật.

Đo bạc tạo/tiêu mỗi ngày, giá vật liệu, thời gian có nâng cấp, tỷ lệ món hiếm, lượng tồn kho và mức tập trung tài sản. Event phải có ngân sách emission riêng. Dùng mô phỏng 7/30/90 ngày với các profile ít chơi, idle đều, tối ưu và nhiều tài khoản trước khi chốt drop thấp và phí.

## 7. Kiến trúc đề xuất

Trình duyệt: giao diện, render scene, input và hiển thị snapshot. Backend: quyết định chiến đấu, RNG, idle, inventory, market, boss và event. Database giao dịch là nguồn dữ liệu chính; cache/queue hỗ trợ lịch hoạt động và tải nền.

Module: content importer, combat simulator, activity session, inventory, wallet ledger, loot pool, recipe/mastery, event scheduler, boss instance, marketplace, audit/admin.

Không phát mỗi kill bằng một job riêng cho mọi người chơi. Mô phỏng theo chunk thời gian hoặc kết quả batch với công thức đã xác minh; giữ phân phối loot và tiêu hao tương đương. Boss chung cần scheduler riêng. Đo tải trước khi chọn hạ tầng cuối.

Schema tối thiểu: account, character, item_definition, item_instance, inventory_stack, wallet, ledger_entry, activity_session, auto_profile, loot_pool_version, recipe, skill_mastery, boss_instance, boss_contribution, event_instance, reward_claim, market_listing.

## 8. Trình tự thực hiện

1. Thử pipeline: một PAK, một sprite nhân vật, một icon, một vùng; kiểm tra palette, alpha, hướng, pivot và override. Lập manifest nội dung và chuẩn hóa encoding. Kết quả cần xem được trong browser.
2. Prototype khép kín: một môn phái, một vùng, khoảng 20 item, farm quái, túi đồ, pool, nghề khai khoáng/rèn, auto và offline claim. Các lượng này là giới hạn thiết kế mới.
3. Server và persistence: chống claim lặp, ledger, thay đổi build, chết/hết thuốc/túi đầy, restore sau crash, chênh giờ client và offline cap.
4. Balance: mô phỏng progression và economy; thử phân phối drop thay vì chỉ nhìn trung bình.
5. Mở rộng boss/event/chợ: làm lần lượt sau khi vòng chơi nền đạt yêu cầu. Bổ sung admin chỉnh cấu hình có lịch sử và khả năng rollback.

Tiêu chí nghiệm thu prototype: vào game trên điện thoại, có hoạt ảnh mẫu, farm và nâng cấp được; reload không mất trạng thái; đóng tab rồi nhận idle đúng một lần; item và tiền không âm; chi phí và thưởng khớp ledger; trạng thái túi đầy không mất đồ; cấu hình pool có version để truy vết.

## 9. Những điểm còn cần xác minh

- Có source server hoặc bộ script server riêng không? Các tham chiếu thiếu có nằm trong PAK không?
- Có công cụ giải nén PACK và decode SPR phù hợp phiên bản này không?
- Encoding gốc từng nhóm dữ liệu và tên file là gì?
- Pool người dùng muốn là loot pool, gacha pool hay một cơ chế khác?
- Mức ưu tiên: giữ đồ họa VLTK isometric hay giao diện idle nhẹ; farming quái hay cả nông trại; có giao dịch người chơi và boss chung ngay bản đầu không?

Báo cáo này là khảo sát sơ bộ có bằng chứng và thiết kế tiền khả thi. Chưa xác nhận pipeline giải nén/đồ họa, công thức server thật hoặc tính đầy đủ của nội dung đóng gói.
