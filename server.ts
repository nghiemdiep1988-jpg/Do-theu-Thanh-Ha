import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import JSZip from 'jszip';
import multer from 'multer';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  AIError,
  chatWithAdvisor,
  classifyBatchWithAI,
  classifyProductWithAI,
  type ChatTurnInput,
  type ClassifyInput,
} from './server/ai.ts';
import {
  UPLOADS_PRODUCTS_DIR,
  deleteProductById,
  ensureStorageDirectories,
  getPublishedProducts,
  readOrders,
  readProducts,
  saveOrder,
  upsertManyProducts,
  upsertProduct,
  writeProducts,
} from './server/storage.ts';
import {
  PRODUCT_CATEGORIES,
  type OrderRecord,
  type Product,
  type ProductCategory,
  type ProductStatus,
} from './src/types.ts';

const PORT = Number(process.env.PORT || 3000);

ensureStorageDirectories();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_PRODUCTS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const base =
      path
        .basename(file.originalname, ext)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'san-pham';
    const unique = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    cb(null, `${base}-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 12 * 1024 * 1024,
    files: 50,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ tải lên tệp hình ảnh (JPG, PNG, WebP).'));
    }
  },
});

function sanitizeCategory(raw: unknown): ProductCategory {
  const val = String(raw ?? '').trim();
  const matched = PRODUCT_CATEGORIES.find((c) => c.toLowerCase() === val.toLowerCase());
  return matched ?? 'Sản phẩm thêu khác';
}

function sanitizeStatus(raw: unknown): ProductStatus {
  return raw === 'published' ? 'published' : 'draft';
}

function normalizeProductInput(raw: Partial<Product>, existing?: Product): Product {
  const now = new Date().toISOString();
  const id = raw.id?.trim() || existing?.id || `TH-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
  const sku =
    raw.sku?.trim() ||
    existing?.sku ||
    `TH-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const colors = Array.isArray(raw.colors)
    ? raw.colors.map((c) => String(c).trim()).filter(Boolean)
    : typeof raw.colors === 'string'
      ? String(raw.colors)
          .split(/[,;|]/)
          .map((c) => c.trim())
          .filter(Boolean)
      : existing?.colors ?? ['Kem'];

  const images = Array.isArray(raw.images)
    ? raw.images.map((i) => String(i).trim()).filter(Boolean)
    : existing?.images ?? [];

  return {
    id,
    sku,
    name: String(raw.name ?? existing?.name ?? 'Sản phẩm chưa đặt tên').trim(),
    category: sanitizeCategory(raw.category ?? existing?.category),
    price: Math.max(0, Number(raw.price ?? existing?.price ?? 0) || 0),
    dimensions: String(raw.dimensions ?? existing?.dimensions ?? '').trim(),
    material: String(raw.material ?? existing?.material ?? '').trim(),
    colors,
    style: String(raw.style ?? existing?.style ?? '').trim(),
    pattern: String(raw.pattern ?? existing?.pattern ?? '').trim(),
    usage: String(raw.usage ?? existing?.usage ?? '').trim(),
    description: String(raw.description ?? existing?.description ?? '').trim(),
    images,
    stock: Math.max(0, Math.floor(Number(raw.stock ?? existing?.stock ?? 0) || 0)),
    featured: Boolean(raw.featured ?? existing?.featured ?? false),
    status: sanitizeStatus(raw.status ?? existing?.status ?? 'draft'),
    aiClassified: raw.aiClassified ?? existing?.aiClassified ?? false,
    aiConfidenceNote: raw.aiConfidenceNote ?? existing?.aiConfidenceNote,
    createdAt: existing?.createdAt ?? raw.createdAt ?? now,
    updatedAt: now,
  };
}

function addDirectoryToZip(zip: JSZip, rootDir: string, currentRel = ''): void {
  const skipDirs = new Set(['node_modules', 'dist', '.git', '.aistudio']);
  const fullPath = path.join(rootDir, currentRel);
  if (!fs.existsSync(fullPath)) return;

  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.env') && entry.name !== '.env.example') continue;
    if (entry.name === '.DS_Store') continue;

    const relPath = currentRel ? `${currentRel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      addDirectoryToZip(zip, rootDir, relPath);
    } else if (entry.isFile()) {
      const content = fs.readFileSync(path.join(rootDir, relPath));
      zip.file(relPath, content);
    }
  }
}

async function startServer() {
  const app = express();

  // CORS middleware for GitHub Pages hybrid frontend -> Express AI backend
  const extraOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (
      origin &&
      (origin.endsWith('.github.io') ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1') ||
        extraOrigins.includes(origin))
    ) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  app.use(express.json({ limit: '25mb' }));
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  app.use('/images', express.static(path.join(process.cwd(), 'public', 'images')));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'do-theu-thanh-ha' });
  });

  // Download complete runnable project source code as ZIP
  app.get('/api/export-source-zip', async (_req, res) => {
    try {
      const zip = new JSZip();
      const rootDir = process.cwd();
      addDirectoryToZip(zip, rootDir);

      // Ensure static GitHub Pages fallback data reflects current published products
      const published = getPublishedProducts();
      zip.file('public/data/products.json', JSON.stringify(published, null, 2));

      const buffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="do-theu-thanh-ha-source.zip"');
      res.send(buffer);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Không thể đóng gói mã nguồn ZIP.',
      });
    }
  });

  // Products CRUD
  app.get('/api/products', (req, res) => {
    const statusFilter = req.query.status;
    const all = readProducts();
    if (statusFilter === 'published') {
      return res.json({ products: all.filter((p) => p.status === 'published') });
    }
    if (statusFilter === 'draft') {
      return res.json({ products: all.filter((p) => p.status === 'draft') });
    }
    return res.json({ products: all });
  });

  app.post('/api/products', (req, res) => {
    try {
      const product = normalizeProductInput(req.body as Partial<Product>);
      upsertProduct(product);
      return res.status(201).json({ product });
    } catch (err) {
      return res.status(400).json({
        error: err instanceof Error ? err.message : 'Không thể tạo sản phẩm.',
      });
    }
  });

  app.post('/api/products/import', (req, res) => {
    try {
      const body = req.body as { products?: Partial<Product>[] };
      if (!Array.isArray(body.products) || body.products.length === 0) {
        return res.status(400).json({ error: 'Danh sách sản phẩm nhập vào đang trống.' });
      }
      const existingAll = readProducts();
      const existingMap = new Map(existingAll.map((p) => [p.id, p]));
      const normalized = body.products.map((item) =>
        normalizeProductInput(item, item.id ? existingMap.get(item.id) : undefined)
      );
      upsertManyProducts(normalized);
      return res.status(201).json({
        importedCount: normalized.length,
        products: normalized,
      });
    } catch (err) {
      return res.status(400).json({
        error: err instanceof Error ? err.message : 'Lỗi khi nhập hàng loạt sản phẩm.',
      });
    }
  });

  app.put('/api/products/:id', (req, res) => {
    const products = readProducts();
    const existing = products.find((p) => p.id === req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });
    }
    const updated = normalizeProductInput({ ...req.body, id: existing.id }, existing);
    upsertProduct(updated);
    return res.json({ product: updated });
  });

  app.post('/api/products/batch-approve', (req, res) => {
    const body = req.body as { ids?: string[]; status?: ProductStatus };
    if (!Array.isArray(body.ids) || body.ids.length === 0) {
      return res.status(400).json({ error: 'Vui lòng chọn ít nhất một sản phẩm.' });
    }
    const targetStatus: ProductStatus = body.status === 'draft' ? 'draft' : 'published';
    const idSet = new Set(body.ids);
    const now = new Date().toISOString();
    const products = readProducts().map((p) =>
      idSet.has(p.id) ? { ...p, status: targetStatus, updatedAt: now } : p
    );
    writeProducts(products);
    return res.json({ updatedCount: body.ids.length, status: targetStatus });
  });

  app.delete('/api/products/:id', (req, res) => {
    const ok = deleteProductById(req.params.id);
    if (!ok) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm để xóa.' });
    }
    return res.json({ deleted: true, id: req.params.id });
  });

  app.post('/api/upload', upload.array('images', 50), (req, res) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length === 0) {
      return res.status(400).json({ error: 'Chưa chọn tệp ảnh nào để tải lên.' });
    }
    const uploaded = files.map((file) => ({
      url: `/uploads/products/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
    }));
    return res.status(201).json({ files: uploaded });
  });

  app.post('/api/ai/classify', async (req, res) => {
    try {
      const input = req.body as ClassifyInput;
      const result = await classifyProductWithAI(input);
      return res.json({ result });
    } catch (err) {
      const status = err instanceof AIError ? err.status : 500;
      const message = err instanceof Error ? err.message : 'Lỗi phân loại AI.';
      return res.status(status).json({ error: message });
    }
  });

  app.post('/api/ai/classify-batch', async (req, res) => {
    try {
      const body = req.body as { productIds?: string[]; autoApply?: boolean };
      const allProducts = readProducts();
      const targetProducts =
        Array.isArray(body.productIds) && body.productIds.length > 0
          ? allProducts.filter((p) => body.productIds!.includes(p.id))
          : allProducts.filter((p) => p.status === 'draft');

      if (targetProducts.length === 0) {
        return res.status(400).json({ error: 'Không có sản phẩm nào để phân tích AI.' });
      }

      const inputs: ClassifyInput[] = targetProducts.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        dimensions: p.dimensions,
        images: p.images,
      }));

      const results = await classifyBatchWithAI(inputs);

      if (body.autoApply !== false) {
        const resultMap = new Map(results.filter((r) => r.success && r.result).map((r) => [r.id, r.result!]));
        const now = new Date().toISOString();
        const updatedProducts = allProducts.map((p) => {
          const aiRes = resultMap.get(p.id);
          if (!aiRes) return p;
          return {
            ...p,
            name: aiRes.suggestedName || p.name,
            category: aiRes.category,
            material: aiRes.material,
            dimensions: p.dimensions && p.dimensions !== 'Cần cập nhật kích thước' ? p.dimensions : aiRes.dimensions,
            colors: aiRes.colors,
            style: aiRes.style,
            pattern: aiRes.pattern,
            usage: aiRes.usage,
            description: aiRes.suggestedDescription,
            aiClassified: true,
            aiConfidenceNote: aiRes.confidenceNote,
            updatedAt: now,
          };
        });
        writeProducts(updatedProducts);
      }

      return res.json({
        total: results.length,
        succeeded: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      });
    } catch (err) {
      const status = err instanceof AIError ? err.status : 500;
      const message = err instanceof Error ? err.message : 'Lỗi phân tích hàng loạt.';
      return res.status(status).json({ error: message });
    }
  });

  app.post('/api/ai/chat', async (req, res) => {
    try {
      const body = req.body as { message?: string; history?: ChatTurnInput[] };
      const message = String(body.message ?? '').trim();
      if (!message) {
        return res.status(400).json({ error: 'Vui lòng nhập câu hỏi cần tư vấn.' });
      }
      const publishedProducts = getPublishedProducts();
      const history = Array.isArray(body.history) ? body.history : [];
      const advisorResponse = await chatWithAdvisor(message, history, publishedProducts);
      return res.json(advisorResponse);
    } catch (err) {
      const status = err instanceof AIError ? err.status : 500;
      const message = err instanceof Error ? err.message : 'Lỗi kết nối trợ lý AI.';
      return res.status(status).json({ error: message });
    }
  });

  app.get('/api/orders', (_req, res) => {
    res.json({ orders: readOrders() });
  });

  app.post('/api/orders', (req, res) => {
    const body = req.body as Partial<OrderRecord>;
    if (!body.customerName?.trim() || !body.customerPhone?.trim() || !body.customerAddress?.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ.' });
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json({ error: 'Giỏ hàng đang trống.' });
    }

    const subtotal = body.items.reduce(
      (sum, item) => sum + Math.max(0, Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1),
      0
    );
    const shippingFee = subtotal >= 1000000 || subtotal === 0 ? 0 : 30000;
    const order: OrderRecord = {
      id: `TH-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
      customerAddress: body.customerAddress.trim(),
      paymentMethod: body.paymentMethod === 'BANK_TRANSFER' ? 'BANK_TRANSFER' : 'COD',
      note: body.note?.trim() || '',
      items: body.items,
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      createdAt: new Date().toISOString(),
    };

    saveOrder(order);
    return res.status(201).json({ order });
  });

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(400).json({ error: err.message || 'Yêu cầu không hợp lệ.' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Đồ thêu Thanh Hà server listening on http://localhost:${PORT}`);
  });
}

startServer();
