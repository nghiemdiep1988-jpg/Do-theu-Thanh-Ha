import { PRODUCT_CATEGORIES, type ProductCategory } from '../types.ts';
import type { ActivePage } from './Navbar.tsx';

interface FooterProps {
  onSelectCategory: (category: ProductCategory) => void;
  onNavigate: (page: ActivePage, sectionId?: string) => void;
}

export function Footer({ onSelectCategory, onNavigate }: FooterProps) {
  return (
    <footer className="bg-[#131B2E] text-[#FAF6EE]/85 border-t border-[#FAF6EE]/10">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[#FAF6EE]/15">
          <div className="md:col-span-5">
            <p className="font-serif text-2xl font-semibold text-[#FAF6EE] mb-3">
              Đồ thêu Thanh Hà
            </p>
            <p className="text-sm text-[#FAF6EE]/70 leading-relaxed max-w-md">
              Thương hiệu đồ thêu thủ công truyền thống kết hợp hiện đại. Gìn giữ giá trị thủ công
              Việt qua từng chiếc khăn vuông, khăn trải bàn, túi vải, ví vải và khăn đặt ly.
            </p>
          </div>

          <div className="md:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#FAF6EE]/60 mb-3">
              Danh mục sản phẩm
            </p>
            <ul className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
              {PRODUCT_CATEGORIES.map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => onSelectCategory(cat)}
                    className="text-[#FAF6EE]/80 hover:text-[#FAF6EE] hover:underline underline-offset-4 text-left cursor-pointer"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#FAF6EE]/60 mb-3">
              Quản lý & Tài liệu
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
                  className="text-[#FAF6EE]/80 hover:text-[#FAF6EE] hover:underline underline-offset-4 cursor-pointer"
                >
                  Bảng quản trị sản phẩm
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('guide')}
                  className="text-[#FAF6EE]/80 hover:text-[#FAF6EE] hover:underline underline-offset-4 cursor-pointer"
                >
                  Hướng dẫn nhập dữ liệu & API
                </button>
              </li>
              <li className="text-[#FAF6EE]/65 pt-2">
                Giao hàng toàn quốc · Miễn phí vận chuyển cho đơn từ 1.000.000đ
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#FAF6EE]/60">
          <p>© {new Date().getFullYear()} Đồ thêu Thanh Hà. Bảo lưu mọi quyền.</p>
          <p>Dữ liệu sản phẩm được quản lý trực tiếp bởi quản trị viên cửa hàng.</p>
        </div>
      </div>
    </footer>
  );
}
