const LESSON_TITLES = [
  ["Khởi tạo nhân vật Creator AI", "Đặt tên, ngoại hình và chân dung thương hiệu cho nhân vật AI"],
  ["Tạo ảnh AI ngay trên điện thoại", "Quy trình tạo ảnh sản phẩm mọi lúc mọi nơi"],
  ["Viết prompt như giao việc cho cộng sự", "Cấu trúc prompt: vai trò – bối cảnh – yêu cầu – định dạng"],
  ["Giọng nói AI cho nhân vật", "Nhân bản giọng nói để review sản phẩm"],
  ["Trợ lý ChatGPT riêng", "Cấu hình GPT tuỳ chỉnh cho công việc bán hàng"],
  ["Bộ công cụ AI miễn phí 2026", "10 công cụ chủ lực nên có"],
  ["Kiếm thu nhập tại nhà với AI", "10 kỹ năng bán hàng có thể bắt đầu ngay"],
  ["Trang BioLink bán hàng", "Gom sản phẩm và mạng xã hội vào một đường link"],
  ["Ghép nhân vật thành video bán hàng", "Thử nghiệm avatar nói chuyện giới thiệu sản phẩm"],
  ["Tăng sức ảnh hưởng cho nhân vật", "5 thủ thuật để nhân vật AI gần gũi như người thật"],
  ["Poster thương hiệu cá nhân", "Thiết kế không cần Photoshop"],
  ["Poster sản phẩm", "Bố cục bán hàng chuyên nghiệp"],
  ["Quản lý công việc với Notion", "Tài liệu và hướng dẫn khách hàng"],
  ["Trang bán hàng đầu tay bằng Vibe Coding", "Tạo web bằng AI trong 5 phút"],
  ["Mô hình hoá ý tưởng bằng bảng trắng", "Trình bày workflow cho đối tác"],
  ["Affiliate Marketing với AI", "Chọn con đường kiếm tiền phù hợp"],
  ["Lộ trình khởi nghiệp ít vốn", "7 việc tạo thu nhập ngay"],
  ["Kế hoạch 30 ngày hành động", "Thói quen mỗi ngày với AI"],
  ["Dự án online tại nhà", "3 mô hình thu nhập thêm"],
  ["5 bước tới đơn hàng đầu tiên", "Từ nội dung tới chốt đơn"],
  ["Tăng follow và thu hút khách", "Chiến lược nội dung 90 ngày"],
];
const LESSONS = Array.from({ length: 60 }, (_, i) => {
  const t = LESSON_TITLES[i] || [`Thực chiến nâng cao – phần ${i - 20}`, "Áp dụng, đo lường và tối ưu kết quả bán hàng"];
  return { day: i + 1, title: t[0], desc: t[1], phase: i < 21 ? "Nền tảng" : i < 40 ? "Tăng tốc" : "Bứt phá" };
});

const RANKS = [
  { name: "🌱 Người mới", min: 0 },
  { name: "💎 Chuyên nghiệp", min: 150 },
  { name: "⭐ Thành viên ưu tú", min: 400 },
  { name: "👑 Đại sứ", min: 800 },
];

const WHEEL = [
  { label: "1 xu", coins: 1, color: "#3b2f80" },
  { label: "5 xu", coins: 5, color: "#0e5566" },
  { label: "Giảm 15%", code: "SALE15", color: "#5b2a86" },
  { label: "10 xu", coins: 10, color: "#3b2f80" },
  { label: "Xu Tím", badge: "🟣 Đồng Xu Tím", color: "#0e5566" },
  { label: "15 xu", coins: 15, color: "#5b2a86" },
  { label: "Giảm 25%", code: "SALE25", color: "#3b2f80" },
  { label: "Xu Vàng", badge: "🟡 Đồng Xu Vàng", color: "#0e5566" },
];

const SEEDS = [
  { id: "fast", name: "Mầm nhanh", icon: "🌼", grow: 30, coins: 2 },
  { id: "mid", name: "Cây cảnh", icon: "🌷", grow: 120, coins: 6 },
  { id: "slow", name: "Cây vàng", icon: "🌻", grow: 300, coins: 15 },
];

const FAKE_USERS = ["Minh Anh", "Tuấn Kiệt", "Hồng Nhung", "Quốc Bảo", "Thảo Vy", "Gia Huy", "Lan Chi", "Đức Thịnh", "Ngọc Hân"];

const WHATS_NEW = [
  "Mùa 4 bắt đầu – mọi người đua lại từ 0 điểm",
  "Nhóm: tìm nhóm theo tên, chuyển quyền trưởng nhóm, giải tán nhóm",
  "Vườn Mây: 12 chậu, bắt sâu và bón phân",
  "Kết nối khoá học vào Claude / ChatGPT",
  "Vòng quay Báu Vật có huy hiệu hiếm",
];
