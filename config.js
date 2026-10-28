// Dán 2 giá trị từ Supabase → Project Settings → API vào đây.
// Để trống thì app chạy chế độ demo (dữ liệu lưu trên trình duyệt).
// anon key là khóa công khai, được phép để trong code front-end; quyền truy cập do RLS trong schema.sql kiểm soát.
window.APP_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: "",
};
window.CLOUD = !!(window.APP_CONFIG.supabaseUrl && window.APP_CONFIG.supabaseAnonKey);
