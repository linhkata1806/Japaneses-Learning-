# Manabi — web tự học JLPT

Bản beta dành cho nhiều học viên tự học JLPT. Giao diện hiện có một câu hỏi N5 **tự biên soạn để thử luồng**, không lấy từ đề JLPT hoặc tài liệu công khai. N4–N1 đang khóa ở giao diện và API; theo đặc tả, từng cấp chỉ được mở sau khi hoàn thành lộ trình bắt buộc và đỗ đề cuối cấp trước đó bằng **điểm ước tính** theo ngưỡng tổng/từng phần. Bản beta chưa có đủ lộ trình và đề cuối cấp, nên hiện chưa thể mở N4. Ví dụ đọc thêm lấy từ Tatoeba API, kèm tác giả/giấy phép/liên kết gốc; chưa dùng API làm ngân hàng đề. Xem `/sources`.

Bài mẫu có giải thích đáp án, lưu lịch sử làm bài và thống kê XP/chuỗi ngày khi đăng nhập. Luồng tải tài liệu riêng tư và tạo bài học từ tệp hiện tạm dừng; bản ghi tài liệu và bản nháp đã có vẫn được giữ trong D1. Quản trị viên được cấu hình qua `ADMIN_EMAILS`.

## Chạy tại máy

Yêu cầu Node.js 22.13 trở lên. Chạy `npm ci`, `npm run dev`. Web mở tại `http://localhost:5173`. Bản xem trước dùng cơ sở dữ liệu D1 mô phỏng trong `.wrangler/state`; tải tệp hiện tạm dừng. Sau khi đổi `db/schema.ts`, chạy `npm run db:generate`, kiểm tra SQL mới và áp dụng migration theo thứ tự bằng Wrangler. Build bằng `npm run build`.

## Cấu hình bản hosted

`.openai/hosting.json` chỉ khai báo D1. Các route và cấu trúc dữ liệu tài liệu vẫn được giữ, nhưng thao tác với tệp trả thông báo tạm dừng cho tới khi có phương án lưu trữ phù hợp. Cấu hình biến runtime và secret trong Cloudflare Workers, không ghi khóa bí mật vào mã nguồn:

| Biến | Ý nghĩa |
| --- | --- |
| `ADMIN_EMAILS` | Danh sách email được duyệt nội dung, phân cách bằng dấu phẩy. |
| `GOOGLE_CLIENT_ID` | OAuth client ID của ứng dụng web trong Google Cloud. |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret, lưu dưới dạng Cloudflare secret; không đưa vào mã phía trình duyệt. |
| `APP_URL` | URL gốc của ứng dụng; production: `https://japaneses-learning.linhkata06.workers.dev`. Khi chạy local, dùng `http://localhost:5173`. |
| `GEMINI_API_KEY` | Khóa Gemini, lưu dưới dạng secret. |

Các bản ghi tài liệu trong D1 giữ nguyên `storage_key`. Không có tệp nào được di chuyển hay xóa bởi thay đổi này.

ChatGPT sign-in do Sites cung cấp; bản portable tại máy chỉ mô phỏng tài khoản để kiểm thử. Đăng nhập Google dùng OAuth phía server và cần cả ba biến Google/App URL cùng D1. Trong Google Cloud, tạo OAuth client loại **Web application** và thêm redirect URI chính xác: `https://japaneses-learning.linhkata06.workers.dev/api/auth/google/callback`. Trước khi bật Google login trên production, áp dụng migration `drizzle/0004_previous_lucky_pierre.sql` cho D1; nút Google chỉ bật khi bảng phiên này tồn tại và đủ cấu hình. Khi thử local, thêm `http://localhost:5173/api/auth/google/callback` vào OAuth client và đặt `APP_URL=http://localhost:5173`. Nút tạo bài từ tệp bằng AI đang tạm tắt cùng chức năng tải tệp. Khi bật lại, mỗi tài khoản được tối đa 3 lượt tạo thành công/ngày theo giờ Việt Nam; tài liệu chỉ được gửi tới Gemini sau khi học viên đồng ý. Khi dùng gói Gemini miễn phí, giao diện thông báo nội dung gửi đi có thể được Google dùng để cải thiện dịch vụ.

Hai cách đăng nhập có cùng email đã xác minh dùng chung một tiến độ. Google được nhận diện bằng mã `sub` ổn định, ghi trong `account_identities`; phiên ứng dụng có token ngẫu nhiên được băm trước khi lưu vào D1. Danh tính nhà cung cấp được ghi riêng để tiến độ không đổi khi học viên đổi email về sau.

Đây là bản beta, chưa phải ngân hàng đề JLPT đầy đủ. Nguồn dữ liệu cộng đồng OpenJLPT có thể hỗ trợ xây từ vựng/kanji/ngữ pháp N5–N1, nhưng cần kiểm tra từng mục, dịch tiếng Việt và tuân thủ CC BY-SA trước khi nhập kho. Cần tiếp tục bổ sung bài học và đề luyện các kỹ năng, kế hoạch học cá nhân, logic mở cấp khi có đủ nội dung, và kiểm thử với tài khoản thật trước khi mở rộng công khai.
