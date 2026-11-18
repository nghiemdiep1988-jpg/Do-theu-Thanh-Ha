import { useState } from 'react';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import type { Product } from '../types.ts';
import { formatVND } from '../utils/format.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface ProductDetailModalProps {
  product: Product;
  similarProducts: Product[];
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, customNote?: string) => void;
  onSelectProduct: (product: Product) => void;
}

export function ProductDetailModal({
  product,
  similarProducts,
  onClose,
  onAddToCart,
  onSelectProduct,
}: ProductDetailModalProps) {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [customNote, setCustomNote] = useState('');

  const images = product.images.length > 0 ? product.images : [''];
  const activeImage = images[selectedImageIdx] ?? images[0];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#131B2E]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
      onClick={onClose}
    >
      <div
        className="bg-[#FAF6EE] border border-[#E2D8C5] rounded-lg max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-[#FAF6EE]/95 backdrop-blur-xs border-b border-[#E2D8C5] px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#465066] truncate">
            <span className="font-medium text-[#7A1C24] uppercase tracking-wider">
              {product.category}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{product.sku}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết sản phẩm"
            className="p-2 text-[#131B2E] hover:bg-[#F3ECE0] rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 lg:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Gallery */}
          <div className="md:col-span-6 space-y-3">
            <div className="aspect-[4/3] rounded-lg overflow-hidden border border-[#E2D8C5] bg-[#F3ECE0]">
              <ResilientImage
                src={activeImage}
                alt={product.name}
                fallbackLabel={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2.5">
                {images.map((imgUrl, idx) => (
                  <button
                    key={`${imgUrl}-${idx}`}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`aspect-square rounded-md overflow-hidden border transition-colors cursor-pointer ${
                      idx === selectedImageIdx
                        ? 'border-[#7A1C24] ring-2 ring-[#7A1C24]/25'
                        : 'border-[#E2D8C5] opacity-80 hover:opacity-100'
                    }`}
                  >
                    <ResilientImage
                      src={imgUrl}
                      alt={`${product.name} ảnh ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Contiguous Purchase Module */}
          <div className="md:col-span-6 flex flex-col">
            <h2 className="font-serif text-3xl font-semibold text-[#131B2E] leading-tight">
              {product.name}
            </h2>

            <div className="mt-3 flex items-baseline gap-4">
              <p className="text-2xl font-semibold text-[#7A1C24] tabular-nums">
                {formatVND(product.price)}
              </p>
              <span className="text-xs text-[#465066] tabular-nums">
                {product.stock > 0 ? `Sẵn kho: ${product.stock}` : 'Nhận đặt thêu theo yêu cầu'}
              </span>
            </div>

            <p className="mt-4 text-sm text-[#465066] leading-relaxed">
              {product.description || 'Sản phẩm thêu tay thủ công tinh tế của Đồ thêu Thanh Hà.'}
            </p>

            <dl className="mt-6 border-t border-b border-[#E2D8C5] divide-y divide-[#E2D8C5] text-sm">
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-[#465066] shrink-0">Kích thước</dt>
                <dd className="text-[#131B2E] font-medium text-right">
                  {product.dimensions || 'Đang cập nhật'}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-[#465066] shrink-0">Chất liệu</dt>
                <dd className="text-[#131B2E] font-medium text-right">
                  {product.material || 'Vải tự nhiên'}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-[#465066] shrink-0">Họa tiết</dt>
                <dd className="text-[#131B2E] font-medium text-right">
                  {product.pattern || 'Thêu tay truyền thống'}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-[#465066] shrink-0">Màu sắc</dt>
                <dd className="text-[#131B2E] font-medium text-right">
                  {product.colors.join(', ') || 'Tự nhiên'}
                </dd>
              </div>
              {product.style && (
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-[#465066] shrink-0">Kiểu dáng</dt>
                  <dd className="text-[#131B2E] font-medium text-right">{product.style}</dd>
                </div>
              )}
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-[#465066] shrink-0">Công dụng</dt>
                <dd className="text-[#131B2E] font-medium text-right">
                  {product.usage || 'Sử dụng hằng ngày / Quà tặng'}
                </dd>
              </div>
            </dl>

            <div className="mt-5">
              <label
                htmlFor="custom-embroidery-note"
                className="block text-xs font-medium text-[#131B2E] mb-1.5"
              >
                Ghi chú thêu tên riêng / gói quà (tùy chọn)
              </label>
              <input
                id="custom-embroidery-note"
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="VD: Thêu tên 'Minh An' góc phải bằng chỉ đỏ đô..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-[#E2D8C5] rounded-md text-[#131B2E] focus:outline-none focus:border-[#7A1C24]"
              />
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="inline-flex items-center border border-[#E2D8C5] bg-white rounded-md">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Giảm số lượng"
                  className="p-2.5 text-[#131B2E] hover:bg-[#F3ECE0] cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-medium tabular-nums text-[#131B2E]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Tăng số lượng"
                  className="p-2.5 text-[#131B2E] hover:bg-[#F3ECE0] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onAddToCart(product, quantity, customNote.trim() || undefined);
                  onClose();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#7A1C24] text-[#FAF6EE] text-sm font-medium rounded-md hover:bg-[#5C1319] transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Thêm vào giỏ hàng</span>
              </button>
            </div>
          </div>
        </div>

        {similarProducts.length > 0 && (
          <div className="px-6 lg:px-8 pb-8 pt-6 border-t border-[#E2D8C5]">
            <h3 className="font-serif text-xl font-semibold text-[#131B2E] mb-4">
              Sản phẩm tương tự
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {similarProducts.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedImageIdx(0);
                    setQuantity(1);
                    onSelectProduct(item);
                  }}
                  className="text-left bg-white border border-[#E2D8C5] rounded-md p-3 hover:border-[#7A1C24]/50 transition-colors cursor-pointer"
                >
                  <div className="aspect-[4/3] rounded overflow-hidden bg-[#F3ECE0] mb-2.5">
                    <ResilientImage
                      src={item.images[0]}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm font-medium text-[#131B2E] line-clamp-1">{item.name}</p>
                  <p className="text-xs text-[#7A1C24] font-semibold mt-0.5 tabular-nums">
                    {formatVND(item.price)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
