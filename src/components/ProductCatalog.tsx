import { useMemo, useState } from 'react';
import { ArrowRight, FolderUp, Search, ShoppingBag } from 'lucide-react';
import { PRODUCT_CATEGORIES, type Product, type ProductCategory } from '../types.ts';
import { formatVND } from '../utils/format.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface ProductCatalogProps {
  products: Product[];
  loading: boolean;
  selectedCategory: 'Tất cả' | ProductCategory;
  onSelectCategory: (cat: 'Tất cả' | ProductCategory) => void;
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onOpenAdmin: () => void;
  onOpenGuide: () => void;
}

type SortOption = 'newest' | 'featured' | 'price-asc' | 'price-desc';

const PAGE_SIZE = 24;

export function ProductCatalog({
  products,
  loading,
  selectedCategory,
  onSelectCategory,
  onViewProduct,
  onAddToCart,
  onOpenAdmin,
  onOpenGuide,
}: ProductCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 'Tất cả': products.length };
    for (const cat of PRODUCT_CATEGORIES) {
      counts[cat] = 0;
    }
    for (const p of products) {
      counts[p.category] = (counts[p.category] ?? 0) + 1;
    }
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      if (selectedCategory !== 'Tất cả' && p.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        p.name,
        p.sku,
        p.category,
        p.material,
        p.pattern,
        p.style,
        p.usage,
        p.description,
        p.dimensions,
        ...p.colors,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    const sorted = [...list];
    if (sortBy === 'featured') {
      sorted.sort((a, b) => Number(b.featured) - Number(a.featured));
    } else if (sortBy === 'price-asc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      sorted.sort((a, b) => b.price - a.price);
    } else {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sorted;
  }, [products, selectedCategory, searchQuery, sortBy]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  return (
    <section id="san-pham" className="py-16 lg:py-20 bg-[#FAF6EE]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#7A1C24] mb-2">
              Bộ sưu tập sản phẩm
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#131B2E]">
              Sản phẩm thêu tay Thanh Hà
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-[#465066] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                placeholder="Tìm tên, họa tiết, chất liệu..."
                aria-label="Tìm kiếm sản phẩm"
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-[#E2D8C5] rounded-md text-[#131B2E] placeholder:text-[#465066]/65 focus:outline-none focus:border-[#7A1C24]"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sắp xếp sản phẩm"
              className="px-3.5 py-2 text-sm bg-white border border-[#E2D8C5] rounded-md text-[#131B2E] focus:outline-none focus:border-[#7A1C24] cursor-pointer"
            >
              <option value="featured">Nổi bật trước</option>
              <option value="newest">Mới nhất</option>
              <option value="price-asc">Giá thấp đến cao</option>
              <option value="price-desc">Giá cao đến thấp</option>
            </select>
          </div>
        </div>

        {/* Category Filter Segmented Bar */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-8 border-b border-[#E2D8C5]"
          role="tablist"
          aria-label="Lọc theo danh mục sản phẩm"
        >
          {(['Tất cả', ...PRODUCT_CATEGORIES] as const).map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  onSelectCategory(cat);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#131B2E] text-[#FAF6EE]'
                    : 'text-[#465066] hover:text-[#131B2E] hover:bg-[#F3ECE0]'
                }`}
              >
                <span>{cat}</span>
                <span className="ml-1.5 text-xs opacity-75 tabular-nums">
                  ({categoryCounts[cat] ?? 0})
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="bg-white border border-[#E2D8C5] rounded-lg overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-[#F3ECE0]" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-28 bg-[#F3ECE0] rounded" />
                  <div className="h-5 w-3/4 bg-[#F3ECE0] rounded" />
                  <div className="h-4 w-1/3 bg-[#F3ECE0] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white border border-[#E2D8C5] rounded-lg p-8 sm:p-12">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#7A1C24] mb-2">
                Dữ liệu sản phẩm thực tế
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#131B2E] mb-3">
                Kho sản phẩm đang sẵn sàng tiếp nhận hình ảnh của bạn
              </h3>
              <p className="text-sm sm:text-base text-[#465066] leading-relaxed mb-6">
                Website tuân thủ nguyên tắc không hiển thị dữ liệu giả. Để đưa các sản phẩm thêu tay
                thật của Đồ thêu Thanh Hà lên gian hàng, bạn có thể tải lên nhiều ảnh cùng lúc trong
                khu vực Quản trị và sử dụng AI để tự động nhận diện danh mục, chất liệu, họa tiết
                trước khi duyệt đăng.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7A1C24] text-[#FAF6EE] text-sm font-medium rounded-md hover:bg-[#5C1319] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <FolderUp className="w-4 h-4" />
                  <span>Tải ảnh & Thêm sản phẩm</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#131B2E]/25 text-[#131B2E] text-sm font-medium rounded-md hover:bg-[#F3ECE0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Xem hướng dẫn nhập dữ liệu</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white border border-[#E2D8C5] rounded-lg p-10 text-center">
            <p className="font-serif text-2xl font-semibold text-[#131B2E] mb-2">
              Không tìm thấy sản phẩm phù hợp
            </p>
            <p className="text-sm text-[#465066] mb-5">
              Thử đổi từ khóa tìm kiếm hoặc chọn lại danh mục “Tất cả”.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                onSelectCategory('Tất cả');
              }}
              className="px-4 py-2 text-sm font-medium bg-[#131B2E] text-[#FAF6EE] rounded-md hover:bg-[#131B2E]/90 transition-colors cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {visibleProducts.map((product) => (
                <article
                  key={product.id}
                  className="group bg-white border border-[#E2D8C5] rounded-lg overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => onViewProduct(product)}
                    className="relative aspect-[4/3] w-full overflow-hidden bg-[#F3ECE0] text-left cursor-pointer"
                  >
                    <ResilientImage
                      src={product.images[0]}
                      alt={product.name}
                      fallbackLabel={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </button>

                  <div className="p-5 flex-1 flex flex-col">
                    {/* Clean unboxed metadata line */}
                    <div className="flex items-center gap-2 text-xs text-[#465066] mb-1.5">
                      <span className="uppercase tracking-wider font-medium text-[#7A1C24]">
                        {product.category}
                      </span>
                      {product.dimensions && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{product.dimensions}</span>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onViewProduct(product)}
                      className="text-left cursor-pointer"
                    >
                      <h3 className="font-serif text-xl font-semibold text-[#131B2E] group-hover:text-[#7A1C24] transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </button>

                    <p className="text-sm text-[#465066] mt-2 line-clamp-2 flex-1">
                      {product.usage || product.description || product.material}
                    </p>

                    <div className="pt-4 mt-4 border-t border-[#E2D8C5] flex items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-[#131B2E] tabular-nums">
                          {formatVND(product.price)}
                        </p>
                        <p className="text-xs text-[#465066] tabular-nums">
                          {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Đặt thêu theo yêu cầu'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onViewProduct(product)}
                          className="px-3 py-2 text-xs font-medium text-[#131B2E] border border-[#E2D8C5] rounded-md hover:bg-[#F3ECE0] transition-colors whitespace-nowrap cursor-pointer"
                        >
                          Chi tiết
                        </button>
                        <button
                          type="button"
                          onClick={() => onAddToCart(product)}
                          aria-label={`Thêm ${product.name} vào giỏ hàng`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#7A1C24] text-[#FAF6EE] rounded-md hover:bg-[#5C1319] transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Thêm</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {visibleCount < filteredProducts.length && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="px-6 py-2.5 text-sm font-medium border border-[#131B2E]/25 text-[#131B2E] rounded-md hover:bg-[#F3ECE0] transition-colors cursor-pointer"
                >
                  Xem thêm sản phẩm ({filteredProducts.length - visibleCount} sản phẩm còn lại)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
