import { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';

export type ActivePage = 'storefront' | 'admin' | 'guide';

interface NavbarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage, sectionId?: string) => void;
  cartCount: number;
  onOpenCart: () => void;
}

export function Navbar({ activePage, onNavigate, cartCount, onOpenCart }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLinkClick = (page: ActivePage, sectionId?: string) => {
    setMobileOpen(false);
    onNavigate(page, sectionId);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF6EE]/95 backdrop-blur-sm border-b border-[#E2D8C5]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => handleLinkClick('storefront', 'hero')}
          className="font-serif text-2xl font-semibold tracking-tight text-[#131B2E] hover:text-[#7A1C24] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Đồ thêu Thanh Hà
        </button>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#465066]">
          <button
            type="button"
            onClick={() => handleLinkClick('storefront', 'hero')}
            className={`whitespace-nowrap shrink-0 py-1 border-b transition-colors cursor-pointer ${
              activePage === 'storefront'
                ? 'text-[#131B2E] border-[#7A1C24]'
                : 'border-transparent hover:text-[#131B2E] hover:border-[#7A1C24]/40'
            }`}
          >
            Trang chủ
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('storefront', 'san-pham')}
            className="whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:text-[#131B2E] hover:border-[#7A1C24]/40 transition-colors cursor-pointer"
          >
            Sản phẩm
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('storefront', 'cau-chuyen')}
            className="whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:text-[#131B2E] hover:border-[#7A1C24]/40 transition-colors cursor-pointer"
          >
            Câu chuyện
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('admin')}
            className={`whitespace-nowrap shrink-0 py-1 border-b transition-colors cursor-pointer ${
              activePage === 'admin'
                ? 'text-[#7A1C24] font-semibold border-[#7A1C24]'
                : 'border-transparent hover:text-[#131B2E] hover:border-[#7A1C24]/40'
            }`}
          >
            Quản trị
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('guide')}
            className={`whitespace-nowrap shrink-0 py-1 border-b transition-colors cursor-pointer ${
              activePage === 'guide'
                ? 'text-[#7A1C24] font-semibold border-[#7A1C24]'
                : 'border-transparent hover:text-[#131B2E] hover:border-[#7A1C24]/40'
            }`}
          >
            Hướng dẫn
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#7A1C24] text-[#FAF6EE] rounded-md hover:bg-[#5C1319] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" strokeWidth={1.75} />
            <span>Giỏ hàng</span>
            <span className="tabular-nums">({cartCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
            className="md:hidden p-2 text-[#131B2E] hover:bg-[#F3ECE0] rounded-md transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#FAF6EE] border-t border-[#E2D8C5] px-4 py-3 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => handleLinkClick('storefront', 'hero')}
            className="text-left px-3 py-2.5 text-sm font-medium text-[#131B2E] hover:bg-[#F3ECE0] rounded-md"
          >
            Trang chủ
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('storefront', 'san-pham')}
            className="text-left px-3 py-2.5 text-sm font-medium text-[#131B2E] hover:bg-[#F3ECE0] rounded-md"
          >
            Sản phẩm
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('storefront', 'cau-chuyen')}
            className="text-left px-3 py-2.5 text-sm font-medium text-[#131B2E] hover:bg-[#F3ECE0] rounded-md"
          >
            Câu chuyện nghề thêu
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('admin')}
            className="text-left px-3 py-2.5 text-sm font-medium text-[#7A1C24] hover:bg-[#F3ECE0] rounded-md"
          >
            Quản trị & AI Phân loại
          </button>
          <button
            type="button"
            onClick={() => handleLinkClick('guide')}
            className="text-left px-3 py-2.5 text-sm font-medium text-[#131B2E] hover:bg-[#F3ECE0] rounded-md"
          >
            Hướng dẫn dữ liệu & Triển khai
          </button>
        </div>
      )}
    </header>
  );
}
