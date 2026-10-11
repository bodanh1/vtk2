# v109 — yêu cầu trang bị từ client

Đối chiếu `Client_VLTK_SHXT/settings/item/{meleeweapon,rangeweapon,armor,ring,amulet,boot,belt,helm,cuff,pendant}.txt`: cả 660 mẫu thường trong H5 đã giữ đúng sáu cặp yêu cầu của bảng client. Không sửa hoặc nới cấp / giới tính / hệ / môn phái của các mẫu này.

`pak-reference/Sources/Core/Src/KItemList.cpp:561–688` cho thấy `CanEquip` kiểm tra từng yêu cầu; `EnoughAttrib` dùng `m_nCurStrength`, `m_nCurDexterity`, `m_nCurVitality`, `m_nCurEngergy`. Quyền cầm món đồ theo các yêu cầu của món, không theo vũ khí mặc định mà auto chọn cho phái. Điều kiện xuất chiêu là kiểm tra riêng ở `skills.txt` (`EqtLimit` / `HorseLimit`), được giữ nguyên.

Lỗi tái hiện: Thiếu Lâm có côn mặc định, đao hợp lệ ở hành trang; API equip trả `{ok:true}` nhưng đao vẫn trong túi. Nguyên nhân `equip(item,true)` chọn ô bằng `bestEquipPlan`, vốn từ chối đao theo vũ khí ưu tiên của auto. API nay dùng đường trang bị thủ công và kiểm tra món thực sự đã vào ô. Món vừa được auto mặc trước thao tác cũng được xác nhận thành công, không đưa lại vào túi hoặc nhân đôi.

Yêu cầu bốn thuộc tính nay tính cả điểm cộng đang có từ đồ mặc (chỉ số gốc, cường hóa, dòng sáng / dòng ẩn đang kích hoạt và dòng bổ sung của bộ đồ). Đồ trong hành trang không tự cộng điểm để đáp ứng yêu cầu của chính nó. Hàm tính nhỏ, không gọi đệ quy `calc`; mỗi lần tính chỉ số tạo một bản bốn thuộc tính để dùng chung cho các ô đồ. Các thông báo thiếu điểm và nút cộng điểm cùng dùng số này. API trả rõ điều kiện chưa đạt.

Auto mặc / mua / dành điểm cho vũ khí ưu tiên loại của chiêu chính được chọn rõ; nếu không khóa chiêu chính thì giữ loại đang dùng đã có võ công tương ứng. Với ám khí, auto kiểm tra đúng loại `100+k` theo client khi chọn chiêu chính, không chỉ kiểm tra nhóm ám khí chung. Trang bị thủ công vẫn cho phép vũ khí khác nếu món đó đủ yêu cầu; chiêu sai vũ khí vẫn không xuất được.

Kiểm thử: 660 mẫu đối chiếu trực tiếp; 10 loại vũ khí trên 10 phái; Thiếu Lâm từ côn sang đao với sức mạnh cộng từ giáp; không tính bonus của món chưa mặc hoặc dòng ẩn chưa kích hoạt; bốn thuộc tính; chặn sai cấp / giới tính / hệ / môn phái; nhánh võ công và loại ám khí; API lưu món và trả món cũ vào túi, phát lại chỉ một lần, đích vừa được auto mặc. Bộ kiểm tra chung cũng được chạy lại.

Không thêm sprite, thư viện, bộ hẹn giờ hoặc request lưu mới. Khối tính điều kiện dùng chung giữa trình duyệt và worker.
