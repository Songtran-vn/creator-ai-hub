# Bảng tổng hợp tính năng – kolaisystem2026.vercel.app

> Nguồn: khảo sát ngày 27/10/2026. Trang yêu cầu đăng nhập + admin duyệt nên dữ liệu được tổng hợp từ trang đăng nhập công khai và mã nguồn front-end (routes, tên module, chuỗi giao diện). Chưa xem trực tiếp giao diện bên trong.

**Công nghệ:** React SPA (Vite) · PWA (manifest + service worker) · Đăng nhập Google/email (kiểu Supabase) · Host Vercel.

## 1. Routes (trang)
| Route | Chức năng |
|---|---|
| `/auth` | Đăng nhập Google / email + mật khẩu, nhớ email, đăng ký |
| `/welcome` | Màn chào mừng / chờ duyệt |
| `/` | Trang chính (dashboard, khoá học, thi đua) |
| `/profile` | Hồ sơ cá nhân, huy hiệu, xu |
| `/ket-noi-ai` | Kết nối khoá học vào Claude / ChatGPT |
| `/admin` | Quản trị: duyệt tài khoản, nội dung |

## 2. Nhóm tính năng
| # | Nhóm | Tính năng | Module gốc |
|---|---|---|---|
| 1 | Tài khoản | Google login, email login, xác nhận email, admin duyệt, chặn đăng nhập 2 máy, "Nhớ email" | Auth, AccessReviewPanel |
| 2 | Khoá học | Lộ trình 60 ngày KOL AI (Ngày 1–21 có tên cụ thể), video bài học, nội dung chính, slide vuốt | useSeasonLessons |
| 3 | Giới hạn học | 3 lượt học/ngày, lượt làm lại bài tập/ngày, "Mật Lệnh Hôm Nay" mở khoá | FeatureUnlockDialog |
| 4 | Bài tập | Nộp bài (upload ảnh/video), xác nhận đã nộp, chia sẻ bài tập | useContributions |
| 5 | Zoom | Xem Zoom + slide theo mùa, đánh giá buổi Zoom | ZoomTheoMua, ZoomReviewsList, zoomLessons |
| 6 | Vibe Coding | Chuyên đề tạo App/Web bằng AI | VibeCodingSystem |
| 7 | Truyền Nhân | Cấp bậc: Người mới → Chuyên nghiệp → Thành viên ưu tú → Đại sứ KOL AI | TruyenNhanSystem |
| 8 | Thi đua mùa | Mùa 4 (đua lại từ 0), Lực chiến, đếm ngược 10 ngày, thể lệ thưởng hạng, đồng hồ giữ hạng | TopKolTheoMua, Mua4JoinCard, PodiumStarRing |
| 9 | Nhóm / Đội | Tạo nhóm, tìm nhóm theo tên, cấp Đội 1–10, xem điểm từng người, giải tán, chuyển trưởng nhóm | NetworkGroups |
| 10 | Gamification | Xu tích lũy, Vòng quay "Báu Vật" (xu, mã giảm 15/25%, huy hiệu hiếm) | SpinWheelPage, rewardAssets |
| 11 | Mini game | "Vườn Mây": 12 chậu, giống nhanh/chậm, bắt sâu bằng vợt, bón phân, chậu đặc biệt | VuonMayPage |
| 12 | AI | Trợ lý AI trong app, chọn ngành/ngách, bản đồ kiến thức | AIAssistant, IndustryNicheSelector, KnowledgeGraph |
| 13 | Kết nối AI | Cắm khoá học vào Claude/ChatGPT (MCP), ngắt từng kết nối | KetNoiAI |
| 14 | Dự án ra mắt | Showcase dự án: media, tiêu đề, mô tả, link, nội dung có mã, thứ tự hiển thị | (admin) |
| 15 | Tiện ích | Cẩm nang thi đua, Có gì mới, Thông báo, Báo lỗi, Nâng cấp, Nhóm VIP | NutCamNang, WhatsNewPanel, BaoLoiDialog |
| 16 | Admin | Duyệt tài khoản, quản lý bài học/dự án, dashboard | AdminDashboard |

## 3. Lộ trình bài học (Ngày 1–21)
1 Tạo KOL AI bán hàng · 2 KOL AI trên điện thoại · 3 Ra lệnh AI với Flow · 4 Giọng nói miễn phí · 5 ChatGPT · 6 Công cụ miễn phí 2026 · 7 Thu nhập tại nhà · 8 BioLink · 9 TopView AI · 10 Sức ảnh hưởng · 11 Thương hiệu cá nhân · 12 Thương hiệu sản phẩm · 13 Notion · 14 Vibe Coding · 15 Miro · 16 Affiliate · 17 Khởi nghiệp · 18 30 ngày hành động · 19 Dự án online · 20 Thu nhập đầu tiên · 21 Tăng follow.

## 4. Phần thưởng vòng quay
1 / 5 / 10 / 15 xu · Mã giảm 15% (30 ngày) · Mã giảm 25% (30 ngày) · Huy hiệu Đồng Xu Tím / Đồng Xu Vàng / Laptop Vàng / The Queen.
