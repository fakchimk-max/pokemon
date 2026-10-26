# Pokémon Team Builder

Frontend สำหรับเว็บ Pokémon เดิม พัฒนาด้วย React และ Vite โดยคงโครงหน้า สี class และข้อความจาก `public/index.html` ไว้ และใช้ข้อมูลจาก API ที่มีอยู่ในโปรเจกต์

## การทำงานของ React (ข้อ 3.1–3.3)

### Component และ Props

```text
App
├── Home active
│   ├── TeamPanel team / onRemove / onLoad
│   │   └── TeamSlots team / onLoad
│   ├── SelectedPokemonModal pokemon / onClose / onAdd
│   └── PokemonCard pokemon / onSelect / synergy
├── Pokedex active
├── Moves active / sub
│   ├── Recommendations active
│   ├── MoveList active
│   └── AbilityList active
└── Item active
```

`App` อ่านเส้นทางจาก URL hash และส่ง `active` หรือ `sub` ให้หน้าแต่ละหน้า หน้า Home ส่งข้อมูลทีมและ callback สำหรับเพิ่ม/ลบ/โหลดทีมไปยัง components ลูก ส่วนการ์ด Pokémon รับข้อมูลผ่าน `pokemon` และแจ้งการเลือกผ่าน `onSelect`

### useState

| Component | State ที่เก็บ |
|---|---|
| `App` | หน้าปัจจุบัน, เมนูท่าโจมตี, การแสดงปุ่มเลื่อนขึ้น |
| `Home` | รายการ Pokémon, ทีม, ตัวที่เลือก, ตัวกรอง, การเรียง, หน้า, สถานะโหลด/ข้อผิดพลาด |
| `TeamSlots` | ช่องทีมที่บันทึกไว้ใน localStorage |
| `Pokedex` | รายการ Pokémon, คำค้น, ธาตุ, Gen, หน้า, สถานะโหลด/ข้อผิดพลาด |
| `Recommendations` | รายชื่อ Pokémon, คำค้น, Pokémon ที่เลือก, ท่าแนะนำ, สถานะโหลด/ข้อผิดพลาด |
| `MoveList`, `AbilityList`, `Item` | รายการจาก API, หน้า, สถานะโหลด/ข้อผิดพลาด |

### useEffect

- `App` สมัครและถอด listener ของ URL hash, scroll และจัดการสถานะเมนู
- `Home`, `MoveList`, `AbilityList`, `Item` โหลดข้อมูลเมื่อหน้าหรือค่าที่เกี่ยวข้องเปลี่ยน พร้อมยกเลิกคำขอเดิมเมื่อ effect cleanup
- `Pokedex` ขอรายการ Pokémon ที่ค้นหาและกรองแล้วจาก Express จากนั้นโหลดรายละเอียด Pokémon และ species จาก PokéAPI เมื่อหน้า, คำค้น, ธาตุ, Gen หรือหน้าเปลี่ยน
- `Recommendations` โหลดตัวเลือก Pokémon และท่าแนะนำจาก API ตามการเลือก
- `SelectedPokemonModal` ซิงก์การเปิด/ปิด modal กับ class บน `body`

## DSA สำหรับการค้นหา

Express สร้าง `Map` เป็นดัชนีค้นหาจากรายชื่อ Pokémon ใน PokéAPI โดย map ชื่อย่อยทุกช่วงไปยัง Pokémon ที่มีข้อความนั้น เมื่อค้นหา เช่น `chu` จึงดึงผลที่ตรงกันจาก `Map` ได้ โดยยังคงพฤติกรรมค้นหาแบบข้อความอยู่ภายในชื่อ ไม่จำกัดเฉพาะ prefix การสร้างดัชนีทำครั้งแรกและเก็บ cache ไว้สำหรับคำค้นถัดไป

ถ้าชื่อ Pokémon ยาว `L` ตัว การสร้างดัชนีมี substring ได้ไม่เกิน `L(L + 1) / 2` ช่วง เวลาสร้างรวมจึงเป็น `O(ΣL²)` และใช้พื้นที่สูงสุด `O(ΣL²)` ตามจำนวน substring ที่ไม่ซ้ำ การค้นหาใน `Map` โดยทั่วไปเฉลี่ย `O(1)` และยังมีต้นทุน `O(k)` สำหรับผลลัพธ์ที่ตรงกัน `k` รายการ จากนั้น Express กรอง/แบ่งหน้า และโหลดรายละเอียดเฉพาะรายการในหน้าที่ร้องขอ การค้นหาครั้งแรกยังต้องโหลดรายชื่อจาก PokéAPI และการแสดงผลยังขึ้นกับเวลาตอบกลับของ API

ข้อมูลทีมเก็บใน array ฝั่ง Express เพื่อคงพฤติกรรมเพิ่ม ลบ ล้าง และโหลดทีมเดิม โดยไม่มีการใช้ Stack สำหรับ Undo/Redo

## เริ่มใช้งาน

เปิด backend และ frontend ใน terminal แยกกัน:

```powershell
npm --prefix backend start
npm --prefix frontend run dev
```

คำขอ API ที่ใช้ backend ส่งผ่าน Vite proxy ไปยัง `http://localhost:3000` ส่วนหน้า Pokédex ใช้ Express สำหรับค้นหา/กรองรายชื่อ และเรียก PokéAPI โดยตรงเพื่อโหลดรายละเอียด Pokémon กับคำอธิบายสายพันธุ์

ตรวจสอบโค้ดและ production build:

```powershell
npm --prefix frontend run lint
npm --prefix frontend run build
```
