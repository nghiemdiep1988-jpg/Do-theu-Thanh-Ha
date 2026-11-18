import fs from 'fs';
import path from 'path';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type { GenerateContentResponse } from '@google/genai';
import {
  PRODUCT_CATEGORIES,
  type AIClassificationResult,
  type Product,
  type ProductCategory,
} from '../src/types.ts';

const MODEL_NAME = 'gemini-4-hydrogen';

function createAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new AIError(
      'Chưa cấu hình khóa GEMINI_API_KEY trên máy chủ. Vui lòng thiết lập biến môi trường GEMINI_API_KEY trong phần Settings > Secrets (hoặc tệp .env trên máy chủ).',
      503
    );
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export class AIError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

function normalizeError(err: unknown): AIError {
  if (err instanceof AIError) return err;
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED') || msg.includes('403')) {
    return new AIError(
      'Khóa Gemini API không hợp lệ hoặc chưa đủ quyền truy cập. Vui lòng kiểm tra lại GEMINI_API_KEY trong mục Settings > Secrets.',
      403
    );
  }
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
    return new AIError(
      'Hệ thống AI đang tạm vượt giới hạn lượt gọi miễn phí (429). Vui lòng đợi một lát rồi thử lại hoặc nâng cấp gói API.',
      429
    );
  }
  return new AIError(`Lỗi xử lý AI: ${msg}`, 500);
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient = msg.includes('429') || msg.includes('503') || msg.includes('ECONNRESET');
      if (!isTransient || attempt === maxRetries) {
        throw normalizeError(err);
      }
      await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
    }
  }
  throw normalizeError(lastErr);
}

function getMimeTypeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

function resolveLocalImagePart(imageUrl?: string): { inlineData: { mimeType: string; data: string } } | null {
  if (!imageUrl || typeof imageUrl !== 'string') return null;

  if (imageUrl.startsWith('data:image/')) {
    const match = imageUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (match) {
      return {
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      };
    }
    return null;
  }

  const rootDir = process.cwd();
  const cleaned = imageUrl.split('?')[0].replace(/^\/+/, '');
  let candidatePath: string | null = null;

  if (cleaned.startsWith('uploads/')) {
    candidatePath = path.resolve(rootDir, cleaned);
    if (!candidatePath.startsWith(path.resolve(rootDir, 'uploads'))) {
      return null;
    }
  } else if (cleaned.startsWith('images/')) {
    candidatePath = path.resolve(rootDir, 'public', cleaned);
    if (!candidatePath.startsWith(path.resolve(rootDir, 'public', 'images'))) {
      return null;
    }
  } else if (cleaned.startsWith('public/images/')) {
    candidatePath = path.resolve(rootDir, cleaned);
    if (!candidatePath.startsWith(path.resolve(rootDir, 'public', 'images'))) {
      return null;
    }
  }

  if (candidatePath && fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
    const buffer = fs.readFileSync(candidatePath);
    return {
      inlineData: {
        mimeType: getMimeTypeFromPath(candidatePath),
        data: buffer.toString('base64'),
      },
    };
  }

  return null;
}

function ensureValidCategory(raw: string): ProductCategory {
  const found = PRODUCT_CATEGORIES.find(
    (c) => c.toLowerCase() === String(raw || '').trim().toLowerCase()
  );
  return found ?? 'Sản phẩm thêu khác';
}

export interface ClassifyInput {
  id?: string;
  name: string;
  description?: string;
  dimensions?: string;
  images?: string[];
}

export async function classifyProductWithAI(input: ClassifyInput): Promise<AIClassificationResult> {
  const ai = createAIClient();
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  const firstImage = input.images?.[0];
  const imagePart = resolveLocalImagePart(firstImage);
  if (imagePart) {
    parts.push(imagePart);
  }

  const promptText = [
    `Hãy phân tích sản phẩm thủ công của thương hiệu "Đồ thêu Thanh Hà" (Việt Nam) dựa trên hình ảnh (nếu có) và thông tin hiện có:`,
    `- Tên / tên tệp hiện tại: ${input.name || '(Chưa đặt tên)'}`,
    `- Mô tả ban đầu: ${input.description || '(Chưa có mô tả)'}`,
    `- Kích thước gợi ý: ${input.dimensions || '(Chưa rõ)'}`,
    ``,
    `Yêu cầu phân loại chuẩn xác bằng tiếng Việt tự nhiên, trang nhã:`,
    `1. category: Chọn ĐÚNG 1 trong các danh mục: ${PRODUCT_CATEGORIES.join(', ')}.`,
    `2. suggestedName: Nếu tên hiện tại là mã tệp ảnh (như IMG_01, z5432...) hoặc sơ sài, hãy đặt tên tiếng Việt tinh tế theo sản phẩm nhìn thấy; nếu tên hiện tại đã rõ ràng thì giữ hoặc chuẩn hóa nhẹ.`,
    `3. material: Nhận diện chất liệu vải và chỉ (ví dụ: Vải linen mộc tự nhiên, Vải đũi tơ tằm, Vải cotton thô, Chỉ thêu cotton/lụa...).`,
    `4. dimensions: Nếu có trong mô tả hãy trích xuất chuẩn xác; nếu không có trong ảnh/mô tả, ghi rõ dạng ước lượng tham khảo kèm chú thích "(Cần quản trị viên đo lại)".`,
    `5. colors: Danh sách các tông màu chủ đạo nhìn thấy (ví dụ: ["Kem ngà", "Đỏ đô", "Xanh đen"]).`,
    `6. style: Kiểu dáng / phong cách (ví dụ: Truyền thống kết hợp hiện đại, Tối giản thanh lịch...).`,
    `7. pattern: Họa tiết thêu quan sát được (ví dụ: Hoa sen, Cúc họa mi, Chữ thêu tên riêng, Trúc mai...). Nếu không thấy rõ họa tiết cụ thể thì ghi trung thực.`,
    `8. usage: Công dụng thực tế của sản phẩm.`,
    `9. suggestedDescription: Viết 2-3 câu mô tả sang trọng, chân thực đúng với những gì quan sát được, không bịa đặt giá bán hay số lượng.`,
    `10. confidenceNote: Ghi chú ngắn cho quản trị viên biết điểm nào AI nhận diện rõ và điểm nào cần kiểm tra lại trước khi đăng.`,
  ].join('\n');

  parts.push({ text: promptText });

  const response: GenerateContentResponse = await withRetry(() =>
    ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: [...PRODUCT_CATEGORIES] },
            suggestedName: { type: Type.STRING },
            material: { type: Type.STRING },
            dimensions: { type: Type.STRING },
            colors: { type: Type.ARRAY, items: { type: Type.STRING } },
            style: { type: Type.STRING },
            pattern: { type: Type.STRING },
            usage: { type: Type.STRING },
            suggestedDescription: { type: Type.STRING },
            confidenceNote: { type: Type.STRING },
          },
          required: [
            'category',
            'suggestedName',
            'material',
            'dimensions',
            'colors',
            'style',
            'pattern',
            'usage',
            'suggestedDescription',
            'confidenceNote',
          ],
        },
      },
    })
  );

  const parsed = JSON.parse((response.text ?? '{}').trim()) as Partial<AIClassificationResult>;
  return {
    category: ensureValidCategory(parsed.category ?? ''),
    suggestedName: parsed.suggestedName?.trim() || input.name || 'Sản phẩm thêu Thanh Hà',
    material: parsed.material?.trim() || 'Vải tự nhiên thêu tay',
    dimensions: parsed.dimensions?.trim() || input.dimensions || 'Cần cập nhật kích thước',
    colors: Array.isArray(parsed.colors) && parsed.colors.length > 0 ? parsed.colors : ['Tự nhiên'],
    style: parsed.style?.trim() || 'Truyền thống kết hợp hiện đại',
    pattern: parsed.pattern?.trim() || 'Họa tiết thêu thủ công',
    usage: parsed.usage?.trim() || 'Sử dụng hằng ngày hoặc làm quà tặng',
    suggestedDescription:
      parsed.suggestedDescription?.trim() || input.description || 'Sản phẩm thêu tay thủ công từ Đồ thêu Thanh Hà.',
    confidenceNote:
      parsed.confidenceNote?.trim() || 'Đã phân tích tự động. Vui lòng kiểm tra giá bán, kích thước và tồn kho trước khi đăng.',
  };
}

export async function classifyBatchWithAI(items: ClassifyInput[]): Promise<
  Array<{
    id: string;
    success: boolean;
    result?: AIClassificationResult;
    error?: string;
  }>
> {
  const results: Array<{
    id: string;
    success: boolean;
    result?: AIClassificationResult;
    error?: string;
  }> = [];

  const concurrency = 3;
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map(async (item, idx) => {
        const id = item.id ?? `item-${i + idx}`;
        try {
          const result = await classifyProductWithAI(item);
          return { id, success: true, result };
        } catch (err) {
          const normalized = normalizeError(err);
          return { id, success: false, error: normalized.message };
        }
      })
    );
    results.push(...chunkResults);
  }

  return results;
}

export interface ChatTurnInput {
  role: 'user' | 'assistant';
  text: string;
}

export interface AdvisorChatResponse {
  reply: string;
  recommendedProducts: Product[];
  followUpSuggestions: string[];
}

export async function chatWithAdvisor(
  message: string,
  history: ChatTurnInput[],
  publishedProducts: Product[]
): Promise<AdvisorChatResponse> {
  const ai = createAIClient();

  const catalogContext = publishedProducts.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    priceVND: p.price,
    dimensions: p.dimensions,
    material: p.material,
    colors: p.colors,
    style: p.style,
    pattern: p.pattern,
    usage: p.usage,
    description: p.description,
    stock: p.stock,
  }));

  const systemInstruction = [
    'Bạn là chuyên viên tư vấn sản phẩm của thương hiệu "Đồ thêu Thanh Hà" (thủ công mỹ nghệ Việt Nam).',
    'NGUYÊN TẮC BẮT BUỘC:',
    '1. CHỈ sử dụng dữ liệu sản phẩm thực tế trong DANH SÁCH SẢN PHẨM HIỆN CÓ bên dưới.',
    '2. TUYỆT ĐỐI KHÔNG tự bịa sản phẩm, không bịa giá bán, kích thước, chất liệu, màu sắc hay tình trạng tồn kho.',
    '3. Nếu danh sách sản phẩm hiện có đang TRỐNG (0 sản phẩm), hãy trả lời trung thực và lịch sự rằng cửa hàng hiện chưa đăng bán sản phẩm nào lên hệ thống, mời khách quay lại sau hoặc liên hệ trực tiếp với Thanh Hà.',
    '4. Khi khách hỏi về kích thước, màu sắc, chất liệu, họa tiết, công dụng, so sánh sản phẩm, hoặc gợi ý quà tặng/sản phẩm tương tự: đối chiếu chính xác với dữ liệu thực tế và trả lời rõ ràng, tinh tế, thân thiện bằng tiếng Việt.',
    '5. Nếu có sản phẩm phù hợp để giới thiệu hoặc so sánh, đưa đúng "id" của các sản phẩm đó vào trường recommendedProductIds để hệ thống hiển thị thẻ sản phẩm kèm ảnh, giá và đường dẫn chi tiết.',
    '6. Nếu thông tin khách hỏi không có trong dữ liệu sản phẩm (ví dụ kích thước chưa được nhập hoặc hết hàng), hãy nói rõ điều đó một cách trung thực.',
    '',
    `DANH SÁCH SẢN PHẨM HIỆN CÓ (${catalogContext.length} sản phẩm đang bán):`,
    JSON.stringify(catalogContext, null, 2),
  ].join('\n');

  const recentHistory = history.slice(-8).map((h) => ({
    role: h.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: h.text }],
  }));

  const response: GenerateContentResponse = await withRetry(() =>
    ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        ...recentHistory,
        {
          role: 'user',
          parts: [{ text: message }],
        },
      ],
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'Câu trả lời tiếng Việt tự nhiên, súc tích và trung thực với dữ liệu.',
            },
            recommendedProductIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Danh sách ID chính xác từ kho sản phẩm thực tế được đề xuất hoặc so sánh.',
            },
            followUpSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Tối đa 3 gợi ý câu hỏi tiếp theo ngắn gọn bằng tiếng Việt.',
            },
          },
          required: ['reply', 'recommendedProductIds', 'followUpSuggestions'],
        },
      },
    })
  );

  const parsed = JSON.parse((response.text ?? '{}').trim()) as {
    reply?: string;
    recommendedProductIds?: string[];
    followUpSuggestions?: string[];
  };

  const productMap = new Map(publishedProducts.map((p) => [p.id, p]));
  const validProducts: Product[] = [];
  const seen = new Set<string>();

  for (const id of parsed.recommendedProductIds ?? []) {
    const prod = productMap.get(id);
    if (prod && !seen.has(id)) {
      seen.add(id);
      validProducts.push(prod);
    }
  }

  return {
    reply:
      parsed.reply?.trim() ||
      'Cảm ơn quý khách đã quan tâm đến Đồ thêu Thanh Hà. Hiện tôi chưa tìm thấy thông tin phù hợp trong dữ liệu sản phẩm.',
    recommendedProducts: validProducts,
    followUpSuggestions: Array.isArray(parsed.followUpSuggestions)
      ? parsed.followUpSuggestions.slice(0, 3)
      : [],
  };
}
