# Manabi — web tự học JLPT

Bản beta dành cho nhiều học viên tự học N5–N1. Giao diện hiện có một câu hỏi mẫu cho mỗi cấp, giải thích đáp án, lưu lịch sử làm bài và thống kê XP/chuỗi ngày khi đăng nhập. Học viên có thể tải tài liệu riêng tư lên, tạo bản nháp bài học bằng Gemini, tự kiểm tra/chỉnh sửa, rồi chọn riêng tư, chia sẻ qua liên kết hoặc gửi duyệt công khai. Quản trị viên được cấu hình qua `ADMIN_EMAILS`.

## Chạy tại máy

Yêu cầu Node.js 22.13 trở lên. Chạy `npm ci`, `npm run dev`. Web mở tại `http://localhost:5173`. Bản xem trước dùng cơ sở dữ liệu D1 và kho R2 mô phỏng trong `.wrangler/state`. Sau khi đổi `db/schema.ts`, chạy `npm run db:generate`, kiểm tra SQL mới và áp dụng migration theo thứ tự bằng Wrangler. Build bằng `npm run build`.

## Cấu hình bản hosted

`.openai/hosting.json` khai báo D1 và R2. Các giá trị runtime được quản lý trong Sites, không ghi khóa bí mật vào mã nguồn:

| Biến | Ý nghĩa |
| --- | --- |
| `ADMIN_EMAILS` | Danh sách email được duyệt nội dung, phân cách bằng dấu phẩy. |
| `SUPABASE_URL` | URL dự án Supabase dùng cho đăng ký/đăng nhập email. |
| `SUPABASE_PUBLISHABLE_KEY` | Khóa publishable của cùng dự án Supabase. |
| `GEMINI_API_KEY` | Khóa Gemini, lưu dưới dạng secret. |

ChatGPT sign-in do Sites cung cấp; bản portable tại máy chỉ mô phỏng tài khoản để kiểm thử. Đăng nhập email chỉ hiển thị khi cả hai biến Supabase được cấu hình. Nút tạo bài bằng AI chỉ bật khi có `GEMINI_API_KEY`. Mỗi tài khoản được tối đa 3 lượt tạo thành công/ngày theo giờ Việt Nam; tài liệu chỉ được gửi tới Gemini sau khi học viên đồng ý. Khi dùng gói Gemini miễn phí, giao diện thông báo nội dung gửi đi có thể được Google dùng để cải thiện dịch vụ.

Đây là bản beta, chưa phải ngân hàng đề JLPT đầy đủ. Cần tiếp tục bổ sung bài học và đề luyện các kỹ năng, kế hoạch học cá nhân và kiểm thử với tài khoản thật trước khi mở rộng công khai.
