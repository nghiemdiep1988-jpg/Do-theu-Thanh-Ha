import { useState, type FormEvent } from 'react';
import { CheckCircle2, Minus, Plus, Trash2, X } from 'lucide-react';
import type { CartItem, OrderRecord } from '../types.ts';
import { apiUrl } from '../utils/api.ts';
import { formatVND } from '../utils/format.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (index: number, delta: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
}

export function CartDrawer({
  isOpen,
  items,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartDrawerProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BANK_TRANSFER'>('COD');
  const [orderNote, setOrderNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = subtotal >= 1000000 || subtotal === 0 ? 0 : 30000;
  const total = subtotal + shippingFee;

  const handleCheckout = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    const payloadItems = items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      customEmbroideryNote: item.customEmbroideryNote,
    }));

    try {
      const res = await fetch(apiUrl('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerAddress,
          paymentMethod,
          note: orderNote,
          items: payloadItems,
        }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = (await res.json()) as { order?: OrderRecord; error?: string };
        if (!res.ok || !data.order) {
          throw new Error(data.error || 'Không thể hoàn tất đặt hàng.');
        }
        setConfirmedOrder(data.order);
      } else {
        // Static GitHub Pages fallback receipt
        const localOrder: OrderRecord = {
          id: `TH-${Math.floor(100000 + Math.random() * 900000)}`,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim(),
          paymentMethod,
          note: orderNote.trim(),
          items: payloadItems,
          subtotal,
          shippingFee,
          total,
          createdAt: new Date().toISOString(),
        };
        setConfirmedOrder(localOrder);
      }
      onClearCart();
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setOrderNote('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Có lỗi xảy ra khi đặt hàng.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#131B2E]/55 backdrop-blur-xs flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Giỏ hàng Đồ thêu Thanh Hà"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#FAF6EE] h-full border-l border-[#E2D8C5] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#E2D8C5] flex items-center justify-between">
          <h2 className="font-serif text-2xl font-semibold text-[#131B2E]">Giỏ hàng</h2>
          <button
            type="button"
            onClick={() => {
              setConfirmedOrder(null);
              onClose();
            }}
            aria-label="Đóng giỏ hàng"
            className="p-2 text-[#131B2E] hover:bg-[#F3ECE0] rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {confirmedOrder ? (
            <div className="bg-white border border-[#E2D8C5] rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3 text-[#7A1C24]">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold">Đặt hàng thành công</p>
                  <p className="font-serif text-xl font-semibold text-[#131B2E]">
                    Mã đơn #{confirmedOrder.id}
                  </p>
                </div>
              </div>
              <p className="text-sm text-[#465066] leading-relaxed">
                Cảm ơn <strong>{confirmedOrder.customerName}</strong>. Đồ thêu Thanh Hà đã tiếp nhận
                đơn hàng và sẽ liên hệ xác nhận qua số{' '}
                <span className="font-mono">{confirmedOrder.customerPhone}</span>.
              </p>
              <div className="border-t border-[#E2D8C5] pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#465066]">Hình thức thanh toán</span>
                  <span className="font-medium text-[#131B2E]">
                    {confirmedOrder.paymentMethod === 'COD'
                      ? 'Thanh toán khi nhận hàng (COD)'
                      : 'Chuyển khoản ngân hàng'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#465066]">Tổng thanh toán</span>
                  <span className="font-semibold text-[#7A1C24] tabular-nums">
                    {formatVND(confirmedOrder.total)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setConfirmedOrder(null);
                  onClose();
                }}
                className="w-full py-2.5 bg-[#131B2E] text-[#FAF6EE] text-sm font-medium rounded-md hover:bg-[#131B2E]/90 cursor-pointer"
              >
                Tiếp tục xem sản phẩm
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-serif text-2xl text-[#131B2E] mb-2">Giỏ hàng đang trống</p>
              <p className="text-sm text-[#465066]">
                Hãy chọn sản phẩm thêu tay phù hợp để thêm vào giỏ hàng của bạn.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <ul className="divide-y divide-[#E2D8C5]">
                {items.map((item, idx) => (
                  <li key={`${item.product.id}-${idx}`} className="py-4 first:pt-0 flex gap-4">
                    <div className="w-20 h-20 rounded-md overflow-hidden border border-[#E2D8C5] bg-[#F3ECE0] shrink-0">
                      <ResilientImage
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-[#131B2E] line-clamp-2">
                          {item.product.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(idx)}
                          aria-label={`Xóa ${item.product.name}`}
                          className="p-1 text-[#465066] hover:text-[#7A1C24] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-[#465066] mt-0.5">{item.product.category}</p>
                      {item.customEmbroideryNote && (
                        <p className="text-xs text-[#7A1C24] mt-1">
                          Ghi chú thêu: {item.customEmbroideryNote}
                        </p>
                      )}
                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="inline-flex items-center border border-[#E2D8C5] bg-white rounded">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(idx, -1)}
                            aria-label="Giảm số lượng"
                            className="p-1.5 text-[#131B2E] hover:bg-[#F3ECE0] cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-medium tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(idx, 1)}
                            aria-label="Tăng số lượng"
                            className="p-1.5 text-[#131B2E] hover:bg-[#F3ECE0] cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-[#131B2E] tabular-nums">
                          {formatVND(item.product.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="bg-white border border-[#E2D8C5] rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between text-[#465066]">
                  <span>Tạm tính</span>
                  <span className="tabular-nums font-medium text-[#131B2E]">
                    {formatVND(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-[#465066]">
                  <span>Phí giao hàng</span>
                  <span className="tabular-nums font-medium text-[#131B2E]">
                    {shippingFee === 0 ? 'Miễn phí' : formatVND(shippingFee)}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#E2D8C5] flex justify-between text-base font-semibold text-[#131B2E]">
                  <span>Tổng cộng</span>
                  <span className="text-[#7A1C24] tabular-nums">{formatVND(total)}</span>
                </div>
                {subtotal > 0 && subtotal < 1000000 && (
                  <p className="text-xs text-[#465066]">
                    Mua thêm {formatVND(1000000 - subtotal)} để được miễn phí giao hàng toàn quốc.
                  </p>
                )}
              </div>

              <form onSubmit={handleCheckout} className="space-y-3 pt-2 border-t border-[#E2D8C5]">
                <p className="font-serif text-xl font-semibold text-[#131B2E]">
                  Thông tin nhận hàng
                </p>

                {errorMsg && (
                  <p className="text-xs text-[#7A1C24] bg-[#7A1C24]/10 border border-[#7A1C24]/25 rounded p-2.5">
                    {errorMsg}
                  </p>
                )}

                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Họ và tên người nhận"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#E2D8C5] rounded-md focus:outline-none focus:border-[#7A1C24]"
                />
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Số điện thoại liên hệ"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#E2D8C5] rounded-md focus:outline-none focus:border-[#7A1C24]"
                />
                <textarea
                  required
                  rows={2}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Địa chỉ giao hàng chi tiết"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#E2D8C5] rounded-md focus:outline-none focus:border-[#7A1C24]"
                />

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`py-2 px-3 rounded-md border font-medium cursor-pointer ${
                      paymentMethod === 'COD'
                        ? 'bg-[#131B2E] text-[#FAF6EE] border-[#131B2E]'
                        : 'bg-white text-[#131B2E] border-[#E2D8C5]'
                    }`}
                  >
                    Thanh toán COD
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('BANK_TRANSFER')}
                    className={`py-2 px-3 rounded-md border font-medium cursor-pointer ${
                      paymentMethod === 'BANK_TRANSFER'
                        ? 'bg-[#131B2E] text-[#FAF6EE] border-[#131B2E]'
                        : 'bg-white text-[#131B2E] border-[#E2D8C5]'
                    }`}
                  >
                    Chuyển khoản
                  </button>
                </div>

                <input
                  type="text"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Ghi chú đơn hàng (tùy chọn)"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#E2D8C5] rounded-md focus:outline-none focus:border-[#7A1C24]"
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#7A1C24] text-[#FAF6EE] text-sm font-medium rounded-md hover:bg-[#5C1319] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submitting ? 'Đang gửi đơn hàng...' : 'Xác nhận đặt hàng'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
