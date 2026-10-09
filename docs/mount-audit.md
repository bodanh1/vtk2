# Kiểm kê thú cưỡi trong client

Đối chiếu horse.txt, horseres.txt, bảng ghép 3 lớp trong npcres và SPR thực tế đọc từ các PAK đang được package.ini sử dụng.

{
  "clientItemRecords": 330,
  "h5ItemRecords": 330,
  "itemTypes": 33,
  "names": 54,
  "referencedModels": 31,
  "readyModels": [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    15,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30
  ],
  "readyModelCount": 29,
  "readyItemTypes": 31,
  "shopTypes": 9,
  "shopModels": 13,
  "verifiedSpr": 581,
  "unavailable": []
}

| Mã vật phẩm k | Tên | Số mẫu sprite (model + 1) | Port |
| --- | --- | --- | --- |
| 0 | Liệt Hoàng Mã, Hoàng Mã, Hoàng Phiêu, Đại Uyển Hoàng Mã, Phi Hoàng | 9 | Đủ sprite |
| 1 | Liệt Thanh Mã, Thanh Thông, Tử Lưu, Đại Uyển Thanh Mã, Hoa Lưu | 5 | Đủ sprite |
| 2 | Liệt Bạch Mã, Bạch Mã, Ngọc Hoa Thông, Đại Uyển Bạch Mã, Túc Sương | 8 | Đủ sprite |
| 3 | Liệt Hắc Mã, Hắc Mã, Hắc Kỳ, Đại Uyển Hắc Mã, Ô Chùy | 4 | Đủ sprite |
| 4 | Liệt Hồng Mã, Hồng Mã, Hồng Ly, Đại Uyển Hãn Huyết Mã, Xích Ký | 7 | Đủ sprite |
| 5 | Ô Vân Đạp Tuyết, Xích Thố, Tuyệt ảnh, Đích Lô, Chiếu Dạ Ngọc Sư Tử | 6, 1, 10, 3, 2 | Đủ sprite |
| 6 | Bôn Tiêu | 11 | Đủ sprite |
| 7 | Phiên Vũ | 12 | Đủ sprite |
| 8 | Phi Vân | 13 | Đủ sprite |
| 9 | Xích Long Câu | 14 | Đủ sprite |
| 10 | Tuyệt Địa | 15 | Thiếu sprite |
| 11 | Du Huy | 16 | Đủ sprite |
| 12 | Đằng Vụ | 17 | Thiếu sprite |
| 13 | Siêu Quang | 18 | Đủ sprite |
| 14 | Kim Tinh Hổ Vương | 19 | Đủ sprite |
| 15 | Hỏa Tinh Kim Hổ Vương | 20 | Đủ sprite |
| 16 | Kim Tinh Bạch Hổ Vương | 21 | Đủ sprite |
| 17 | Long Tinh Hắc Hổ Vương | 22 | Đủ sprite |
| 18 | Hãn Huyết Long Câu | 23 | Đủ sprite |
| 19 | Phong Vân Bạch Mã | 12 | Đủ sprite |
| 20 | Phong Vân Chiến Mã | 12 | Đủ sprite |
| 21 | Phong Vân Thần Mã | 12 | Đủ sprite |
| 22 | Sư tử | 24 | Đủ sprite |
| 23 | Lạc đà | 25 | Đủ sprite |
| 24 | Dương Đà | 26 | Đủ sprite |
| 25 | Hươu đốm | 27 | Đủ sprite |
| 26 | Dương Sa | 28 | Đủ sprite |
| 27 | Ngự Phong | 29 | Đủ sprite |
| 28 | Truy điện | 30 | Đủ sprite |
| 29 | Lưu Tinh | 31 | Đủ sprite |
| 30 | Phiên Vũ | 12 | Đủ sprite |
| 31 | Xích Long Câu | 14 | Đủ sprite |
| 32 | Siêu Quang | 18 | Đủ sprite |

Có 34 dòng mẫu trong bảng sprite, nhưng 31 mẫu được vật phẩm tham chiếu; 29 mẫu có đủ tài nguyên. Siêu Quang (model 17, mã k=13/32) thiếu bộ ngựa cho nữ, có thể dùng lớp ngựa nam kết hợp người cưỡi nữ, như renderer H5 hiện tại.

Bảy hoạt ảnh đã kiểm tra: đứng, đi, chạy, chém, đâm, phép và bị thương; tám hướng. Chưa xác nhận RideDie/RideStand1/RideStand2 trong lần kiểm kê này.

H5 đã có dữ liệu 330 vật phẩm và atlas cho 29 mẫu khả dụng. Cửa hàng đang mở k=0–8: 9 mã loại, tương ứng 13 mẫu hình do k=5 dùng nhiều mẫu theo bậc. Các loại còn lại cần bổ sung đường nhận/mua và cân bằng điều kiện; không cần dựng lại renderer. Chưa mở bán hay đổi economy trong lần nghiên cứu này.

Ảnh dựng thử: `mount-animal-preview.png`. Hàng 1 từ trái sang phải: Kim Tinh Hổ Vương, Hỏa Tinh Kim Hổ Vương, Kim Tinh Bạch Hổ Vương, Long Tinh Hắc Hổ Vương, Sư tử, Lạc đà. Hàng 2: Dương Đà, Hươu đốm, Dương Sa, Ngự Phong, Truy điện, Lưu Tinh. Hàng 3 lặp hàng 1 với người cưỡi nữ. 29 là số mã mẫu có tài nguyên đầy đủ, không cam kết tất cả có ngoại hình hoàn toàn khác nhau.
