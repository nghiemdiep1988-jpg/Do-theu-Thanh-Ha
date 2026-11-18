export const PRODUCT_CATEGORIES = [
  'Khăn vuông',
  'Khăn trải bàn',
  'Túi vải',
  'Ví vải',
  'Khăn đặt ly',
  'Túi thêu tên riêng',
  'Sản phẩm thêu khác',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type ProductStatus = 'draft' | 'published';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  price: number;
  dimensions: string;
  material: string;
  colors: string[];
  style: string;
  pattern: string;
  usage: string;
  description: string;
  images: string[];
  stock: number;
  featured: boolean;
  status: ProductStatus;
  aiClassified?: boolean;
  aiConfidenceNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customEmbroideryNote?: string;
}

export interface OrderRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  paymentMethod: 'COD' | 'BANK_TRANSFER';
  note?: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    customEmbroideryNote?: string;
  }>;
  subtotal: number;
  shippingFee: number;
  total: number;
  createdAt: string;
}

export interface AIClassificationResult {
  category: ProductCategory;
  suggestedName: string;
  material: string;
  dimensions: string;
  colors: string[];
  style: string;
  pattern: string;
  usage: string;
  suggestedDescription: string;
  confidenceNote: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  recommendedProducts?: Product[];
  followUpSuggestions?: string[];
  isError?: boolean;
}
