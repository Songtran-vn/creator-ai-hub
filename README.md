# Creator AI Hub

Web app tĩnh (HTML/CSS/JS) – lộ trình 60 ngày Creator AI, thi đua, vòng quay, Vườn Mây, trợ lý AI, nhóm, admin duyệt.

Demo admin: admin@demo.vn / admin123 (dữ liệu lưu localStorage).

Xem `TONG-HOP-TINH-NANG.md` cho bảng tổng hợp tính năng nguồn.

## Chế độ cloud (Supabase) + trang quản trị

- `index.html`: trang học viên. `admin.html`: trang quản trị (chỉ tài khoản role = admin).
- `config.js` để trống → chạy demo trên trình duyệt. Điền Supabase URL + anon key → dữ liệu dùng chung.

Cài đặt:
1. Tạo project trên supabase.com.
2. SQL Editor → dán `supabase/schema.sql` → Run. Email trong hàm `handle_new_user` tự thành admin.
3. Authentication → URL Configuration: Site URL = link Vercel.
4. Project Settings → API → chép Project URL + anon public key vào `config.js`, đẩy lên GitHub.
5. (Tuỳ chọn) Authentication → Providers → Google để bật đăng nhập Google.
