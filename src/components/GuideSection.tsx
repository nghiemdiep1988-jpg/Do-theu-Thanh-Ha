import { Archive, Download, FolderOpen, Github, Server, ShieldCheck, Sparkles } from 'lucide-react';
import { apiUrl } from '../utils/api.ts';
import { SAMPLE_CSV_TEMPLATE, SAMPLE_JSON_TEMPLATE } from '../utils/format.ts';

interface GuideSectionProps {
  onOpenAdmin: () => void;
}

export function GuideSection({ onOpenAdmin }: GuideSectionProps) {
  const downloadTemplate = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="py-12 lg:py-16 bg-[#FAF6EE]">
      <div className="max-w-[1040px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="border-b border-[#E2D8C5] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#7A1C24] mb-2">
              Tài liệu vận hành & Xuất bản
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#131B2E]">
              Tải mã nguồn (.ZIP) & Triển khai lên GitHub Pages
            </h1>
            <p className="text-sm sm:text-base text-[#465066] mt-3 leading-relaxed max-w-2xl">
              Toàn bộ mã nguồn (HTML, CSS, TypeScript/JavaScript, hình ảnh, workflow GitHub Actions
              và máy chủ Backend AI) được đóng gói sẵn để bạn tải về, chỉnh sửa và xuất bản miễn phí.
            </p>
          </div>

          <a
            href={apiUrl('/api/export-source-zip')}
            download="do-theu-thanh-ha-source.zip"
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#7A1C24] text-[#FAF6EE] text-sm font-medium rounded-md hover:bg-[#5C1319] transition-colors whitespace-nowrap shrink-0"
          >
            <Archive className="w-4 h-4" />
            <span>Tải toàn bộ mã nguồn (.ZIP)</span>
          </a>
        </div>

        {/* 1. GitHub Pages Step-by-step */}
        <div className="bg-white border border-[#E2D8C5] rounded-lg p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <Github className="w-5 h-5 text-[#7A1C24]" />
            <h2 className="font-serif text-2xl font-semibold text-[#131B2E]">
              1. Quy trình tải về & Triển khai tự động trên GitHub Pages
            </h2>
          </div>

          <ol className="space-y-3 text-sm text-[#465066] leading-relaxed list-decimal pl-5">
            <li>
              Nhấn nút <strong>Tải toàn bộ mã nguồn (.ZIP)</strong> ở trên để tải tệp{' '}
              <code className="font-mono text-xs bg-[#F3ECE0] px-1.5 py-0.5 rounded">
                do-theu-thanh-ha-source.zip
              </code>{' '}
              về máy tính và giải nén.
            </li>
            <li>
              Chạy thử trên máy cá nhân bằng lệnh{' '}
              <code className="font-mono text-xs bg-[#F3ECE0] px-1.5 py-0.5 rounded">
                npm install
              </code>{' '}
              rồi{' '}
              <code className="font-mono text-xs bg-[#F3ECE0] px-1.5 py-0.5 rounded">
                npm run dev
              </code>{' '}
              để chỉnh sửa giao diện, thêm ảnh thật vào{' '}
              <code className="font-mono text-xs bg-[#F3ECE0] px-1.5 py-0.5 rounded">
                public/images/products/
              </code>{' '}
              và duyệt sản phẩm trong mục <strong>Quản trị</strong>.
            </li>
            <li>
              Nếu cập nhật kho tĩnh cho GitHub Pages: bấm{' '}
              <strong>Xuất JSON (GitHub Pages)</strong> trong mục Quản trị và lưu vào tệp{' '}
              <code className="font-mono text-xs bg-[#F3ECE0] px-1.5 py-0.5 rounded">
                public/data/products.json
              </code>
              .
            </li>
            <li>
              Đẩy mã nguồn lên GitHub (nhánh <code className="font-mono text-xs">main</code>), sau
              đó vào <strong>Settings → Pages → Source</strong> chọn{' '}
              <strong>GitHub Actions</strong>. Quy trình có sẵn trong{' '}
              <code className="font-mono text-xs bg-[#F3ECE0] px-1.5 py-0.5 rounded">
                .github/workflows/deploy-pages.yml
              </code>{' '}
              sẽ tự động build và xuất bản website lên GitHub Pages.
            </li>
          </ol>
        </div>

        {/* 2. Image Structure */}
        <div className="bg-white border border-[#E2D8C5] rounded-lg p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-5 h-5 text-[#7A1C24]" />
            <h2 className="font-serif text-2xl font-semibold text-[#131B2E]">
              2. Cấu trúc thư mục ảnh & Nhập hàng trăm sản phẩm
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-[#465066] leading-relaxed">
            <div className="space-y-2">
              <p className="font-semibold text-[#131B2E]">Cách 1 — Tải nhiều ảnh trực tiếp</p>
              <p>
                Vào <strong>Quản trị → Tải nhiều ảnh & Thêm mới</strong>, chọn tối đa 50 ảnh/lượt.
                Ảnh lưu tại{' '}
                <code className="font-mono text-xs bg-[#F3ECE0] px-1.5 py-0.5 rounded">
                  /uploads/products/
                </code>{' '}
                và AI tự động phân loại vào danh sách chờ duyệt.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-[#131B2E]">Cách 2 — Đặt ảnh tĩnh cho GitHub Pages</p>
              <p>
                Chép ảnh vào{' '}
                <code className="font-mono text-xs bg-[#F3ECE0] px-1.5 py-0.5 rounded">
                  /public/images/products/
                </code>{' '}
                và điền đường dẫn{' '}
                <code className="font-mono text-xs bg-[#F3ECE0] px-1.5 py-0.5 rounded">
                  /images/products/ten-anh.jpg
                </code>{' '}
                trong file CSV/JSON nhập hàng loạt.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2D8C5] flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onOpenAdmin}
              className="px-4 py-2 text-sm font-medium bg-[#7A1C24] text-[#FAF6EE] rounded-md hover:bg-[#5C1319] cursor-pointer"
            >
              Mở Khu vực Quản trị
            </button>
            <button
              type="button"
              onClick={() =>
                downloadTemplate(
                  'mau-nhap-san-pham-thanh-ha.csv',
                  SAMPLE_CSV_TEMPLATE,
                  'text/csv;charset=utf-8;'
                )
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-[#E2D8C5] text-[#131B2E] rounded-md hover:bg-[#F3ECE0] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải mẫu CSV</span>
            </button>
            <button
              type="button"
              onClick={() =>
                downloadTemplate(
                  'mau-nhap-san-pham-thanh-ha.json',
                  SAMPLE_JSON_TEMPLATE,
                  'application/json;charset=utf-8;'
                )
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-[#E2D8C5] text-[#131B2E] rounded-md hover:bg-[#F3ECE0] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải mẫu JSON</span>
            </button>
          </div>
        </div>

        {/* 3. Server API & Hybrid Backend */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E2D8C5] rounded-lg p-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#7A1C24]" />
              <h2 className="font-serif text-xl font-semibold text-[#131B2E]">
                3. Bảo vệ khóa API ở máy chủ
              </h2>
            </div>
            <p className="text-sm text-[#465066] leading-relaxed">
              GitHub Pages chỉ phục vụ tệp tĩnh nên không lưu khóa bí mật. Toàn bộ lời gọi{' '}
              <code className="font-mono text-xs bg-[#F3ECE0] px-1.5 py-0.5 rounded">
                GEMINI_API_KEY
              </code>{' '}
              chỉ chạy trên máy chủ Express (<code className="font-mono text-xs">server/ai.ts</code>),
              tuyệt đối không xuất hiện trong mã nguồn trình duyệt.
            </p>
          </div>

          <div className="bg-white border border-[#E2D8C5] rounded-lg p-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <Server className="w-5 h-5 text-[#7A1C24]" />
              <h2 className="font-serif text-xl font-semibold text-[#131B2E]">
                4. Kết nối Backend AI miễn phí cho GitHub Pages
              </h2>
            </div>
            <p className="text-sm text-[#465066] leading-relaxed">
              Triển khai cùng mã nguồn này lên gói miễn phí của <strong>Render</strong> hoặc{' '}
              <strong>Railway</strong> (đặt biến <code className="font-mono text-xs">GEMINI_API_KEY</code>
              ), rồi thêm URL máy chủ đó vào biến{' '}
              <code className="font-mono text-xs bg-[#F3ECE0] px-1.5 py-0.5 rounded">
                VITE_API_BASE_URL
              </code>{' '}
              trong GitHub Repository Variables để AI Chatbot và Quản trị hoạt động trên GitHub Pages.
            </p>
          </div>
        </div>

        {/* 4. AI Grounding Guarantee */}
        <div className="bg-white border border-[#E2D8C5] rounded-lg p-6 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[#7A1C24] shrink-0 mt-0.5" />
          <div className="text-sm text-[#465066] leading-relaxed">
            <strong className="text-[#131B2E]">Cam kết dữ liệu thực tế:</strong> AI tư vấn chỉ
            sử dụng dữ liệu từ sản phẩm đã duyệt (<code className="font-mono text-xs">published</code>
            ), không tự bịa giá bán hay tồn kho. Khi chưa kết nối Backend AI, bản tĩnh trên GitHub
            Pages tự động đọc từ <code className="font-mono text-xs">public/data/products.json</code>.
          </div>
        </div>
      </div>
    </section>
  );
}
