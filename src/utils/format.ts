import { PRODUCT_CATEGORIES, type Product, type ProductCategory } from '../types.ts';

export function formatVND(amount: number): string {
  if (!amount || amount <= 0) {
    return 'Liên hệ báo giá';
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function cleanFileNameToProductName(filename: string): string {
  const withoutExt = filename.replace(/\.[^/.]+$/, '');
  const spaced = withoutExt.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!spaced) return 'Sản phẩm thêu Thanh Hà';
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseProductsCSV(csvText: string): Partial<Product>[] {
  const lines = csvText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCSVRow(lines[0]).map((h) => h.toLowerCase().trim());
  const items: Partial<Product>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVRow(lines[i]);
    if (cols.every((c) => !c)) continue;

    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = cols[idx] ?? '';
    });

    const rawCat = record.category || record['danh_muc'] || record['loai'] || '';
    const matchedCategory = PRODUCT_CATEGORIES.find(
      (c) => c.toLowerCase() === rawCat.toLowerCase()
    ) as ProductCategory | undefined;

    const rawImages = record.images || record.image || record['hinh_anh'] || '';
    const images = rawImages
      .split(/[|;]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const rawColors = record.colors || record.color || record['mau_sac'] || '';
    const colors = rawColors
      .split(/[|;,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    items.push({
      sku: record.sku || record['ma_sp'] || '',
      name: record.name || record['ten'] || record['ten_san_pham'] || 'Sản phẩm chưa đặt tên',
      category: matchedCategory ?? 'Sản phẩm thêu khác',
      price: Number((record.price || record['gia'] || '0').replace(/[^\d]/g, '')) || 0,
      dimensions: record.dimensions || record['kich_thuoc'] || '',
      material: record.material || record['chat_lieu'] || '',
      colors: colors.length > 0 ? colors : ['Kem'],
      style: record.style || record['kieu_dang'] || '',
      pattern: record.pattern || record['hoa_tiet'] || '',
      usage: record.usage || record['cong_dung'] || '',
      description: record.description || record['mo_ta'] || '',
      images,
      stock: Number(record.stock || record['ton_kho'] || 10) || 0,
      featured: ['true', '1', 'yes', 'co'].includes((record.featured || '').toLowerCase()),
      status: record.status === 'published' ? 'published' : 'draft',
    });
  }

  return items;
}

export function exportProductsToCSV(products: Product[]): string {
  const headers = [
    'id',
    'sku',
    'name',
    'category',
    'price',
    'dimensions',
    'material',
    'colors',
    'style',
    'pattern',
    'usage',
    'description',
    'images',
    'stock',
    'featured',
    'status',
  ];

  const escapeCell = (val: unknown): string => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = products.map((p) =>
    [
      p.id,
      p.sku,
      p.name,
      p.category,
      p.price,
      p.dimensions,
      p.material,
      p.colors.join(' | '),
      p.style,
      p.pattern,
      p.usage,
      p.description,
      p.images.join(' | '),
      p.stock,
      p.featured,
      p.status,
    ]
      .map(escapeCell)
      .join(',')
  );

  return '\uFEFF' + [headers.join(','), ...rows].join('\n');
}

export const SAMPLE_CSV_TEMPLATE =
  '\uFEFFsku,name,category,price,dimensions,material,colors,style,pattern,usage,description,images,stock,featured,status\n' +
  'TH-KV-001,Khăn vuông linen thêu hoa sen,Khăn vuông,320000,45 x 45 cm,Vải linen mộc tự nhiên,Kem | Đỏ đô,Truyền thống kết hợp hiện đại,Hoa sen thêu tay,Khăn tay hoặc gói quà cao cấp,Khăn vuông thêu tay tỉ mỉ trên nền linen thoáng mát.,/images/products/ten-anh-cua-ban.jpg,15,true,draft\n';

export const SAMPLE_JSON_TEMPLATE = JSON.stringify(
  [
    {
      sku: 'TH-KV-001',
      name: 'Tên sản phẩm thật của bạn',
      category: 'Khăn vuông',
      price: 320000,
      dimensions: '45 x 45 cm',
      material: 'Vải linen mộc tự nhiên',
      colors: ['Kem', 'Đỏ đô'],
      style: 'Truyền thống kết hợp hiện đại',
      pattern: 'Hoa sen thêu tay',
      usage: 'Khăn tay, phụ kiện hoặc gói quà trang trọng',
      description: 'Mô tả chi tiết sản phẩm thực tế của Đồ thêu Thanh Hà.',
      images: ['/images/products/ten-anh-cua-ban.jpg'],
      stock: 10,
      featured: true,
      status: 'draft',
    },
  ],
  null,
  2
);
