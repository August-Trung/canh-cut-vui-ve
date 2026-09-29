# BÁO CÁO RÀ SOÁT VÀ ĐIỀU CHỈNH TÍNH NĂNG PHASE 3
# (PHASE 3 RETROACTIVE FEATURE AUDIT & CLEANUP)

**Dự án:** Penguin Island — Cánh Cụt Vui Vẻ Remake  
**Ngày thực hiện:** 29/09/2026  
**Tài liệu tham chiếu:** `docs/superpowers/canh_cut_vui_ve_game_design_v1.md`, `docs/superpowers/specs/2026-09-28-penguin-island-phase3-design.md`, tư liệu hình ảnh & lịch sử Zing Me 2014.

---

## 1. MỤC TIÊU VÀ NGUYÊN TẮC RÀ SOÁT

### 1.1. Bối cảnh
Giai đoạn Phase 3 đã hoàn thành với 46 test suites, 407 tests passing và production build sạch. Tuy nhiên, qua kiểm thử gameplay thực tế và đối chiếu lại với tài liệu thiết kế gốc `canh_cut_vui_ve_game_design_v1.md`, một số tính năng đã bị triển khai lệch hướng hoặc suy diễn quá mức so với triết lý thiết kế ban đầu của game social simulation năm 2014 (đặc biệt là mini-game "Câu Cá" dưới dạng modal overlay độc lập).

### 1.2. Nguyên tắc đánh giá
Mỗi tính năng được phân loại theo thang bằng chứng nghiêm ngặt:
- `[CONFIRMED]`: Xác thực 100% có trong game gốc Zing Me "Cánh Cụt Vui Vẻ" qua hình ảnh, tài liệu hoặc trải nghiệm thực tế.
- `[OBSERVED]`: Đã quan sát thấy gián tiếp qua ảnh screenshot giao diện, icon hoặc video tư liệu.
- `[PLANNED]`: Tính năng nằm trong định hướng phát triển/lộ trình của game gốc trước khi dừng dịch vụ.
- `[INFERRED]`: Suy đoán hợp lý từ các game mạng xã hội cùng thời (Happy Aquarium, Nông Trại Vui Vẻ...) để hoàn thiện luồng chơi.
- `[NEW DESIGN]`: Thiết kế mới hoàn toàn do nhóm phát triển tự đưa vào, không có trong bản gốc.
- `[UNKNOWN]`: Chưa đủ thông tin đối chiếu hoặc chưa rõ cơ chế gốc.

### 1.3. Nguyên tắc hành động
- **ACCURATE > COMPLETE:** Độ chính xác với triết lý game gốc quan trọng hơn số lượng tính năng.
- **CORE FOUNDATION > FEATURE COUNT:** Giữ vững nền tảng kiến trúc sạch (clean architecture), loại bỏ triệt để nợ kỹ thuật (technical debt) và UI/gameplay gượng ép.
- Phân loại hành động:
  - `KEEP AS FOUNDATION`: Giữ lại vì phù hợp kiến trúc nền tảng và lộ trình lâu dài.
  - `REMOVE`: Xóa bỏ hoàn toàn khỏi gameplay, UI, config và test do sai lệch trải nghiệm hoặc suy diễn không căn cứ.
  - `FREEZE / PROVISIONAL`: Đóng băng hoặc gắn nhãn "tạm thời/thử nghiệm" đối với các chỉ số cân bằng chưa được kiểm chứng.
  - `REFACTOR`: Điều chỉnh lại để phù hợp với kiến trúc và tương tác trong thế giới game.

---

## 2. BẢNG MA TRẬN RÀ SOÁT TÍNH NĂNG TOÀN DIỆN (FULL FEATURE AUDIT MATRIX)

| STT | Tên tính năng | Module / File liên quan | Phân loại bằng chứng | Đánh giá hiện trạng Phase 3 | Quyết định hành động | Rationale (Lý do chi tiết) |
|---|---|---|---|---|---|---|
| **1** | **Catch Fish / Mini-game Câu Cá** | `CatchFishScene.ts`<br>`CatchFishModal.vue`<br>`minigames.ts`<br>`MiniGameRewardService.ts`<br>`ShelfRack.vue` | `[NEW DESIGN]` | Chạy trong modal overlay 30s độc lập; cơ chế hồng tâm (reticle), combo, ủng rác, giới hạn 3 lượt/ngày + 50 xu mua thêm. Lệch hoàn toàn so với thế giới game. | **REMOVE** | Tài liệu gốc (Mục 39) khẳng định đây là `[NEW DESIGN]`, không có trong game gốc. Hồ nước ở bản gốc là kho thức ăn trung tâm của đảo (Food Storage), nơi chim nhảy vào ăn, không phải minigame câu cá arcade overlay. Gây loãng core loop và nợ giao diện. |
| **2** | **Nền tảng Mini-game & Reward Validation** | `MiniGameRewardService.ts`<br>`packages/types/src/index.ts` | `[INFERRED]` | Service kiểm tra tính hợp lệ của phiên chơi, chống hack/cheat client-side, tính toán phần thưởng an toàn. | **FREEZE / PROVISIONAL** | Dù gỡ bỏ Catch Fish cụ thể, nền tảng trừu tượng hóa minigame và xác thực phần thưởng (anti-cheat reward validation) có thể tái sử dụng cho các minigame nhanh tay tinh mắt tương lai (Phase 9). Đóng băng service hoặc thu gọn. |
| **3** | **Breeding / Phối giống (Hệ thống & Flow)** | `BreedingService.ts`<br>`breedingStore.ts`<br>`BreedingModal.vue`<br>`ShelfRack.vue` | `[PLANNED]` | Cho phép chọn 2 chim trưởng thành để ghép đôi, tốn chi phí và thời gian ấp/chờ, sinh ra trứng lai đưa vào túi đồ để ấp tiếp tại lò ấp (Hatchery). | **KEEP AS FOUNDATION** | Bản gốc Zing Me có định hướng phối giống tạo chim mới (Mục 31). Luồng tạo trứng lai -> túi đồ -> lò ấp là kiến trúc chuẩn, ăn khớp với hệ thống ấp trứng Phase 1 & 2. |
| **4** | **Thông số cân bằng Breeding (85/15, 30m, 200 xu, 1 gem)** | `packages/game-data/src/breeding.ts`<br>`BreedingService.ts` | `[NEW DESIGN]` | Tỷ lệ di truyền giống bố mẹ 85%/15%, tỷ lệ đột biến 10%, cooldown 30 phút, phí 200 xu + 1 gem. | **FREEZE / PROVISIONAL** | Tài liệu Mục 39 ghi rõ các con số này là giả định thiết kế mới (`[NEW DESIGN]`). Giữ trong config có chú thích rõ là thông số tạm thời (`PROVISIONAL`), không được coi là chân lý gốc. |
| **5** | **Genetics & Di truyền học (Hệ gen chim)** | `GeneticsService.ts`<br>`packages/game-data/src/traits.ts` | `[INFERRED]` / `[NEW DESIGN]` | Tính toán tính trạng hình thái (Appearance: color, pattern, beak) và tính cách (Personality: active, lazy, social...) truyền từ bố mẹ sang con. | **KEEP AS FOUNDATION** | Cung cấp nền tảng toán học thuần túy (`GeneticsService` là pure service), giúp game có chiều sâu thu thập và lai tạo theo đúng phong cách pet simulation. |
| **6** | **Penguin Progression (EXP & Cấp độ cá thể)** | `PenguinEntity.ts`<br>`SnowIslandScene.ts`<br>`StorageService.ts` | `[CONFIRMED]` | Mỗi chim cánh cụt có cấp độ cá thể riêng (Level 1-10), tích lũy EXP qua việc ăn uống, tương tác và chăm sóc; đạt ngưỡng EXP thì thăng cấp kèm hiệu ứng. | **KEEP AS FOUNDATION** | Xác thực 100% trong game gốc (Mục 5: "Penguin Level khác với Player Level, tăng qua ăn và chăm sóc"). Nền tảng cốt lõi của gameplay. |
| **7** | **Penguin Evolution / Tiến hóa (Tiền đề)** | `packages/types/src/index.ts`<br>`packages/game-data/src/` | `[CONFIRMED]` | Khung dữ liệu định nghĩa các giai đoạn: Baby (Sơ sinh) -> Adult (Trưởng thành) -> Evolved (Tiến hóa). | **KEEP AS FOUNDATION** | Game gốc có 3 giai đoạn ngoại hình và yêu cầu tiến hóa trước khi phối giống. Giữ trường dữ liệu chuẩn bị cho Phase sau. |
| **8** | **Penguin AI & Flocking (Nhu cầu, bầy đàn)** | `PenguinFSM.ts`<br>`PenguinEntity.ts`<br>`SnowIslandScene.ts` | `[CONFIRMED]` (Nhu cầu)<br>`[INFERRED]` (Flocking) | Chim có trạng thái đói, vui, buồn; tự động tìm kiếm thức ăn khi đói; di chuyển theo bầy đàn nhẹ nhàng, tương tác lẫn nhau khi lại gần. | **KEEP AS FOUNDATION** | Hệ thống trạng thái đói/vui và waddle ăn trong hồ là linh hồn của Cánh Cụt Vui Vẻ. Thuật toán flocking và tính cách giúp đảo tuyết sống động, tự nhiên. |
| **9** | **Save Migration V2 -> V3** | `StorageService.ts` | `[CONFIRMED]` (Kiến trúc) | Nâng cấp cấu trúc dữ liệu lưu trữ local an toàn, bổ sung canonical exp, level, traits, breeding slots mà không làm hỏng dữ liệu người chơi cũ. | **KEEP AS FOUNDATION** | Đảm bảo tính toàn vẹn dữ liệu người dùng, tính idempotent và khả năng tương thích ngược tuyệt đối. |
| **10** | **Dock Shelf UI (Nút "Câu Cá")** | `ShelfRack.vue`<br>`App.vue` | `[NEW DESIGN]` | Icon cần câu "Câu Cá" đặt trên thanh kệ công cụ phía dưới màn hình, mở modal mini-game. | **REMOVE** | Xóa hoàn toàn nút "Câu Cá" khỏi ShelfRack và gỡ bỏ route mở modal tương ứng. Trả lại không gian cho các tính năng chuẩn. |
| **11** | **Dock Shelf UI (Nút "Phối Giống")** | `ShelfRack.vue`<br>`App.vue` | `[PLANNED]` / `[OBSERVED]` | Icon phối giống trên thanh công cụ cho phép mở BreedingModal quản lý ghép đôi chim. | **KEEP AS FOUNDATION** | Giữ nút truy cập thuận tiện cho người chơi quản lý sinh sản đàn chim. |
| **12** | **Economy Tracking (Mini-game Plays/Day)** | `gameStore.ts` (`minigamePlays`) | `[NEW DESIGN]` | Lưu số lượt chơi minigame theo ngày, ngày chơi cuối, số lượt mua thêm. | **REMOVE** | Không còn gắn với mini-game cụ thể nào trong Phase 3, xóa bỏ trường state này để giữ store tinh gọn. |

---

## 3. PHÂN TÍCH CHUYÊN SÂU TỪNG PHẦN HỆ

### 3.1. Phân hệ Catch Fish (Câu Cá)
- **Đối chiếu lịch sử:**
  Trong game *Cánh Cụt Vui Vẻ* 2014 trên Zing Me, **Hồ Nước (Pond)** ở vị trí trung tâm hòn đảo đóng vai trò là **Kho Chứa Thức Ăn (Food Reservoir)**. Người chơi mua hoặc nhận thức ăn (thường có hiệu ứng máy bay trực thăng thả thức ăn xuống hồ), sau đó thức ăn được lưu trữ tại hồ nước. Khi chim cánh cụt bị đói (`hunger < 40`), AI của chim sẽ tự động đi lạch bạch (waddle) hoặc nhảy ùm xuống hồ để ăn và phục hồi độ no.
- **Vấn đề của Phase 3:**
  Phase 3 đã biến hồ nước thành một minigame độc lập bằng cách dựng một modal overlay full-screen (`CatchFishModal.vue`), nạp một Phaser sub-scene (`CatchFishScene.ts`), chạy đồng hồ đếm ngược 30 giây, cơ chế căn hồng tâm Perfect/Good/Miss, vật cản chiếc ủng, combo nhân điểm, và giới hạn 3 lượt/ngày. Cơ chế này được Mục 39 của tài liệu định nghĩa là `[NEW DESIGN]` (tự biên soạn), không hề tồn tại trong bản gốc.
  Hơn nữa, việc bật popup che kín hòn đảo tuyết phá vỡ hoàn toàn cảm giác "social simulation living world" của game.
- **Hành động:**
  - **Xóa bỏ hoàn toàn:** `CatchFishScene.ts`, `CatchFishModal.vue`, các unit test đi kèm (`CatchFishScene.test.ts`, `CatchFishModal.test.ts`).
  - **Xóa bỏ khỏi cấu hình game:** Gỡ đăng ký scene trong `PhaserConfig.ts`, gỡ sự kiện `minigame:*` trong `GameBridge.ts`, gỡ cấu hình `packages/game-data/src/minigames.ts`.
  - **Gỡ bỏ khỏi UI:** Xóa nút "Câu Cá" trong `ShelfRack.vue`, xóa modal minigame trong `App.vue`.

### 3.2. Phân hệ Breeding & Genetics (Phối giống & Di truyền)
- **Đối chiếu lịch sử:**
  Bản gốc Zing Me đã có thiết kế và kế hoạch ra mắt tính năng lai tạo chim cánh cụt mới từ hai chim bố mẹ nhằm mở khóa các chủng loài quý hiếm. Tuy nhiên, các công thức toán học chi tiết về tỷ lệ di truyền tính trạng (85/15), thời gian cooldown 30 phút, phí 200 xu + 1 gem chưa từng được công bố chính thức.
- **Đánh giá hiện trạng:**
  `GeneticsService` và `BreedingService` được viết dưới dạng pure TypeScript services, độc lập với Vue và Phaser, có unit test bao phủ 100%. Luồng phối giống:
  $$\text{Chim bố} + \text{Chim mẹ} \xrightarrow{\text{Breeding}} \text{Trứng lai} \xrightarrow{\text{Túi đồ}} \text{Lò ấp} \xrightarrow{\text{Ấp trứng}} \text{Chim con mới}$$
  Luồng này rất mạch lạc, tái sử dụng hoàn hảo hệ thống Lò ấp (Hatchery) và Túi đồ (Inventory) đã hoàn thiện từ Phase 1 và Phase 2.
- **Hành động:**
  - **Giữ lại nguyên vẹn nền tảng cốt lõi (KEEP AS FOUNDATION):** `BreedingService`, `GeneticsService`, `breedingStore`, `BreedingModal.vue`.
  - **Ghi chú rõ ràng (PROVISIONAL):** Đánh dấu trong mã nguồn và config rằng các hằng số kinh tế (200 xu, 1 gem, 30m cooldown) là thông số cân bằng tạm thời (`PROVISIONAL BALANCE`), có thể điều chỉnh khi hoàn thiện hệ thống kinh tế ở các phase sau.

### 3.3. Phân hệ Tiến trình chim cánh cụt (Penguin Progression: EXP & Level)
- **Đối chiếu lịch sử:**
  Xác thực 100% (`[CONFIRMED]`). Cánh Cụt Vui Vẻ bản gốc phân biệt rõ ràng giữa **Cấp độ người chơi (Player Level)** và **Cấp độ từng chú chim (Penguin Level)**. Chim được nuôi dưỡng qua việc cho ăn và chăm sóc sẽ tăng điểm kinh nghiệm, khi đầy bình EXP sẽ thăng cấp, mở khóa khả năng sinh sản hoặc tiến hóa ngoại hình.
- **Đánh giá hiện trạng:**
  Phase 3 đã gắn EXP vào `PenguinEntity`, tích hợp hàm `addExp()`, kiểm tra thăng cấp dựa trên bảng `PENGUIN_LEVEL_CONFIG`, và bắn sự kiện `PENGUIN_LEVEL_UP` kèm hiệu ứng visual. Đây là tính năng chuẩn xác và giá trị nhất của Phase 3.
- **Hành động:**
  - **KEEP AS FOUNDATION:** Giữ nguyên toàn bộ logic EXP, level up, event bus và migration tương ứng.

### 3.4. Phân hệ Trí tuệ nhân tạo (AI & Flocking)
- **Đối chiếu lịch sử:**
  Hành vi của chim trong bản gốc chủ yếu xoay quanh việc đi dạo tự do trên đảo, biểu thị cảm xúc (icon bong bóng trên đầu), và tự waddle đến hồ khi đói.
- **Đánh giá hiện trạng:**
  FSM (`PenguinFSM`) trong Phase 3 quản lý các trạng thái: `IDLE`, `WADDLE`, `EAT`, `SLEEP`, `PLAY`. Bổ sung tính cách (active, lazy, social) và thuật toán tránh né/tụ họp nhẹ nhàng (soft flocking) giúp đàn chim chuyển động sống động, không bị đè chồng hình lên nhau (overlapping).
- **Hành động:**
  - **KEEP AS FOUNDATION:** Giữ lại và tối ưu hóa hệ thống AI này.

---

## 4. KẾ HOẠCH DỌN DẸP & THỰC THI CHI TIẾT (ACTION & EXECUTION PLAN)

### 4.1. Danh sách file XÓA BỎ HOÀN TOÀN (Delete)
1. `apps/web/src/game/scenes/CatchFishScene.ts` (Phaser sub-scene của game câu cá overlay)
2. `apps/web/src/components/modals/CatchFishModal.vue` (Vue modal popup của câu cá)
3. `apps/web/src/game/scenes/__tests__/CatchFishScene.test.ts` (Unit test của scene câu cá)
4. `apps/web/src/components/modals/__tests__/CatchFishModal.test.ts` (Unit test của modal câu cá)
5. `apps/web/src/services/MiniGameRewardService.ts` & `apps/web/src/services/__tests__/MiniGameRewardService.test.ts` (Service tính thưởng riêng cho Catch Fish)
6. `packages/game-data/src/minigames.ts` (File config dành riêng cho Catch Fish)

### 4.2. Danh sách file CẦN ĐIỀU CHỈNH / DỌN DẸP (Refactor / Clean up)
1. `apps/web/src/game/PhaserConfig.ts`:
   - Gỡ bỏ import `CatchFishScene` và bỏ khỏi mảng `scenes: [SnowIslandScene]`.
2. `apps/web/src/game/bridge/GameBridge.ts`:
   - Gỡ bỏ các event câu cá `minigame:start`, `minigame:end`, `minigame:quit`.
3. `apps/web/src/components/dock/ShelfRack.vue` & `ShelfRack.test.ts`:
   - Gỡ bỏ nút "Câu Cá" (`id: 'minigame'`) khỏi danh sách `shelfItems`.
   - Giữ lại nút "Phối Giống" (`id: 'breeding'`).
   - Cập nhật test case kiểm tra nút trên ShelfRack.
4. `apps/web/src/App.vue`:
   - Gỡ bỏ import `CatchFishModal`.
   - Gỡ bỏ `<CatchFishModal v-if="activeModal === 'minigame'" />`.
5. `apps/web/src/stores/gameStore.ts` & `gameStore.test.ts`:
   - Gỡ bỏ state `minigamePlays`, action `recordMiniGamePlay`, và type tương ứng.
6. `packages/game-data/src/index.ts`:
   - Bỏ export `minigames.ts`.
7. `packages/types/src/index.ts` & `types.test.ts`:
   - Gỡ bỏ các interface dư thừa của Catch Fish (`MiniGameTarget`, `MiniGameConfig`, `CatchFishResult`, v.v.).
8. `apps/web/src/__tests__/EconomySimulation.test.ts`:
   - Gỡ bỏ test case mô phỏng thưởng từ Catch Fish.

### 4.3. Tiêu chí thành công sau dọn dẹp (Verification Criteria)
- **100% Tests Pass:** Chạy `npx vitest run` thành công không có bất kỳ test suite nào fail.
- **Zero TypeScript Errors:** Chạy `npx vue-tsc --noEmit` hoặc `npm run build` không có lỗi cú pháp/type nào.
- **No Orphaned Dependencies:** Không còn mã rác hoặc import chết nào liên quan đến Catch Fish.
- **Preserved Core Loops:** Toàn bộ tính năng Nuôi chim, EXP cá thể, Di truyền, Phối giống, Trứng, Túi đồ, Lưu trữ V3 hoạt động hoàn hảo.

---

*(Báo cáo được đính kèm vào kho tài liệu dự án trước khi thực hiện bước dọn dẹp mã nguồn)*
