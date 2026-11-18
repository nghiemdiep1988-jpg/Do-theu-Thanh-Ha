import { ArrowRight } from 'lucide-react';
import heroEmbroideryImg from '../assets/images/hero_thanh_ha_embroidery_1794997225143.jpg';
import { ResilientImage } from './ResilientImage.tsx';

interface HeroSectionProps {
  publishedCount: number;
  onExploreProducts: () => void;
  onOpenStory: () => void;
  onOpenAdmin: () => void;
}

export function HeroSection({
  publishedCount,
  onExploreProducts,
  onOpenStory,
  onOpenAdmin,
}: HeroSectionProps) {
  return (
    <section id="hero" className="border-b border-[#E2D8C5] bg-[#FAF6EE]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#7A1C24] mb-4">
              Nghệ thuật thêu tay thủ công Việt Nam
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold leading-[1.12] text-[#131B2E] mb-6">
              Nếp vải quê hương, gửi trọn trong từng mũi chỉ Thanh Hà
            </h1>
            <p className="text-base sm:text-lg text-[#465066] leading-relaxed max-w-xl mb-8">
              Đồ thêu Thanh Hà gìn giữ tinh hoa thêu tay truyền thống trên nền vải linen, lụa tơ tằm và
              cotton tự nhiên. Mỗi chiếc khăn vuông, khăn trải bàn, túi vải hay ví nhỏ đều là một
              tác phẩm mộc mạc mà trang nhã cho đời sống đương đại.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onExploreProducts}
                className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#7A1C24] text-[#FAF6EE] text-sm font-medium rounded-md hover:bg-[#5C1319] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Khám phá sản phẩm</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onOpenStory}
                className="inline-flex items-center px-6 py-3 border border-[#131B2E]/25 text-[#131B2E] text-sm font-medium rounded-md hover:bg-[#F3ECE0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Câu chuyện nghề thêu
              </button>
              {publishedCount === 0 && (
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="text-sm font-medium text-[#7A1C24] underline underline-offset-4 hover:text-[#5C1319] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Thêm sản phẩm trong Quản trị
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[300px] sm:min-h-[380px] overflow-hidden rounded-lg border border-[#E2D8C5] bg-[#F3ECE0]">
              <ResilientImage
                src={heroEmbroideryImg}
                alt="Khung thêu tay truyền thống với họa tiết hoa sen đỏ đô và xanh đen trên nền vải linen kem của Đồ thêu Thanh Hà"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Full-width 4-column craft standards strip below hero split */}
        <div className="mt-12 pt-8 border-t border-[#E2D8C5] grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="font-serif text-xl font-semibold text-[#131B2E]">Chất liệu tự nhiên</p>
            <p className="text-sm text-[#465066] mt-1">
              Linen mộc, cotton thô và lụa tơ tằm an toàn, bền màu theo thời gian.
            </p>
          </div>
          <div>
            <p className="font-serif text-xl font-semibold text-[#131B2E]">Thêu tay thủ công</p>
            <p className="text-sm text-[#465066] mt-1">
              Từng đường kim mũi chỉ được chăm chút bởi nghệ nhân lành nghề.
            </p>
          </div>
          <div>
            <p className="font-serif text-xl font-semibold text-[#131B2E]">Thêu tên theo yêu cầu</p>
            <p className="text-sm text-[#465066] mt-1">
              Nhận cá nhân hóa chữ thêu riêng cho quà tặng và túi vải hằng ngày.
            </p>
          </div>
          <div>
            <p className="font-serif text-xl font-semibold text-[#131B2E]">Tư vấn chọn mẫu AI</p>
            <p className="text-sm text-[#465066] mt-1">
              Hỗ trợ tra cứu kích thước, chất liệu và gợi ý quà tặng từ kho thực tế.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
