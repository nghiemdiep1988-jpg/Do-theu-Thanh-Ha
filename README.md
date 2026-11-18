# Đồ thêu Thanh Hà — Website Thương mại Điện tử & Hệ thống AI Quản trị

Website bán hàng thủ công mỹ nghệ truyền thống Việt Nam kết hợp hiện đại, tích hợp **Gemini AI** ở phía máy chủ và hỗ trợ xuất bản tự động lên **GitHub Pages**.

---

## 1. Tải toàn bộ mã nguồn (.ZIP)
Khi đang chạy máy chủ nội bộ hoặc trên AI Studio:
- Mở mục **Quản trị** hoặc **Hướng dẫn** trên thanh điều hướng và nhấn **Tải toàn bộ mã nguồn (.ZIP)** (tương ứng endpoint `/api/export-source-zip`).
- Giải nén tệp `do-theu-thanh-ha-source.zip` để có đầy đủ HTML, CSS, TypeScript/JavaScript, hình ảnh, workflow GitHub Actions và máy chủ Express.

---

## 2. Chạy trên máy cá nhân (Local)
```bash
npm install
cp .env.example .env
# Điền GEMINI_API_KEY=... vào tệp .env
npm run dev
```
Mở trình duyệt tại `http://localhost:3000`.

---

## 3. Triển khai tự động lên GitHub Pages + Backend AI miễn phí

### Bước A — Triển khai Frontend tĩnh lên GitHub Pages
1. Chép ảnh sản phẩm thật vào `/public/images/products/` (đường dẫn ảnh dùng dạng `/images/products/ten-anh.jpg`).
2. Nếu cập nhật danh mục tĩnh, vào mục **Quản trị → Xuất JSON (GitHub Pages)** và lưu thành `public/data/products.json`.
3. Đẩy mã nguồn lên GitHub (nhánh `main`).
4. Trong repository GitHub, vào **Settings → Pages → Source**, chọn **GitHub Actions**.
5. Quy trình `.github/workflows/deploy-pages.yml` sẽ tự động build bản tĩnh và xuất bản website lên GitHub Pages.

### Bước B — Kết nối Backend AI miễn phí (để bảo vệ GEMINI_API_KEY)
GitHub Pages chỉ phục vụ tệp tĩnh. Để AI Chatbot và AI Phân loại ảnh hoạt động trực tiếp trên trang GitHub Pages:
1. Triển khai mã nguồn này lên gói miễn phí của **Render** hoặc **Railway**:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Biến môi trường: `GEMINI_API_KEY=<khóa của bạn>`, `NODE_ENV=production`
2. Trong repository GitHub, vào **Settings → Secrets and variables → Actions → Variables**, thêm biến:
   - `VITE_API_BASE_URL` = URL máy chủ Backend (ví dụ `https://do-theu-thanh-ha.onrender.com`)
3. Chạy lại workflow GitHub Pages để giao diện tĩnh kết nối tới Backend AI (CORS cho `*.github.io` đã được bật sẵn trong `server.ts`).

---

## 4. Cấu trúc dữ liệu & Bổ sung sản phẩm
- `/public/images/products/` — Ảnh tĩnh đi kèm bản build GitHub Pages.
- `/public/data/products.json` — Kho sản phẩm tĩnh dự phòng cho GitHub Pages.
- `/uploads/products/` — Ảnh tải lên trực tiếp từ bảng Quản trị (tối đa 50 ảnh/lượt).
- `/data/products.json` — Cơ sở dữ liệu sản phẩm động trên máy chủ Express (mặc định trống `[]`).
