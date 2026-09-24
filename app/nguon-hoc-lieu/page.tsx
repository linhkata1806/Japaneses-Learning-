import Link from "next/link";

export default function SourcesPage() {
  return <main className="mx-auto max-w-3xl px-5 py-10 leading-7 md:py-16">
    <Link href="/" className="text-sm font-semibold text-study-link underline">← Về bài luyện</Link>
    <h1 className="mt-6 text-3xl font-bold">Nguồn học liệu và mức độ hoàn thiện</h1>
    <p className="mt-5">Câu hỏi điền động từ N5 trên trang chính do nhóm phát triển tự biên soạn để thử giao diện. Câu đó chưa lấy từ tài liệu công khai, chưa được giáo viên kiểm duyệt và không phải câu hỏi JLPT chính thức. Bản beta hiện chưa có lộ trình hoặc đề thi cuối cấp đủ để mở N4.</p>

    <section className="mt-8 rounded-2xl border border-border bg-white p-6">
      <h2 className="text-xl font-bold">Nguồn đang kết nối</h2>
      <p className="mt-2"><a className="font-semibold text-study-link underline" href="https://api.tatoeba.org/" target="_blank" rel="noreferrer">Tatoeba API</a> cung cấp câu ví dụ tiếng Nhật miễn phí qua API công khai. Bài N5 gọi API để hiển thị một vài ví dụ về 「飲みます」, kèm liên kết câu gốc, tên tác giả và giấy phép. Các ví dụ chỉ hỗ trợ đọc thêm; chúng không tự trở thành câu hỏi hoặc lời giải đã xác minh.</p>
    </section>

    <section className="mt-5 rounded-2xl border border-border bg-white p-6">
      <h2 className="text-xl font-bold">Nguồn đang đánh giá cho kho bài học</h2>
      <p className="mt-2"><a className="font-semibold text-study-link underline" href="https://github.com/evanclan/OpenJLPT" target="_blank" rel="noreferrer">OpenJLPT</a> có dữ liệu từ vựng, kanji và ngữ pháp N5–N1 dạng JSON/CSV/SQLite. Đây là dữ liệu cộng đồng, cấp JLPT mang tính tham khảo, nghĩa hiện chủ yếu là tiếng Anh và giấy phép CC BY-SA 4.0 yêu cầu ghi nguồn. Chúng tôi chưa nhập dữ liệu này vào bộ câu hỏi; cần rà soát tiếng Nhật, dịch tiếng Việt và quyền sử dụng trước khi xuất bản bài học.</p>
    </section>

    <section className="mt-5 rounded-2xl border border-border bg-white p-6">
      <h2 className="text-xl font-bold">Đối chiếu kỳ thi</h2>
      <p className="mt-2"><a className="font-semibold text-study-link underline" href="https://www.jlpt.jp/e/samples/sampleindex.html" target="_blank" rel="noreferrer">Đề mẫu JLPT chính thức</a> dùng để đối chiếu dạng câu và cấu trúc đề. Chúng tôi dẫn người học tới nguồn gốc và không chép nguyên câu hỏi/âm thanh vào web khi chưa có quyền tái sử dụng. JLPT cũng không công bố một danh sách từ vựng, kanji và ngữ pháp chính thức đầy đủ theo cấp.</p>
    </section>
  </main>;
}
