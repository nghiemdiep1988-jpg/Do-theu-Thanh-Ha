import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MessageSquare, Send, ShoppingBag, X } from 'lucide-react';
import type { ChatMessage, Product } from '../types.ts';
import { apiUrl } from '../utils/api.ts';
import { formatVND } from '../utils/format.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface AIChatWidgetProps {
  publishedCount: number;
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

const STARTER_QUESTIONS = [
  'Gợi ý sản phẩm phù hợp làm quà tặng',
  'Cửa hàng hiện có những chất liệu và kích thước nào?',
  'So sánh giúp tôi các sản phẩm nổi bật hiện có',
];

export function AIChatWidget({
  publishedCount,
  onViewProduct,
  onAddToCart,
}: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text:
        publishedCount > 0
          ? `Xin chào quý khách! Tôi là trợ lý tư vấn của Đồ thêu Thanh Hà. Hiện cửa hàng có ${publishedCount} sản phẩm đang mở bán — tôi có thể tra cứu kích thước, chất liệu, so sánh sản phẩm hoặc gợi ý quà tặng từ kho dữ liệu thực tế.`
          : 'Xin chào quý khách! Tôi là trợ lý tư vấn của Đồ thêu Thanh Hà. Khi quản trị viên đăng sản phẩm lên gian hàng, tôi sẽ giúp quý khách tra cứu kích thước, chất liệu, so sánh và gợi ý quà tặng chính xác từ dữ liệu thực tế.',
      followUpSuggestions: STARTER_QUESTIONS,
    },
  ]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const historyPayload = nextMessages
        .filter((m) => m.id !== 'welcome' && !m.isError)
        .slice(-8)
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await fetch(apiUrl('/api/ai/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: historyPayload.slice(0, -1),
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(
          'Trang tĩnh hiện chưa kết nối máy chủ Backend AI (VITE_API_BASE_URL). Hãy triển khai máy chủ Express miễn phí để bật chatbot AI.'
        );
      }

      const data = (await res.json()) as {
        reply?: string;
        recommendedProducts?: Product[];
        followUpSuggestions?: string[];
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || 'Không thể kết nối trợ lý tư vấn AI.');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: data.reply || 'Tôi chưa có thông tin phù hợp từ dữ liệu sản phẩm.',
          recommendedProducts: data.recommendedProducts ?? [],
          followUpSuggestions: data.followUpSuggestions ?? [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: err instanceof Error ? err.message : 'Có lỗi xảy ra khi kết nối AI.',
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2.5 px-5 py-3 bg-[#131B2E] text-[#FAF6EE] text-sm font-medium rounded-lg shadow-lg border border-[#FAF6EE]/15 hover:bg-[#7A1C24] transition-colors cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Tư vấn Thanh Hà</span>
        </button>
      ) : (
        <div
          className="w-[calc(100vw-2rem)] sm:w-[400px] h-[540px] max-h-[82vh] bg-[#FAF6EE] border border-[#E2D8C5] rounded-lg shadow-2xl flex flex-col overflow-hidden"
          role="dialog"
          aria-label="Trợ lý AI tư vấn Đồ thêu Thanh Hà"
        >
          {/* Header */}
          <div className="bg-[#131B2E] text-[#FAF6EE] px-4 py-3.5 flex items-center justify-between gap-3">
            <div>
              <p className="font-serif text-lg font-semibold leading-tight">Tư vấn Đồ thêu Thanh Hà</p>
              <p className="text-[11px] text-[#FAF6EE]/70">
                Tra cứu trực tiếp từ kho sản phẩm thực tế ({publishedCount} mẫu)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Thu gọn khung tư vấn"
              className="p-1.5 text-[#FAF6EE]/80 hover:text-[#FAF6EE] hover:bg-white/10 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-[#7A1C24] text-[#FAF6EE]'
                      : msg.isError
                        ? 'bg-[#7A1C24]/10 border border-[#7A1C24]/30 text-[#7A1C24]'
                        : 'bg-white border border-[#E2D8C5] text-[#131B2E]'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Recommended product cards grounded in real catalog */}
                {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                  <div className="w-full mt-2.5 space-y-2">
                    {msg.recommendedProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="bg-white border border-[#E2D8C5] rounded-md p-2.5 flex items-center gap-3"
                      >
                        <button
                          type="button"
                          onClick={() => onViewProduct(prod)}
                          className="w-14 h-14 rounded overflow-hidden bg-[#F3ECE0] shrink-0 cursor-pointer"
                        >
                          <ResilientImage
                            src={prod.images[0]}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        </button>
                        <div className="flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => onViewProduct(prod)}
                            className="text-left text-xs font-semibold text-[#131B2E] hover:text-[#7A1C24] line-clamp-1 cursor-pointer"
                          >
                            {prod.name}
                          </button>
                          <p className="text-[11px] text-[#465066] truncate">
                            {prod.category}
                            {prod.dimensions ? ` · ${prod.dimensions}` : ''}
                          </p>
                          <p className="text-xs font-semibold text-[#7A1C24] mt-0.5 tabular-nums">
                            {formatVND(prod.price)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onViewProduct(prod)}
                            className="px-2 py-1 text-[11px] font-medium border border-[#E2D8C5] rounded text-[#131B2E] hover:bg-[#F3ECE0] cursor-pointer"
                          >
                            Xem
                          </button>
                          <button
                            type="button"
                            onClick={() => onAddToCart(prod)}
                            aria-label={`Thêm ${prod.name} vào giỏ`}
                            className="px-2 py-1 text-[11px] font-medium bg-[#7A1C24] text-[#FAF6EE] rounded hover:bg-[#5C1319] inline-flex items-center justify-center cursor-pointer"
                          >
                            <ShoppingBag className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {msg.followUpSuggestions && msg.followUpSuggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.followUpSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => void sendMessage(s)}
                        disabled={sending}
                        className="text-left text-xs px-2.5 py-1.5 bg-[#F3ECE0] hover:bg-[#E2D8C5] text-[#131B2E] rounded border border-[#E2D8C5] transition-colors cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex items-start">
                <div className="bg-white border border-[#E2D8C5] rounded-lg px-3.5 py-2.5 text-xs text-[#465066]">
                  Đang tra cứu sản phẩm thực tế...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-white border-t border-[#E2D8C5] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi về kích thước, chất liệu, quà tặng..."
              className="flex-1 px-3 py-2 text-sm bg-[#FAF6EE] border border-[#E2D8C5] rounded-md text-[#131B2E] focus:outline-none focus:border-[#7A1C24]"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Gửi câu hỏi"
              className="p-2.5 bg-[#7A1C24] text-[#FAF6EE] rounded-md hover:bg-[#5C1319] disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
