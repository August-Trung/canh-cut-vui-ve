# Cánh Cụt Vui Vẻ --- Game Design & Feature Specification v1

> **Mục đích:** Xây dựng một phiên bản Cánh Cụt mới dựa trên những gì có
> thể quan sát được từ tư liệu hiện có về game Cánh Cụt Vui Vẻ trên Zing
> Me, đồng thời mở rộng thành một game social-collection hiện đại.
>
> **Nguyên tắc:** Ưu tiên những hệ thống đã có bằng chứng từ
> screenshot/tư liệu gốc. Những cơ chế chưa xác minh sẽ được ghi rõ là
> **thiết kế mới**, không giả định đó là cơ chế lịch sử của game gốc.

------------------------------------------------------------------------

## 0. Trạng thái tài liệu

-   **Version:** 1.0
-   **Ngày:** 2026-09-29
-   **Phạm vi:** Game loop, island, penguin, egg, food, inventory,
    economy, shop, lucky spin, friends, visiting, stealing/helping,
    market/trading, achievements, events, pets, mail, giftcode,
    photography, progression và các hệ thống liên quan.
-   **Không phải:** bản sao source code/UI/asset của Zing Me.
-   **IP:** sử dụng nhân vật, tên loài, artwork, animation, âm thanh và
    dữ liệu mới; chỉ kế thừa triết lý gameplay và các hệ thống được
    nghiên cứu.

### Phân loại độ tin cậy

  -----------------------------------------------------------------------
  Ký hiệu                             Ý nghĩa
  ----------------------------------- -----------------------------------
  **\[CONFIRMED\]**                   Có thể quan sát hoặc có nguồn lịch
                                      sử trực tiếp

  **\[OBSERVED\]**                    Quan sát từ screenshot/video nhưng
                                      chưa biết toàn bộ logic phía sau

  **\[PLANNED\]**                     Được tư liệu lịch sử đề cập là tính
                                      năng được bổ sung/phát triển

  **\[INFERRED\]**                    Suy luận hợp lý từ tư liệu, chưa có
                                      bằng chứng đủ mạnh

  **\[NEW\]**                         Thiết kế mới của phiên bản
                                      remake/reimagined này
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 1. Tầm nhìn sản phẩm

## 1.1. Fantasy chính

Người chơi sở hữu một **hòn đảo băng nhỏ**, nơi nhiều chú cánh cụt sinh
sống.

Người chơi:

1.  chăm sóc cánh cụt;
2.  cung cấp thức ăn;
3.  thu thập trứng;
4.  mua/nhận cánh cụt mới;
5.  trang trí và nâng cấp đảo;
6.  xây dựng bộ sưu tập;
7.  ghé thăm bạn bè;
8.  giúp bạn bè hoặc thực hiện các tương tác xã hội;
9.  đưa hàng hóa đi bán;
10. tham gia vòng quay may mắn;
11. hoàn thành thành tựu;
12. tham gia event;
13. chụp và chia sẻ hình ảnh đảo;
14. về sau có thể phối giống, mini-game, giao dịch và mở rộng đảo.

## 1.2. Core loop

``` text
Đăng nhập
   ↓
Thu hoạch trứng / tài nguyên tích lũy khi offline
   ↓
Cho cánh cụt ăn
   ↓
Cánh cụt sinh hoạt trên đảo
   ↓
Thu thập trứng
   ↓
Mở túi / quản lý kho
   ↓
Bán / đưa hàng ra chợ / giữ lại / sử dụng
   ↓
Nhận Coins / Fish / Premium Currency / XP
   ↓
Mua cánh cụt / vật phẩm / nâng cấp
   ↓
Trang trí & nâng cấp đảo
   ↓
Thành tựu / event / lucky spin
   ↓
Thăm bạn bè / giúp đỡ / tương tác
   ↓
Quay lại sau một khoảng thời gian để tiếp tục thu hoạch
```

------------------------------------------------------------------------

# 2. Island --- Hòn đảo băng

## 2.1. Bản chất

**\[CONFIRMED/OBSERVED\]**

Screenshot cho thấy gameplay diễn ra trên một đảo băng với:

-   nền tuyết/băng;
-   hồ nước ở trung tâm;
-   nhiều cánh cụt;
-   vật phẩm/trứng nằm rải trên đảo;
-   công trình/đồ trang trí;
-   các điểm tương tác;
-   HUD phía trên;
-   thanh cánh cụt/bạn bè phía dưới;
-   các menu dạng panel phủ lên world.

## 2.2. Hồ băng

Hồ là landmark trung tâm của đảo.

### Chức năng

-   chứa lượng thức ăn cho cánh cụt;
-   cánh cụt tự tìm đến hồ khi đói;
-   thức ăn được thả vào hồ;
-   có animation thả thức ăn;
-   cánh cụt nhảy xuống hồ ăn;
-   sau khi ăn, độ no tăng theo loại thức ăn;
-   có thể trở thành điểm gameplay cho các mini-game trong tương lai.

### Hình thức

``` text
                🏔️
       🐧                 🐧

             ~~~~~~~~~
          ~    HỒ     ~
         ~   BĂNG/NƯỚC  ~
          ~            ~
             ~~~~~~~~~

       🐧                 🐧
```

### Cấp hồ

**\[NEW --- dựa trên ý tưởng từ tư liệu/screenshot\]**

  Cấp    Mục tiêu
  ------ --------------------------------
  Lv1    Hồ cơ bản
  Lv2    Tăng sức chứa thức ăn
  Lv3    Hiệu ứng nước đẹp hơn
  Lv4    Mở thêm khu vực hồ
  Lv5    Animation thả thức ăn nâng cấp
  Lv6+   Skin hồ / hiệu ứng đặc biệt

### Skin hồ

Có thể có:

-   Hồ băng cơ bản
-   Hồ Aurora
-   Hồ lễ hội Tết
-   Hồ Trung Thu
-   Hồ Noel
-   Hồ Halloween
-   Hồ Galaxy
-   Hồ Crystal

Skin không thay đổi logic gameplay.

------------------------------------------------------------------------

# 3. Penguin System

## 3.1. Số lượng cánh cụt

### Launch catalog đề xuất

**\[NEW --- cần điều chỉnh sau khi có thêm dữ liệu gốc\]**

  Nhóm                        Số loài
  ------------------------- ---------
  Common                            8
  Uncommon                          6
  Rare                              5
  Epic                              3
  Legendary                         2
  **Tổng permanent**           **24**
  Event/limited ban đầu             6
  **Tổng catalog launch**      **30**

Mục tiêu 30 loài giúp collection đủ sâu nhưng vẫn quản lý được
asset/content.

### Tăng trưởng catalog

-   Launch: 30
-   Sau 3 tháng: \~36
-   Sau 6 tháng: \~45
-   Sau 12 tháng: \~60
-   Event limited: bổ sung 2--4 loài/event lớn

Không nên tung quá nhiều loài cùng lúc.

------------------------------------------------------------------------

## 3.2. Rarity

``` text
Common
  ↓
Uncommon
  ↓
Rare
  ↓
Epic
  ↓
Legendary
  ↓
Mythic / Event Special
```

### Tỷ lệ catalog đề xuất

  Rarity        Permanent   Event/limited
  ----------- ----------- ---------------
  Common                8            0--1
  Uncommon              6               1
  Rare                  5            1--2
  Epic                  3            1--2
  Legendary             2               1
  Mythic                0            0--1
  **Tổng**         **24**           **6**

**Mythic không cần xuất hiện ngay ở launch nếu chưa có hệ thống event đủ
mạnh.**

------------------------------------------------------------------------

# 4. Penguin Instance

Một loài không đồng nghĩa với một con cánh cụt sở hữu.

``` text
PenguinSpecies
    ↓
OwnedPenguin
```

Mỗi `OwnedPenguin` có:

-   unique ID;
-   speciesId;
-   nickname;
-   level;
-   hunger;
-   happiness;
-   energy;
-   EXP;
-   creation time;
-   rarity;
-   personality;
-   cosmetic/effect;
-   source;
-   eventId nếu là event penguin;
-   lineage nếu có breeding.

------------------------------------------------------------------------

# 5. Penguin Progression — Level / Upgrade / Evolution / Breeding

Đây là **trục tiến triển riêng của từng con cánh cụt**, tách khỏi Player Level và Island Level.

```text
Cánh cụt mới
    ↓
Level
    ↓
Nâng cấp
    ↓
Đạt đủ điều kiện tiến hóa
    ↓
TIẾN HÓA
    ↓
Mở khóa khả năng phối giống
    ↓
Phối giống với cánh cụt đủ điều kiện
    ↓
Trứng / thế hệ mới
```

## 5.1. Penguin Level

**[CORE FEATURE]**

Mỗi `OwnedPenguin` có level riêng. Player Level không thay thế Penguin Level.

```text
Player Level: 20
├── Snowy #001 — Lv.5
├── Sleepy #002 — Lv.3
└── Rare Penguin #003 — Lv.8
```

Level có thể tăng thông qua chăm sóc, ăn uống, nhiệm vụ, mini-game, hoạt động trên đảo và phần thưởng/event.

**Exact level cap, EXP thresholds và tốc độ tăng level chưa được chốt.**

## 5.2. Nâng cấp cánh cụt

**[CORE FEATURE — cần xác minh chi tiết cơ chế gốc]**

Khi đạt các điều kiện cần thiết, người chơi có thể **nâng cấp** cánh cụt. Nâng cấp có thể tác động đến level/tiến trình, khả năng hoạt động, chỉ số chăm sóc, ngoại hình, hiệu ứng hoặc điều kiện mở khóa tính năng tiếp theo.

Không tự chốt công thức, nguyên liệu hoặc giá nâng cấp cho đến khi có bằng chứng rõ hơn.

## 5.3. Tiến hóa

**[CORE FEATURE — cần xác minh chi tiết cơ chế gốc]**

Tiến hóa là một mốc quan trọng trong vòng đời của cánh cụt. Một cánh cụt phải đạt đủ điều kiện trước khi tiến hóa. Điều kiện có thể bao gồm level, trạng thái/chỉ số, vật phẩm tiến hóa, chi phí hoặc điều kiện loài/rarity.

```text
OwnedPenguin
    ↓
Kiểm tra điều kiện
    ↓
Tiến hóa
    ↓
Cập nhật evolution stage / form / ngoại hình
    ↓
Mở khóa khả năng mới
```

`OwnedPenguin.id` nên được giữ nguyên sau tiến hóa nếu không có lý do thiết kế khác.

## 5.4. Phối giống chỉ sau khi tiến hóa

**[CORE RULE]**

Không cho phép mọi cánh cụt mới nhận quyền phối giống ngay lập tức. Luồng tiến triển là:

```text
Cánh cụt → Level → Nâng cấp → Tiến hóa → Đủ điều kiện phối giống
→ Chọn 2 cá thể → Phối giống → Trứng → Thu thập → Ấp/Nở → Thế hệ mới
```

## 5.5. Điều kiện phối giống

Hệ thống phải kiểm tra **cả hai cá thể** trước khi cho phối giống. Các điều kiện dự kiến:

- đã tiến hóa;
- đạt level/điều kiện tối thiểu;
- không đang ở trạng thái không thể phối;
- không đang được sử dụng cho hoạt động độc quyền khác;
- thỏa điều kiện loài/rarity nếu có;
- đủ tài nguyên nếu hệ thống yêu cầu.

**Exact level, chi phí, cooldown và tỷ lệ di truyền chưa được chốt.**

## 5.6. Data model

`OwnedPenguin` nên phản ánh rõ tiến trình này:

```ts
interface OwnedPenguin {
  id: string
  speciesId: string
  nickname?: string

  level: number
  experience: number

  // Evolution
  evolutionStage: number
  evolutionUnlocked: boolean

  // Breeding
  breedingUnlocked: boolean
  breedingCount: number
  lastBredAt?: number

  hunger: number
  happiness: number
  energy: number

  rarity: RarityTier
  personality: PenguinPersonality

  creationTime: number

  parentAId?: string
  parentBId?: string
  generation?: number
}
```

Không nên suy luận trạng thái tiến hóa/phối giống từ UI. Trạng thái phải được kiểm tra ở domain layer.

## 5.7. UI progression

Popup xem cánh cụt cần cho người chơi thấy rõ level, EXP, nâng cấp, tiến hóa và trạng thái phối giống. Nếu chưa đủ điều kiện, phải giải thích lý do như `Cần Lv. X`, `Chưa tiến hóa`, `Thiếu vật phẩm`, `Đang hồi sức`, `Đang phối giống`.

# 6. Penguin Behavior

## 5.1. Hoạt động tự động

Cánh cụt không đứng yên.

Các trạng thái:

``` text
IDLE
WADDLE
PLAY
SLEEP
HUNGRY
GO_TO_POND
EAT
RETURN
REACT
CELEBRATE
TALK
FOLLOW_PLAYER
```

### Khi đói

``` text
Hunger thấp
    ↓
Penguin phát hiện đói
    ↓
Chạy/waddle về hồ
    ↓
Nhảy xuống hồ
    ↓
Ăn
    ↓
Animation ăn
    ↓
Tăng Hunger
    ↓
Nhảy lên
    ↓
Tiếp tục hoạt động
```

------------------------------------------------------------------------

# 7. Food System --- Thức ăn

## 6.1. Hồ là kho thức ăn

Người chơi không nhất thiết cho từng con ăn thủ công.

Thay vào đó:

``` text
Inventory Food
      ↓
Thả vào hồ
      ↓
Food Storage trong hồ tăng
      ↓
Penguin đói tự đến ăn
```

Điều này tạo ra cảm giác **đảo đang tự vận hành**.

## 6.2. Food tiers

### Launch

  Food          Tier                Hiệu quả đề xuất
  ------------- ----------------- ------------------
  Cá nhỏ        Basic                     +10 Hunger
  Cá bạc        Basic+                           +15
  Cá hồi        Uncommon                         +25
  Cá vàng       Rare                             +40
  Cá băng       Rare                             +50
  Cá cầu vồng   Epic                             +70
  Cá Aurora     Legendary/Event                 +100

Các con số trên là **\[NEW\]**, không phải số liệu lịch sử.

## 6.3. Animation thả thức ăn

Người chơi chọn food:

``` text
Food
 ↓
Máy bay / phương tiện bay qua hồ
 ↓
Thả thức ăn
 ↓
Splash / particle
 ↓
Food Storage +N
```

**\[NEW\]** nhưng được xây dựng theo ý tưởng người dùng cung cấp.

### Upgrade visual

-   Lv1: máy bay đơn giản
-   Lv3: máy bay đẹp hơn
-   Lv5: hiệu ứng tuyết
-   Lv7: hiệu ứng Aurora
-   VIP/Special: máy bay/event skin

------------------------------------------------------------------------

# 8. Egg System --- Trứng

## 7.1. Nguyên tắc

**Trứng là item.**

Trứng được thu thập vào kho trước khi trở thành tài sản/cánh cụt.

``` text
Penguin production
       ↓
Egg appears
       ↓
Collection Station
       ↓
Player collects
       ↓
Inventory
```

## 7.2. Offline production

**\[NEW/CORE DESIGN\]**

Cánh cụt tiếp tục sản xuất trứng khi người chơi offline.

Khi đăng nhập:

``` text
lastOnline
   ↓
calculate elapsed time
   ↓
calculate pending eggs
   ↓
Collection Station
   ↓
Player collects
```

Không tạo trứng vô hạn.

### Giới hạn

Đề xuất:

-   Collection Station Lv1: 10 trứng
-   Lv2: 20
-   Lv3: 35
-   Lv4: 50
-   Lv5: 75
-   Lv6+: 100+

------------------------------------------------------------------------

# 9. Egg Catalog

Screenshot cho thấy nhiều item hình trứng với màu sắc/họa tiết khác
nhau. **Không được tự động kết luận mọi icon đó đều là egg type**; một
số có thể là item/event/resource.

### Catalog mới đề xuất

  Egg            Rarity      Pool
  -------------- ----------- -----------------
  Snow Egg       Common      Common
  Blue Ice Egg   Common      Common/Uncommon
  Speckled Egg   Common      Common
  Ocean Egg      Uncommon    Uncommon
  Aurora Egg     Rare        Rare
  Crystal Egg    Rare        Rare/Epic
  Golden Egg     Epic        Epic/Legendary
  Rainbow Egg    Legendary   Legendary
  Event Egg      Event       Event
  Ancient Egg    Limited     Special

### Số lượng launch

**9 egg types permanent + 1--2 event egg.**

Tức:

> **10--11 loại egg item ở launch.**

------------------------------------------------------------------------

# 10. Penguin ↔ Egg Mapping

Không nên thiết kế 1 egg = 1 penguin.

Thay vào đó:

``` text
Egg
 └── Drop Pool
      ├── Penguin A
      ├── Penguin B
      ├── Penguin C
      └── ...
```

Ví dụ:

### Snow Egg

``` text
Common Snowy     45%
Common Sleepy    30%
Common Shy       20%
Uncommon         5%
```

### Aurora Egg

``` text
Uncommon         50%
Rare             35%
Epic             12%
Special           3%
```

Các tỷ lệ là **\[NEW\]** và phải được data-driven.

------------------------------------------------------------------------

# 11. Penguin Acquisition

Một penguin có thể đến từ:

1.  **Shop**
2.  **Egg**
3.  **Lucky Spin**
4.  **Event**
5.  **Achievement**
6.  **Friend/Social reward**
7.  **Breeding**
8.  **Limited promotion**
9.  **Special quest**

Không để mọi penguin đều mua trực tiếp bằng currency.

------------------------------------------------------------------------

# 12. Shop

## 11.1. Penguin Shop

Screenshot cho thấy UI dạng collection/shop card với:

-   hình nhân vật;
-   tên;
-   rarity/star;
-   giá;
-   nhãn New;
-   nhãn Hot.

### Categories

``` text
Penguins
Eggs
Food
Decorations
Island Skins
Pond Skins
Boosters
Event
```

## 11.2. Shop penguin

Một số penguin:

-   mua bằng Coins;
-   mua bằng premium currency;
-   chỉ xuất hiện theo event;
-   chỉ unlock bằng achievement;
-   chỉ xuất hiện ở lucky spin.

------------------------------------------------------------------------

# 13. Lucky Spin --- Vòng quay may mắn

**\[OBSERVED\]**

Screenshot cho thấy rõ hệ thống:

-   vòng quay;
-   lượt quay;
-   x1;
-   x5;
-   x10;
-   mua lượt bằng currency;
-   nhiều phần thưởng xếp quanh vòng.

### Prize pool

Có thể chứa:

-   Coins
-   Fish
-   Premium currency
-   XP
-   Egg
-   Decoration
-   Pet
-   Penguin
-   Event item
-   Rare item

### Penguin trong Lucky Spin

**\[USER REQUIREMENT\]**

-   Có thể xuất hiện 1--2 penguin tùy vòng.
-   Penguin hiếm có xác suất thấp hơn.
-   Mỗi event có prize pool riêng.

### Không nên dùng

``` text
Math.random() trực tiếp
```

Phải dùng weighted RNG có seed/server authority trong production.

------------------------------------------------------------------------

# 14. Friends & Social

## 13.1. Bạn bè

Người chơi có:

-   friend list;
-   avatar;
-   level;
-   visit;
-   gift;
-   help;
-   social interaction.

## 13.2. Thăm nhà

``` text
Friend List
   ↓
Visit
   ↓
Load friend's island
```

Bạn bè vẫn có thể nhìn thấy:

-   island;
-   penguins;
-   decorations;
-   pond;
-   rare items;
-   event theme.

## 13.3. Giúp bạn

**\[USER REQUIREMENT\]**

Bạn bè có thể:

-   giúp cho ăn;
-   làm đầy một phần food storage;
-   hỗ trợ hoạt động nhất định;
-   nhận social reward.

Không được biến thành hành động bắt buộc hàng ngày.

## 13.4. Trộm trứng

**\[USER REQUIREMENT\]**

Bạn bè có thể có cơ chế "trộm trứng".

Cần thiết kế theo hướng social/fun:

-   giới hạn lượt;
-   có thông báo;
-   có bảo vệ;
-   không được khiến người chơi mất toàn bộ sản lượng;
-   có cooldown;
-   có anti-grief protection.

**\[NEW DESIGN\]**

------------------------------------------------------------------------

# 15. Market / Selling

## 14.1. Xe hàng

Screenshot cho thấy hệ thống **Xe Hàng** với:

-   các thùng hàng;
-   số lượng;
-   thời gian xe rời bến;
-   hàng hóa;
-   phần thưởng;
-   nút đóng/thực hiện.

### Flow

``` text
Inventory
   ↓
Chọn hàng
   ↓
Đóng thùng
   ↓
Xe Hàng
   ↓
Chờ timer
   ↓
Xe rời đảo
   ↓
Reward
```

## 14.2. Market

Screenshot còn cho thấy icon **MARKET**.

Market có thể là:

-   bán hàng;
-   mua hàng;
-   event market;
-   player trading.

------------------------------------------------------------------------

# 16. Trading

**\[PLANNED --- có cơ sở từ tư liệu lịch sử\]**

CGV Studio từng công bố kế hoạch bổ sung giao dịch/buôn bán.

### Player-to-player

Có thể giao dịch:

-   Egg
-   Food
-   Decoration
-   Event Item
-   Penguin (nếu game balance cho phép)

### Không cho trade

-   premium currency;
-   bound event reward;
-   achievement-only item;
-   một số item chống exploit.

------------------------------------------------------------------------

# 17. Inventory --- Túi đồ

Screenshot cho thấy inventory dạng grid.

## Categories

``` text
All
Egg
Food
Material
Decoration
Event
Special
```

Mỗi item:

-   icon;
-   count;
-   rarity;
-   tooltip;
-   source;
-   usable/tradable/sellable flag.

### Capacity

Inventory có capacity.

Ví dụ:

-   Lv1: 100
-   Lv5: 150
-   Lv10: 250
-   Lv20: 400
-   Upgrade bằng Coins / Premium.

------------------------------------------------------------------------

# 18. Collection

## 17.1. Penguin Collection

Theo dõi:

-   đã sở hữu;
-   chưa sở hữu;
-   rarity;
-   source;
-   achievement;
-   event.

### Progress

``` text
12 / 30
```

### Reward

Mốc:

-   5 species
-   10
-   15
-   20
-   25
-   30

Reward:

-   Coins
-   premium currency
-   egg
-   decoration
-   title
-   rare penguin.

------------------------------------------------------------------------

# 19. Achievement

**\[CONFIRMED/OBSERVED FROM USER RESEARCH\]**

Achievement không chỉ dành cho collection.

## Nhóm

### Collection

-   Thu thập 5 loài
-   Thu thập 10 loài
-   Thu thập toàn bộ catalog

### Island

-   nâng đảo lên Lv5
-   nâng hồ lên Lv5
-   sở hữu X decorations

### Penguin

-   chăm sóc X lần
-   nuôi X penguin
-   đạt level X

### Social

-   thăm X bạn
-   giúp X lần
-   nhận X quà

### Economy

-   bán X hàng
-   kiếm X Coins

### Event

-   hoàn thành event
-   thu thập event item

### Special

-   hidden achievements.

------------------------------------------------------------------------

# 20. Events & Festivals

## 19.1. Nguyên tắc

**\[USER REQUIREMENT\]**

Game phải có event theo các dịp ở Việt Nam.

Không biến event thành skin đổi màu đơn giản.

Event nên thay đổi:

-   island decoration;
-   background;
-   shop;
-   egg;
-   penguin;
-   quest;
-   reward;
-   mini-game;
-   lucky spin;
-   market.

## 19.2. Event duration

Các format:

-   3 ngày --- mini event
-   5 ngày --- short event
-   7 ngày --- weekly event
-   14 ngày --- major event
-   30 ngày --- seasonal event

## 19.3. Lịch event năm

### Tết Nguyên Đán

-   Penguin áo dài
-   lì xì
-   pháo hoa
-   hoa mai/hoa đào
-   egg Tết
-   island skin Tết

### Valentine

-   penguin couple
-   heart decoration
-   heart egg

### 8/3

-   event collection

### 30/4 -- 1/5

-   Việt Nam themed island

### Quốc tế Thiếu nhi

-   toy decorations
-   playful penguins

### Trung Thu

-   lồng đèn
-   bánh trung thu
-   moon island
-   moon egg

### Halloween

-   witch penguin
-   pumpkin
-   haunted pond

### 20/11

-   teacher-themed event

### Noel

-   Christmas island
-   Santa penguin
-   Christmas egg

------------------------------------------------------------------------

# 21. Mail

Hệ thống thư:

-   system mail;
-   reward mail;
-   event mail;
-   friend gift;
-   compensation;
-   maintenance compensation.

Mỗi mail:

``` text
sender
title
body
createdAt
expiresAt
attachments[]
claimed
```

------------------------------------------------------------------------

# 22. Giftcode

Có màn hình:

``` text
Nhập Giftcode
[_____________]

      [NHẬN]
```

Giftcode có:

-   code;
-   startAt;
-   endAt;
-   usageLimit;
-   perAccountLimit;
-   reward;
-   eventId;
-   active flag.

Production phải validate server-side.

------------------------------------------------------------------------

# 23. Pet trông nhà

**\[USER REQUIREMENT\]**

Đảo có pet/guardian.

Ví dụ:

-   chó tuyết;
-   hải cẩu;
-   gấu Bắc Cực;
-   cáo tuyết.

### Vai trò

Không nhất thiết chiến đấu.

Có thể:

-   trông nhà;
-   cảnh báo trộm;
-   hỗ trợ event;
-   tạo animation;
-   tăng một số bonus;
-   mở quest.

### Quan trọng

Pet là hệ thống phụ, không được làm lu mờ penguin.

------------------------------------------------------------------------

# 24. Photography

**\[OBSERVED\]**

Screenshot cho thấy chức năng **Chụp Ảnh**.

### Flow

``` text
Camera
 ↓
Frame island
 ↓
Add caption/sticker
 ↓
Save / Post
```

Có thể hỗ trợ:

-   chụp island;
-   chụp penguin;
-   event frame;
-   sticker;
-   caption;
-   hide UI;
-   save image.

------------------------------------------------------------------------

# 25. HUD

Screenshot cho thấy HUD dày nhưng rõ.

## Top bar

``` text
Player Level
Fish
Coins
Premium Currency
Snow/Ice/Event Currency
Camera
```

## Left side

-   player profile;
-   island status;
-   pet/guardian;
-   shortcut.

## Bottom

-   penguin/friend strip;
-   navigation;
-   inventory;
-   social.

## Right side

-   Market;
-   shop;
-   event;
-   lucky spin;
-   notifications.

------------------------------------------------------------------------

# 26. Economy

## 25.1. Currencies

### Fish

Dùng chủ yếu cho:

-   food;
-   pond;
-   penguin feeding.

### Coins

Dùng cho:

-   shop;
-   upgrades;
-   market;
-   decorations;
-   common penguins.

### Premium Currency

Dùng cho:

-   premium penguin;
-   lucky spin;
-   premium decoration;
-   instant timer;
-   special event.

### Event Currency

Tồn tại riêng theo event.

Không nên dùng chung currency với economy chính.

------------------------------------------------------------------------

# 27. Progression

## Player Level

Player XP đến từ:

-   feeding;
-   collecting;
-   selling;
-   quests;
-   achievements;
-   social;
-   events.

### Unlocks

Level có thể mở:

-   island area;
-   inventory capacity;
-   pond capacity;
-   collection station capacity;
-   shop items;
-   decorations;
-   lucky spin features;
-   pet features.

------------------------------------------------------------------------

# 28. Island Upgrade

## Các thành phần nâng cấp

``` text
Island Level
├── Pond
├── Egg Collection Station
├── Inventory
├── Decorations
├── Market
├── Pet
└── New Areas
```

### Upgrade effects

Không chỉ tăng số.

Nâng cấp phải thay đổi trực quan:

-   map;
-   snow;
-   pond;
-   bridge;
-   decorations;
-   effects;
-   ambient animation.

------------------------------------------------------------------------

# 29. Egg Collection Station

Đây là lớp trung gian quan trọng:

``` text
Penguins
   ↓
Egg production
   ↓
Collection Station
   ↓
[User collects]
   ↓
Inventory
```

### Vì sao cần station?

-   tránh item rơi vô hạn;
-   tạo điểm interaction;
-   tạo upgrade sink;
-   hỗ trợ offline production;
-   dễ hiển thị pending eggs.

------------------------------------------------------------------------

# 30. Penguin Production

Mỗi penguin có production interval.

Ví dụ **\[NEW\]**:

  Rarity        Egg interval
  ----------- --------------
  Common                  8h
  Uncommon               10h
  Rare                   12h
  Epic                   16h
  Legendary              24h

Không nhất thiết mọi penguin đều sinh cùng một loại egg.

Có thể:

``` text
Penguin Species
     ↓
Production Table
     ↓
Egg Pool
```

------------------------------------------------------------------------

# 31. Breeding

**\[PLANNED/CONFIRMED AS A FEATURE DIRECTION\]**

Tư liệu lịch sử xác nhận ý tưởng **lai tạo cánh cụt để tạo giống quý**.

### Phiên bản mới

``` text
Parent A
   +
Parent B
   ↓
Breeding
   ↓
Egg
   ↓
Incubation
   ↓
Penguin
```

Genetics hiện tại của project có thể giữ làm **thiết kế mới**, không
tuyên bố là công thức của bản gốc.

------------------------------------------------------------------------

# 32. Mini-games

**\[PLANNED/CONFIRMED AS FEATURE DIRECTION\]**

Tư liệu lịch sử đề cập mini-game kiểu **nhanh tay, tinh mắt**.

### Framework

``` text
MiniGame
├── Start
├── Active
├── Result
└── Reward
```

### Mini-game mới

1.  Fishing
2.  Catch Snowflake
3.  Snowball
4.  Memory
5.  Reflex
6.  Penguin Race

**Fishing không được gọi là mechanic gốc nếu chưa có bằng chứng trực
tiếp.**

------------------------------------------------------------------------

# 33. Quest System

## Daily

Ví dụ:

-   Cho ăn 3 lần
-   Thu hoạch 3 trứng
-   Bán 1 chuyến xe
-   Thăm 1 bạn
-   Chơi 1 mini-game

## Weekly

-   Thu thập 20 trứng
-   Bán 10 chuyến hàng
-   Hoàn thành 10 daily quests

## Event

Quest riêng theo event.

------------------------------------------------------------------------

# 34. Offline Progression

Game phải tính được:

``` text
lastOnline
currentTime
     ↓
elapsed
     ↓
egg production
food decay / needs
market timers
event timers
collection station
     ↓
offline summary
```

Khi login có thể hiển thị:

``` text
Chào mừng trở lại!

🥚 4 trứng đang chờ thu hoạch
🐟 Hồ còn 32 cá
💰 Xe hàng đã hoàn thành
🎁 Bạn nhận được 120 Coins
```

------------------------------------------------------------------------

# 35. Anti-exploit

Production:

-   server authoritative;
-   client không tự quyết định reward;
-   weighted RNG server-side;
-   cooldown server-side;
-   transaction atomic;
-   giftcode server-side;
-   trade server-side;
-   market server-side;
-   offline progress dùng timestamp server;
-   chống replay;
-   chống duplicate claim.

------------------------------------------------------------------------

# 36. Data Model cấp cao

``` text
Player
├── profile
├── currencies
├── level
├── inventory
├── achievements
├── quests
├── friends
├── mail
├── giftcodes
└── events

Island
├── level
├── pond
├── decorations
├── collectionStation
├── market
├── pet
└── visualSkin

Penguin
├── species
├── instance
├── level
├── needs
├── production
├── personality
├── traits
└── lineage

Egg
├── type
├── rarity
├── source
├── dropPool
├── eventId
└── metadata

Event
├── schedule
├── islandSkin
├── shop
├── quests
├── eggs
├── penguins
├── currency
├── luckySpin
└── rewards
```

------------------------------------------------------------------------

# 37. Launch Content Budget

## Penguin

**30 loài**

-   24 permanent
-   6 event/limited

## Egg

**10--11 loại**

-   9 permanent
-   1--2 event

## Food

**7 loại**

## Currencies

**4 loại**

-   Fish
-   Coins
-   Premium
-   Event

## Island skins

**4--6**

## Pets

**3--4**

## Permanent mini-games

**2--3**

## Event mini-games

**1--2/event**

## Event penguins

**2--4/event lớn**

------------------------------------------------------------------------

# 38. Ưu tiên phát triển

## P0 --- Core

1.  Island
2.  Penguin
3.  Pond
4.  Food
5.  Egg production
6.  Collection Station
7.  Inventory
8.  Player progression
9.  Shop
10. Basic economy

## P1 --- Social

11. Friends
12. Visit
13. Help
14. Gift
15. Mail
16. Photography

## P2 --- Collection

17. Penguin Collection
18. Egg Collection
19. Achievement
20. Lucky Spin

## P3 --- Commerce

21. Truck / Xe Hàng
22. Market
23. Trading

## P4 --- Content

24. Events
25. Festival
26. Event shop
27. Event quests
28. Limited penguins

## P5 --- Advanced

29. Breeding
30. Mini-games
31. Pet
32. Island expansion

------------------------------------------------------------------------

# 39. Những thứ KHÔNG được tự nhận là bản gốc

Các mechanic sau **chưa có bằng chứng đủ mạnh** và phải được coi là
thiết kế mới nếu triển khai:

-   Fishing cụ thể trong hồ
-   30 giây fishing
-   reticle Perfect/Good/Miss
-   combo fishing
-   3 lượt mini-game/ngày
-   50 Coins/lượt thêm
-   Genetics 85/15
-   Cross-breeding 42.5/42.5/15
-   trait mutation 10%
-   breeding cooldown 30 phút
-   breeding cost 200 Coins + 1 Gem
-   Exact Penguin Level cap / EXP thresholds / upgrade costs
-   exact egg drop percentages
-   exact production timers
-   exact hunger values
-   exact shop prices

------------------------------------------------------------------------

# 40. Nguyên tắc thiết kế hình ảnh

## Không làm

-   dashboard SaaS;
-   glassmorphism;
-   card UI hiện đại kiểu admin;
-   neon AI;
-   mobile idle-game bóng loáng;
-   emoji làm icon production;
-   gameplay bị nhốt trong modal.

## Nên làm

-   2D/2.5D cartoon;
-   màu sắc phong phú;
-   viền mềm;
-   panel gỗ/vải/giấy;
-   icon lớn;
-   typography vui nhộn;
-   animation rõ;
-   world chiếm phần lớn màn hình;
-   UI phủ lên world;
-   nhiều vật thể nhỏ tạo cảm giác "đảo đang sống".

Screenshot tham chiếu cho thấy world có mật độ nội dung cao: penguin,
egg/item, pond, decorations, market, pet và nhiều điểm tương tác cùng
tồn tại.

------------------------------------------------------------------------

# 41. Nguyên tắc gameplay

### 1. World-first

Người chơi luôn cảm thấy mình đang ở trên đảo.

### 2. Activity-first

Hoạt động xảy ra trên world càng nhiều càng tốt.

### 3. Collection-first

Penguin + egg + item + decoration tạo động lực quay lại.

### 4. Social-first

Bạn bè không chỉ là avatar list; họ có thể xuất hiện trên đảo, giúp đỡ
và tương tác.

### 5. Event-first

Event phải thay đổi thế giới và collection, không chỉ thêm một banner.

### 6. Offline-friendly

Đảo tiếp tục vận hành khi người chơi offline.

### 7. Data-driven

Penguin, egg, food, shop, event, quest đều phải nằm trong data/config.

------------------------------------------------------------------------

# 42. Quy tắc triển khai cho Antigravity

Trước khi code bất kỳ feature nào:

1.  Xác định feature thuộc **Confirmed / Observed / Planned / Inferred /
    New**.
2.  Không biến inference thành fact.
3.  Không hard-code balance.
4.  Không tạo fake feature chỉ để UI có nút.
5.  Gameplay phải có runtime behavior thật.
6.  UI phải phản ánh state thật.
7.  Reward phải có domain validation.
8.  Offline progress phải chống exploit.
9.  Event phải data-driven.
10. Mọi hệ thống lớn phải có unit/integration test.
11. Mỗi phase phải build + test trước khi chuyển phase.
12. Manual QA bắt buộc đối với animation, interaction và responsive UI.

------------------------------------------------------------------------

# 43. Roadmap đề xuất

``` text
Phase 0
Research + Original Game Facts
        ↓
Phase 1
Island + Penguin + Pond + Food
        ↓
Phase 2
Egg Production + Collection Station + Inventory
        ↓
Phase 3
Player Level + Shop + Economy
        ↓
Phase 4
Collection + Achievement + Lucky Spin
        ↓
Phase 5
Friends + Visit + Help + Gift + Mail
        ↓
Phase 6
Truck + Market + Trading
        ↓
Phase 7
Events + Festivals + Limited Content
        ↓
Phase 8
Breeding
        ↓
Phase 9
Mini-games
        ↓
Phase 10
Pets + Island Expansion + Advanced Social
```

------------------------------------------------------------------------

# 44. Kết luận

Phiên bản mới không cần cố trở thành bản sao pixel-perfect của Cánh Cụt
Vui Vẻ 2014.

Mục tiêu là tạo một **social penguin island game mới** có:

-   đảo băng sống động;
-   hồ trung tâm;
-   cánh cụt tự sinh hoạt;
-   thức ăn;
-   trứng;
-   collection;
-   shop;
-   lucky spin;
-   market;
-   xe hàng;
-   friends;
-   visit;
-   help;
-   stealing;
-   achievements;
-   photography;
-   mail;
-   giftcode;
-   pet;
-   events;
-   breeding;
-   mini-games;
-   island progression.

Trong đó:

> **Những gì có bằng chứng từ game gốc được ưu tiên. Những gì chưa biết
> được thiết kế mới nhưng phải được đánh dấu rõ.**

Đây là nền tảng để từ đây về sau không còn tình trạng "Antigravity tự
nghĩ ra một mechanic rồi chúng ta tưởng đó là game gốc".
