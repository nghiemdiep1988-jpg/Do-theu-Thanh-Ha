import fs from 'fs';
import path from 'path';
import type { OrderRecord, Product } from '../src/types.ts';

const ROOT_DIR = process.cwd();
export const DATA_DIR = path.join(ROOT_DIR, 'data');
export const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
export const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
export const UPLOADS_PRODUCTS_DIR = path.join(ROOT_DIR, 'uploads', 'products');
export const PUBLIC_PRODUCTS_IMAGES_DIR = path.join(ROOT_DIR, 'public', 'images', 'products');

export function ensureStorageDirectories(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_PRODUCTS_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_PRODUCTS_IMAGES_DIR, { recursive: true });

  if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, '[]', 'utf-8');
  }
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, '[]', 'utf-8');
  }
}

export function readProducts(): Product[] {
  ensureStorageDirectories();
  try {
    const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Product[]) : [];
  } catch {
    return [];
  }
}

export function writeProducts(products: Product[]): void {
  ensureStorageDirectories();
  const tempPath = `${PRODUCTS_FILE}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(products, null, 2), 'utf-8');
  fs.renameSync(tempPath, PRODUCTS_FILE);
}

export function getPublishedProducts(): Product[] {
  return readProducts().filter((p) => p.status === 'published');
}

export function upsertProduct(product: Product): Product {
  const products = readProducts();
  const idx = products.findIndex((p) => p.id === product.id);
  if (idx >= 0) {
    products[idx] = product;
  } else {
    products.unshift(product);
  }
  writeProducts(products);
  return product;
}

export function upsertManyProducts(incoming: Product[]): Product[] {
  const products = readProducts();
  const map = new Map<string, Product>(products.map((p) => [p.id, p]));
  for (const item of incoming) {
    map.set(item.id, item);
  }
  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  writeProducts(merged);
  return incoming;
}

export function deleteProductById(id: string): boolean {
  const products = readProducts();
  const filtered = products.filter((p) => p.id !== id);
  if (filtered.length === products.length) {
    return false;
  }
  writeProducts(filtered);
  return true;
}

export function readOrders(): OrderRecord[] {
  ensureStorageDirectories();
  try {
    const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OrderRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveOrder(order: OrderRecord): OrderRecord {
  const orders = readOrders();
  orders.unshift(order);
  const tempPath = `${ORDERS_FILE}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(orders, null, 2), 'utf-8');
  fs.renameSync(tempPath, ORDERS_FILE);
  return order;
}
