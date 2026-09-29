# BÁO CÁO RÀ SOÁT & KẾ HOẠCH RETROFIT GIAO DIỆN THEO NGUYÊN MẪU CÁNH CỤT VUI VẺ (2014)
# (UI / VISUAL DIRECTION RETROFIT AUDIT)

**Dự án:** Penguin Island — Cánh Cụt Vui Vẻ Remake  
**Nhánh thực hiện:** `feat/ui`  
**Ngày thực hiện:** 29/09/2026  
**Tư liệu đối chiếu trực quan:** 5 ảnh chụp màn hình lịch sử bản gốc Cánh Cụt Vui Vẻ trên Zing Me (2014–2015):
- `media_1790693962704.png`: Màn hình gameplay chính (World, Top HUD, Friend Bar, Shelf Rack, Đàn chim, Trứng rải rác trên tuyết, Hồ nước trung tâm).
- `media_1790693967713.png`: Giao diện Xe Hàng (Modal gỗ, hòm hàng, bảng điều khiển nhiệm vụ).
- `media_1790693973633.png`: Giao diện Túi Đồ (Bảng gỗ màu be, ô chứa đồ 3x6, tab da xanh lá, thanh sức chứa, nút Mở Rộng, nút X gỗ).
- `media_1790693976245.png`: Giao diện Chụp Ảnh (Khung ảnh kỉ niệm, bố cục 2 mảng xanh/trắng, logo Cánh Cụt Vui Vẻ).
- `media_1790693993793.jpg`: Giao diện Cửa Hàng (Mái che sọc hồng trắng, 3 tab phân loại chim/đồ ăn/vật phẩm, thẻ chim kèm sao và huy hiệu Hot/New).

---

## 1. VẤN ĐỀ CỦA GIAO DIỆN HIỆN TẠI (CURRENT PROBLEMS)

Qua đối chiếu trực quan giữa hiện trạng codebase và các ảnh tư liệu gốc, giao diện hiện tại đang mắc phải các sai lệch nghiêm trọng về phong cách (Anti-patterns):
1. **Glassmorphism & AI-generated Dashboard:**
   - Sử dụng quá mức hiệu ứng mờ (`backdrop-filter: blur(14px)`), gradient màu tím/xanh nhạt hiện đại, bo góc tròn viên thuốc (`border-radius: 9999px`).
   - `TopBar.vue` là một viên thuốc khổng lồ nằm giữa màn hình, mang phong cách "modern mobile/web app header" thay vì HUD game hoạt hình.
   - Các badge tiền tệ (`CurrencyBadge.vue`) là các viên thuốc màu đen bán trong suốt (`rgba(15, 23, 42, 0.45)`), tối tăm và lạc quẻ với thế giới tuyết.
2. **Hòn đảo đơn điệu như đĩa tròn 3D diorama nổi:**
   - Trong `SnowIslandScene.ts`, đảo được vẽ bằng các hình elip lồng nhau cứng nhắc (`fillEllipse`), tạo cảm giác một chiếc đĩa bay băng lơ lửng cô đơn giữa khoảng trống xanh ngắt, thiếu tự nhiên.
   - Hồ nước (`ice_pond`) chỉ là một mảng elip tĩnh trang trí, không thể hiện được vai trò "Kho dự trữ thức ăn trung tâm" (Food Storage) - nơi thức ăn được thả xuống và chim tự lao vào ăn.
3. **Mật độ cá thể (Penguin Population) quá thấp:**
   - Chim cánh cụt đứng rải rác như NPC đơn lẻ, không có cảm giác một bầy đàn sinh hoạt nhộn nhịp như nguyên mẫu (nơi có hàng chục chú chim đủ chủng loại, trang phục, mũ nón cùng di chuyển).
4. **Thiếu tương tác vật phẩm trên mặt đất (World-level objects):**
   - Bản gốc Zing Me có đặc điểm rất đặc trưng: **Trứng chim đẻ rơi trực tiếp trên mặt tuyết** thành từng cụm nhiều màu sắc xung quanh hồ nước; người chơi click vào trứng để thu hoạch vào túi đồ. Hiện tại trứng chỉ nằm trong modal ấp.
5. **Thanh công cụ đáy (Bottom Dock) giống navigation app di động:**
   - `ShelfRack.vue` đang được căn giữa màn hình với các icon tròn trắng phẳng, không có sự phân chia giữa **Thanh bạn bè (Friend Bar)** bên trái và **Kệ công cụ gỗ (Wooden Shelf)** bên góc phải như bản gốc.
6. **Modals mang phong cách SaaS Card:**
   - Các cửa sổ bật lên dùng nền trắng bóng bẩy, viền gradient mỏng, nút đóng bo tròn phẳng, thiếu hoàn toàn chất liệu mộc mạc hoạt hình (bảng gỗ màu be/kem viền nâu đậm, nút gỗ 'X', tab nổi 3D).

---

## 2. QUAN SÁT TỪ ẢNH TƯ LIỆU GỐC ZING ME (ORIGINAL REFERENCE OBSERVATIONS)

| Khu vực | Chi tiết quan sát từ ảnh tư liệu Zing Me 2014-2015 | Phân loại bằng chứng |
|---|---|:---:|
| **Top HUD** | - Sát mép trên cùng, chiều cao thấp (khoảng 36-40px).<br>- Bên trái: Ngôi sao vàng viền trắng hiển thị Level người chơi (VD: `Lv.43`), ngay cạnh là khung Avatar vuông bo góc + tên người chơi (`OSOSla...`).<br>- Giữa: Các viên nang tài nguyên hoạt hình màu tươi sáng với viền đậm: **Cá (Thức ăn)** [viên nang xanh lá/ngọc], **Vàng/Xu** [viên nang vàng cam], **Cash/Đô** [viên nang xanh lục], **Bông tuyết/Điểm** [viên nang xanh lam]. Mỗi ô đều có nút `+` màu xanh nổi bật để nạp/mua thêm.<br>- Bên phải: Nút camera hình máy ảnh chụp hình màu vàng cam để chụp ảnh kỷ niệm đảo. | `[CONFIRMED]` |
| **Cột bên trái** | - Bảng gỗ cắm cọc ghi sĩ số đàn chim: hình khiên/biển gỗ xanh `12/12` hoặc `1/3`.<br>- Các icon phím tắt xếp dọc: Cúp xếp hạng, Cây ATM, Pet thú cưng bảo vệ (chú gấu bắc cực đeo bịt mắt hải tặc), Xe Hàng (xe tải chở trứng vàng). | `[CONFIRMED]` |
| **Bố cục Đảo & Hồ nước** | - Đảo tuyết chiếm gần như trọn vẹn màn hình, bờ tuyết uốn lượn bất đối xứng tự nhiên, có núi tuyết xa xăm ở chân trời.<br>- **Hồ nước trung tâm (Pond)**: Nằm ngay giữa đảo, diện tích lớn, mặt nước xanh thẫm. Có cầu vồng/cầu trượt bên trái, kẹo mút và bánh ngọt ven hồ. Ở giữa hồ có khí cầu cá nhỏ chở thức ăn và đồng hồ đo thức ăn (VD: `0 / 3500` và `+500`). | `[CONFIRMED]` |
| **Đàn chim & Trứng** | - Đàn chim đông đúc, kích thước đa dạng (chim chúa đội vương miện, chim phù thủy đội nón sao, chim dưa hấu, chim đeo tai nghe...).<br>- **Trứng đẻ rải rác trên tuyết**: Hàng chục quả trứng đủ loại (trứng đốm cam, trứng xanh ngọc, trứng nứt dung nham, trứng vàng) nằm trực tiếp trên mặt đất quanh các chú chim. | `[CONFIRMED]` |
| **Bong bóng thoại** | - Nền trắng tinh hoặc kem sáng, viền đen mảnh hoạt hình, chữ đậm dễ đọc, đuôi nhọn chỉ về đầu chim, xuất hiện ngẫu nhiên khi chim biểu cảm. | `[CONFIRMED]` |
| **Thanh đáy (Bottom Bar)** | - **Phía trái & giữa**: Thanh Hàng Xóm / Bạn Bè (Friend Strip) đặt trong khay tuyết/băng ngang, gồm các ô avatar vuông của bạn bè trên mạng xã hội, có sao cấp độ bên dưới (43, 44, 45...) và nút dấu `+` để thêm bạn.<br>- **Góc phải dưới cùng**: Kệ công cụ bằng gỗ (Wooden Shelf Box) 2 tầng đặt gọn ở góc: Túi Đồ (balo da), Kính lúp (tìm bạn), Cuốn sách đỏ (Bộ sưu tập), Bánh răng (Cài đặt), Thư từ, v.v. | `[CONFIRMED]` |
| **Modal Túi Đồ** | - Bảng gỗ màu be/kem (`#F7EDD9`), viền nâu gỗ đậm (`#6B3E1B`, 4px) viền 3D nổi.<br>- Tab tiêu đề bên trái: Hình túi da + nhãn bo cong xanh lá cây nổi bật "Túi Đồ".<br>- Giữa: Viên nang da màu nâu đậm hiển thị sức chứa `681 / 1000` + nút xanh "Mở Rộng".<br>- Nút đóng góc trên phải: Nút gỗ chữ 'X' màu nâu đậm.<br>- Lưới ô đồ: 3 hàng x 6 cột (18 ô), mỗi ô là hình chữ nhật bo góc màu kem nhạt, có số lượng màu đen in đậm góc phải dưới.<br>- Phân trang đáy: `<` `1/1` `>`. | `[CONFIRMED]` |
| **Modal Cửa Hàng** | - Phía trên có mái che bạt sọc hồng - trắng dạng sạp chợ hội chợ.<br>- 3 Tab chính bo tròn trên đầu: Tab Chim cánh cụt, Tab Dụng cụ/Thức ăn, Tab Tiền tệ.<br>- Lưới thẻ sản phẩm: Mỗi thẻ có khung nền sáng, số sao phẩm cấp (1-5 sao), nhãn ruy-băng "New" hoặc "Hot" góc trên, hình minh họa, tên và thanh giá tiền vàng/cash ở chân thẻ. | `[CONFIRMED]` |

---

## 3. NGUYÊN TẮC THIẾT KẾ MỤC TIÊU (TARGET VISUAL PRINCIPLES)

1. **WORLD-FIRST (Thế giới là nhân vật chính):**
   - Mọi thành phần UI (HUD trên, thanh công cụ dưới, bảng bạn bè) phải nép sát mép ngoài, độ cao tối giản để chừa hơn 85% không gian cho hòn đảo tuyết sinh hoạt.
2. **CARTOON SOCIAL WEBGAME AESTHETIC (Chất hoạt hình Flash 2014):**
   - Loại bỏ triệt để: Glassmorphism, nền mờ `backdrop-filter`, viền phát sáng neon tím/hồng, nút bấm tròn màu trắng trơn phẳng.
   - Sử dụng: Màu sắc tươi vui bão hòa tốt, đường viền outline rõ ràng (nâu đậm `#5C3317`, xanh navy `#1E3A8A`), nút bấm có độ nổi khối xúc giác (tactile bevel, highlight đỉnh, đổ bóng đáy).
3. **MẬT ĐỘ THẾ GIỚI SINH ĐỘNG (DENSE LIVING WORLD):**
   - Hồ nước trung tâm có chỉ số thức ăn nổi (`Food Meter`), đàn chim waddle tung tăng, trứng đẻ trực tiếp trên tuyết có thể click nhặt vào túi đồ.
4. **BẢNG GỖ MÀU KEM & NÚT 'X' GỖ CHO TOÀN BỘ MODAL:**
   - Chuẩn hóa ngôn ngữ chung cho tất cả các modal: Thân panel màu kem be ấm (`#FBF6EB`), viền nâu gỗ 2 lớp, header hoạt hình nổi khối, nút đóng 'X' gỗ phong cách Zing Me.

---

## 4. MA TRẬN PHÂN LOẠI & HÀNH ĐỘNG CHO CÁC COMPONENT

| Tên Component | Hiện trạng | Kế hoạch Redesign / Action |
|---|---|---|
| `SnowIslandScene.ts` | Elip nổi đơn điệu, pond elip tĩnh. | **PHASE A & C:** Mở rộng bờ tuyết bất đối xứng tự nhiên; thiết kế lại Hồ Nước trung tâm có viền bờ đá/băng hoạt hình, cầu trượt/cầu vồng ven hồ, đồng hồ trữ thức ăn `0 / 500` nổi trên mặt hồ; hỗ trợ trứng rơi trên nền tuyết. |
| `PenguinEntity.ts` | 1-2 chim đứng yên như NPC. | **PHASE B:** Tăng mật độ chim hiển thị, hoạt ảnh bước đi lạch bạch tự nhiên, waddle tới hồ khi đói, cải tiến bong bóng thoại hoạt hình viền đậm ngộ nghĩnh. |
| `TopBar.vue` & `CurrencyBadge.vue` | Viên thuốc thủy tinh mờ khổng lồ ở giữa. | **PHASE D:** Xóa viên thuốc mờ. Thay bằng thanh HUD sát đỉnh màn hình: Ngôi sao Level vàng viền trắng + Avatar người chơi góc trái; Cụm viên nang tài nguyên hoạt hình viền đậm (Cá, Vàng, Gem) kèm nút `+` xanh; Nút Camera vàng cam góc phải. |
| `ShelfRack.vue` | Nằm giữa màn hình, nút tròn trắng hiện đại. | **PHASE E:** Chuyển về góc phải dưới cùng màn hình dưới dạng **Kệ gỗ hai tầng (Wooden Cabinet Rack)** chuẩn Zing Me, các nút bấm mộc mạc (Túi Đồ, Bộ Sưu Tập, Ấp Trứng, Phối Giống, Cửa Hàng, Nhiệm Vụ, Cài Đặt). |
| `NeighborStrip.vue` | Đang bị ẩn hoặc tách rời. | **PHASE F:** Tích hợp thành thanh khay băng ngang ở góc dưới bên trái trải dài sang giữa, hiển thị danh sách bạn bè với avatar vuông, sao level và nút kết bạn. |
| Trứng trên mặt đất (`WorldEgg`) | Chỉ có trong modal ấp. | **PHASE G:** Render trứng đẻ trên nền tuyết trong `SnowIslandScene`, người chơi click nhặt trứng bay vào túi đồ (`inventoryStore`). |
| Tất cả Modals (`InventoryModal`, `ShopModal`, `HatcheryModal`, `BreedingModal`, `QuestModal`, `CollectionModal`, `SettingsModal`, `ConfirmModal`) | Card trắng bo tròn phẳng phong cách SaaS, backdrop mờ hiện đại. | **PHASE H:** Chuẩn hóa toàn bộ: Thân panel màu be kem hoạt hình (`#FBF6EB`), khung viền gỗ nâu đậm (`#6B3E1B`), nút đóng chữ 'X' gỗ, tab danh mục kiểu túi da/mái che sạp chợ, nút hành động vàng/xanh tactile. |

---

## 5. TÀI NGUYÊN & MÃ NGUỒN ĐƯỢC BẢO LƯU

1. **Bộ Icon PNG đã số hóa:** Tái sử dụng toàn bộ icon sắc nét trong `apps/web/src/assets/game/index.ts` (coin, fish, gem, inventory, collection, hatchery, shop, quests, settings, v.v.).
2. **Kiến trúc Domain Logic & Pinia Stores (100% giữ nguyên):**
   - `gameStore.ts`, `inventoryStore.ts`, `breedingStore.ts`, `questStore.ts`, `shopStore.ts`, `decorationStore.ts`.
   - Các service: `GeneticsService`, `BreedingService`, `NeedsService`, `ProgressionService`, `StorageService` (Save V3).
   - Hệ thống âm thanh `SoundService` và cầu nối sự kiện `GameBridge`.
3. **Không thêm tính năng ngoại lai:** Tuyệt đối không đưa mini-game câu cá hay cơ chế giả định nào trở lại.

---

## 6. LỘ TRÌNH THỰC HIỆN CHI TIẾT (IMPLEMENTATION PHASES)

- **PHASE A:** Thiết kế lại hòn đảo trong `SnowIslandScene.ts` (Bờ tuyết tự nhiên, mở rộng không gian, loại bỏ đĩa tròn lơ lửng).
- **PHASE B:** Nâng cấp hiển thị đàn chim cánh cụt & Bong bóng thoại hoạt hình (`PenguinEntity.ts`, `SpeechBubble.ts`).
- **PHASE C:** Xây dựng Hồ Nước Trung Tâm (`Central Pond`) với bờ đá tuyết hoạt hình, hoạt ảnh nước và bảng hiển thị thức ăn (`Food Storage Meter`).
- **PHASE D:** Thay thế Top HUD (`TopBar.vue`, `CurrencyBadge.vue`) thành phong cách thanh tài nguyên hoạt hình sát đỉnh (Star Level, Avatar box, Resource capsules, Camera button).
- **PHASE E:** Thiết kế lại Kệ công cụ góc phải dưới (`ShelfRack.vue`) theo kiểu tủ gỗ hoạt hình 2 tầng.
- **PHASE F:** Tích hợp Thanh bạn bè (`NeighborStrip.vue`) thành khay băng tuyết nằm ở cạnh dưới bên trái/giữa.
- **PHASE G:** Bổ sung cơ chế hiển thị trứng rơi rải rác trên đảo tuyết (`SnowIslandScene`) và nhặt trứng vào túi đồ.
- **PHASE H:** Chuẩn hóa toàn bộ hệ thống Modal theo ngôn ngữ Bảng Gỗ Màu Kem (`Beige Board + Wooden Border + Wood X Button`).
- **PHASE I:** Tinh chỉnh Responsive trên Desktop (1920x1080, 1366x768, 1280x720) và Mobile fallback, kiểm thử toàn diện (`vitest`, `build`, visual QA).
