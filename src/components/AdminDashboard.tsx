import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Check,
  CheckSquare,
  Download,
  Edit3,
  FileSpreadsheet,
  FolderUp,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Square,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import {
  PRODUCT_CATEGORIES,
  type AIClassificationResult,
  type Product,
  type ProductCategory,
  type ProductStatus,
} from '../types.ts';
import { apiUrl } from '../utils/api.ts';
import {
  SAMPLE_CSV_TEMPLATE,
  SAMPLE_JSON_TEMPLATE,
  cleanFileNameToProductName,
  exportProductsToCSV,
  formatVND,
  parseProductsCSV,
} from '../utils/format.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface AdminDashboardProps {
  onCatalogChanged: () => void;
}

type AdminTab = 'catalog' | 'upload' | 'bulk';

export function AdminDashboard({ onCatalogChanged }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('catalog');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'Tất cả' | ProductCategory>('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  // Edit modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Multi-image upload state
  const [autoClassifyOnUpload, setAutoClassifyOnUpload] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Manual single product creation state
  const [manualName, setManualName] = useState('');
  const [manualCategory, setManualCategory] = useState<ProductCategory>('Khăn vuông');
  const [manualPrice, setManualPrice] = useState('');
  const [manualDimensions, setManualDimensions] = useState('');
  const [manualMaterial, setManualMaterial] = useState('');
  const [manualColors, setManualColors] = useState('');
  const [manualPattern, setManualPattern] = useState('');
  const [manualUsage, setManualUsage] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualImagePath, setManualImagePath] = useState('');
  const [manualStock, setManualStock] = useState('10');

  // Bulk CSV/JSON import state
  const [bulkText, setBulkText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<Partial<Product>[]>([]);
  const [importingBulk, setImportingBulk] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/products?status=all'));
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Static mode');
      }
      const data = (await res.json()) as { products?: Product[] };
      setProducts(data.products ?? []);
    } catch {
      setNotice({
        type: 'error',
        text: 'Không kết nối được máy chủ quản trị (/api/products). Hãy chạy máy chủ Node.js hoặc cấu hình VITE_API_BASE_URL.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const stats = useMemo(() => {
    const published = products.filter((p) => p.status === 'published').length;
    const draft = products.filter((p) => p.status === 'draft').length;
    const aiClassified = products.filter((p) => p.aiClassified).length;
    return { total: products.length, published, draft, aiClassified };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (categoryFilter !== 'Tất cả' && p.category !== categoryFilter) return false;
      if (!q) return true;
      return [p.name, p.sku, p.category, p.material, p.pattern, p.usage]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [products, statusFilter, categoryFilter, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (
      filteredProducts.length > 0 &&
      filteredProducts.every((p) => selectedIds.has(p.id))
    ) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const runBatchAI = async (targetIds?: string[]) => {
    const ids = targetIds ?? Array.from(selectedIds);
    setAiBusy(true);
    setNotice(null);

    try {
      const res = await fetch(apiUrl('/api/ai/classify-batch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: ids.length > 0 ? ids : undefined,
          autoApply: true,
        }),
      });
      const data = (await res.json()) as {
        total?: number;
        succeeded?: number;
        failed?: number;
        results?: Array<{ id: string; success: boolean; error?: string }>;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi chạy AI phân loại hàng loạt.');
      }
      await loadProducts();
      onCatalogChanged();

      const firstError = data.results?.find((r) => !r.success)?.error;
      if ((data.failed ?? 0) > 0 && data.succeeded === 0) {
        setNotice({
          type: 'error',
          text: firstError || 'Không thể phân loại bằng AI. Vui lòng kiểm tra cấu hình GEMINI_API_KEY.',
        });
      } else {
        setNotice({
          type: 'success',
          text: `AI đã phân tích xong ${data.succeeded}/${data.total} sản phẩm. Hãy kiểm tra lại giá bán & kích thước trước khi duyệt đăng.`,
        });
      }
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Lỗi phân tích AI.',
      });
    } finally {
      setAiBusy(false);
    }
  };

  const handleBatchApprove = async (status: ProductStatus) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setNotice(null);

    try {
      const res = await fetch(apiUrl('/api/products/batch-approve'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status }),
      });
      if (!res.ok) throw new Error('Không thể cập nhật trạng thái hàng loạt.');
      await loadProducts();
      onCatalogChanged();
      setSelectedIds(new Set());
      setNotice({
        type: 'success',
        text:
          status === 'published'
            ? `Đã duyệt đăng ${ids.length} sản phẩm lên website.`
            : `Đã chuyển ${ids.length} sản phẩm về trạng thái Chờ duyệt.`,
      });
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Có lỗi xảy ra.',
      });
    }
  };

  const handleToggleSingleStatus = async (product: Product) => {
    const nextStatus: ProductStatus = product.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(apiUrl(`/api/products/${product.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Không thể đổi trạng thái sản phẩm.');
      await loadProducts();
      onCatalogChanged();
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Không thể cập nhật.',
      });
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      const res = await fetch(apiUrl(`/api/products/${product.id}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Không thể xóa sản phẩm.');
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
      await loadProducts();
      onCatalogChanged();
      setNotice({ type: 'success', text: `Đã xóa sản phẩm "${product.name}".` });
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Lỗi xóa sản phẩm.',
      });
    }
  };

  const handleSaveEdit = async (publishAfterSave: boolean) => {
    if (!editingProduct) return;
    setSavingEdit(true);
    setNotice(null);

    try {
      const payload: Product = {
        ...editingProduct,
        status: publishAfterSave ? 'published' : editingProduct.status,
      };
      const res = await fetch(apiUrl(`/api/products/${editingProduct.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Không thể lưu thay đổi sản phẩm.');
      setEditingProduct(null);
      await loadProducts();
      onCatalogChanged();
      setNotice({
        type: 'success',
        text: publishAfterSave
          ? `Đã lưu và đăng "${payload.name}" lên website.`
          : `Đã cập nhật thông tin "${payload.name}".`,
      });
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Lỗi khi lưu sản phẩm.',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleReclassifyEditing = async () => {
    if (!editingProduct) return;
    setAiBusy(true);
    try {
      const res = await fetch(apiUrl('/api/ai/classify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProduct.id,
          name: editingProduct.name,
          description: editingProduct.description,
          dimensions: editingProduct.dimensions,
          images: editingProduct.images,
        }),
      });
      const data = (await res.json()) as { result?: AIClassificationResult; error?: string };
      if (!res.ok || !data.result) {
        throw new Error(data.error || 'AI không thể phân tích sản phẩm này.');
      }
      const aiRes = data.result;
      setEditingProduct({
        ...editingProduct,
        name: aiRes.suggestedName || editingProduct.name,
        category: aiRes.category,
        material: aiRes.material,
        dimensions:
          editingProduct.dimensions && editingProduct.dimensions !== 'Cần cập nhật kích thước'
            ? editingProduct.dimensions
            : aiRes.dimensions,
        colors: aiRes.colors,
        style: aiRes.style,
        pattern: aiRes.pattern,
        usage: aiRes.usage,
        description: aiRes.suggestedDescription,
        aiClassified: true,
        aiConfidenceNote: aiRes.confidenceNote,
      });
      setNotice({
        type: 'success',
        text: 'AI đã điền lại thông tin phân loại. Vui lòng kiểm tra và bấm Lưu.',
      });
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Lỗi khi chạy AI.',
      });
    } finally {
      setAiBusy(false);
    }
  };

  const handleMultiImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    setNotice(null);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('images', file));

      const uploadRes = await fetch(apiUrl('/api/upload'), {
        method: 'POST',
        body: formData,
      });
      const uploadData = (await uploadRes.json()) as {
        files?: Array<{ url: string; originalName: string }>;
        error?: string;
      };

      if (!uploadRes.ok || !uploadData.files) {
        throw new Error(uploadData.error || 'Không thể tải ảnh lên máy chủ.');
      }

      const draftItems = uploadData.files.map((f) => ({
        name: cleanFileNameToProductName(f.originalName),
        category: 'Sản phẩm thêu khác' as ProductCategory,
        price: 0,
        dimensions: '',
        material: '',
        colors: ['Kem'],
        style: 'Truyền thống kết hợp hiện đại',
        pattern: '',
        usage: '',
        description: '',
        images: [f.url],
        stock: 10,
        featured: false,
        status: 'draft' as ProductStatus,
      }));

      const importRes = await fetch(apiUrl('/api/products/import'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: draftItems }),
      });
      const importData = (await importRes.json()) as {
        products?: Product[];
        error?: string;
      };
      if (!importRes.ok || !importData.products) {
        throw new Error(importData.error || 'Không thể tạo bản nháp từ ảnh.');
      }

      const createdIds = importData.products.map((p) => p.id);
      await loadProducts();
      setActiveTab('catalog');
      setStatusFilter('draft');

      if (autoClassifyOnUpload && createdIds.length > 0) {
        await runBatchAI(createdIds);
      } else {
        setNotice({
          type: 'success',
          text: `Đã tải lên ${createdIds.length} ảnh và tạo bản nháp trong mục Chờ duyệt.`,
        });
      }
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Lỗi tải ảnh.',
      });
    } finally {
      setUploadingFiles(false);
      e.target.value = '';
    }
  };

  const handleManualCreate = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    try {
      const res = await fetch(apiUrl('/api/products'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: manualName,
          category: manualCategory,
          price: Number(manualPrice) || 0,
          dimensions: manualDimensions,
          material: manualMaterial,
          colors: manualColors
            .split(/[,;|]/)
            .map((s) => s.trim())
            .filter(Boolean),
          pattern: manualPattern,
          usage: manualUsage,
          description: manualDescription,
          images: manualImagePath.trim() ? [manualImagePath.trim()] : [],
          stock: Number(manualStock) || 0,
          status: 'draft',
        }),
      });
      const data = (await res.json()) as { product?: Product; error?: string };
      if (!res.ok || !data.product) {
        throw new Error(data.error || 'Không thể thêm sản phẩm.');
      }
      setManualName('');
      setManualPrice('');
      setManualDimensions('');
      setManualMaterial('');
      setManualColors('');
      setManualPattern('');
      setManualUsage('');
      setManualDescription('');
      setManualImagePath('');
      await loadProducts();
      setActiveTab('catalog');
      setStatusFilter('draft');
      setNotice({
        type: 'success',
        text: `Đã thêm "${data.product.name}" vào danh sách Chờ duyệt.`,
      });
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Lỗi tạo sản phẩm.',
      });
    }
  };

  const parseBulkInput = (text: string) => {
    setBulkText(text);
    const trimmed = text.trim();
    if (!trimmed) {
      setParsedPreview([]);
      return;
    }
    try {
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        setParsedPreview(list as Partial<Product>[]);
      } else {
        setParsedPreview(parseProductsCSV(trimmed));
      }
    } catch {
      setParsedPreview([]);
    }
  };

  const handleBulkFileLoad = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    parseBulkInput(text);
    e.target.value = '';
  };

  const handleImportBulk = async (runAiAfter: boolean) => {
    if (parsedPreview.length === 0) return;
    setImportingBulk(true);
    setNotice(null);

    try {
      const res = await fetch(apiUrl('/api/products/import'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: parsedPreview }),
      });
      const data = (await res.json()) as {
        importedCount?: number;
        products?: Product[];
        error?: string;
      };
      if (!res.ok || !data.products) {
        throw new Error(data.error || 'Lỗi nhập dữ liệu hàng loạt.');
      }

      setBulkText('');
      setParsedPreview([]);
      await loadProducts();
      onCatalogChanged();
      setActiveTab('catalog');

      if (runAiAfter && data.products.length > 0) {
        await runBatchAI(data.products.map((p) => p.id));
      } else {
        setNotice({
          type: 'success',
          text: `Đã nhập thành công ${data.importedCount} sản phẩm vào hệ thống.`,
        });
      }
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Không thể nhập dữ liệu.',
      });
    } finally {
      setImportingBulk(false);
    }
  };

  const downloadTextFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="py-10 lg:py-14 bg-[#FAF6EE] min-h-[75vh]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E2D8C5]">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#7A1C24] mb-1">
              Bảng điều khiển quản trị
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#131B2E]">
              Quản lý sản phẩm & Phân loại AI
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={apiUrl('/api/export-source-zip')}
              download="do-theu-thanh-ha-source.zip"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#E2D8C5] bg-white text-[#131B2E] rounded-md hover:bg-[#F3ECE0] transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4 text-[#7A1C24]" />
              <span>Tải mã nguồn (.ZIP)</span>
            </a>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#7A1C24] text-[#FAF6EE] rounded-md hover:bg-[#5C1319] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Tải nhiều ảnh</span>
            </button>
            <button
              type="button"
              onClick={() => void runBatchAI()}
              disabled={aiBusy || stats.total === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#131B2E] text-[#FAF6EE] rounded-md hover:bg-[#131B2E]/90 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{aiBusy ? 'AI đang phân tích...' : 'AI Phân loại hàng loạt'}</span>
            </button>
          </div>
        </div>

        {/* Summary Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          <div className="bg-white border border-[#E2D8C5] rounded-lg p-4">
            <p className="text-xs text-[#465066]">Tổng sản phẩm trong kho</p>
            <p className="font-serif text-3xl font-semibold text-[#131B2E] mt-1 tabular-nums">
              {stats.total}
            </p>
          </div>
          <div className="bg-white border border-[#E2D8C5] rounded-lg p-4">
            <p className="text-xs text-[#465066]">Đã đăng bán trên web</p>
            <p className="font-serif text-3xl font-semibold text-[#131B2E] mt-1 tabular-nums">
              {stats.published}
            </p>
          </div>
          <div className="bg-white border border-[#E2D8C5] rounded-lg p-4">
            <p className="text-xs text-[#465066]">Chờ kiểm tra & duyệt</p>
            <p className="font-serif text-3xl font-semibold text-[#7A1C24] mt-1 tabular-nums">
              {stats.draft}
            </p>
          </div>
          <div className="bg-white border border-[#E2D8C5] rounded-lg p-4">
            <p className="text-xs text-[#465066]">Đã qua AI phân tích</p>
            <p className="font-serif text-3xl font-semibold text-[#131B2E] mt-1 tabular-nums">
              {stats.aiClassified}
            </p>
          </div>
        </div>

        {notice && (
          <div
            className={`mb-6 px-4 py-3 rounded-md border text-sm flex items-center justify-between gap-4 ${
              notice.type === 'error'
                ? 'bg-[#7A1C24]/10 border-[#7A1C24]/30 text-[#7A1C24]'
                : 'bg-white border-[#131B2E]/25 text-[#131B2E]'
            }`}
          >
            <span>{notice.text}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Đóng thông báo"
              className="p-1 hover:opacity-70 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Workspace Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#F3ECE0] border border-[#E2D8C5] rounded-lg w-fit mb-6 overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-white text-[#131B2E] shadow-xs'
                : 'text-[#465066] hover:text-[#131B2E]'
            }`}
          >
            Kho sản phẩm & Duyệt AI
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-[#131B2E] shadow-xs'
                : 'text-[#465066] hover:text-[#131B2E]'
            }`}
          >
            Tải nhiều ảnh & Thêm mới
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'bulk'
                ? 'bg-white text-[#131B2E] shadow-xs'
                : 'text-[#465066] hover:text-[#131B2E]'
            }`}
          >
            Nhập hàng loạt (CSV / JSON)
          </button>
        </div>

        {/* TAB 1: CATALOG & APPROVAL */}
        {activeTab === 'catalog' && (
          <div className="bg-white border border-[#E2D8C5] rounded-lg overflow-hidden">
            {/* Filter Toolbar */}
            <div className="p-4 border-b border-[#E2D8C5] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[220px]">
                  <Search className="w-4 h-4 text-[#465066] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên, mã SKU, họa tiết..."
                    className="pl-9 pr-3 py-1.5 text-sm bg-[#FAF6EE] border border-[#E2D8C5] rounded-md w-full focus:outline-none focus:border-[#7A1C24]"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | ProductStatus)}
                  className="px-3 py-1.5 text-sm bg-[#FAF6EE] border border-[#E2D8C5] rounded-md cursor-pointer"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="draft">Chờ duyệt ({stats.draft})</option>
                  <option value="published">Đã đăng bán ({stats.published})</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(e.target.value as 'Tất cả' | ProductCategory)
                  }
                  className="px-3 py-1.5 text-sm bg-[#FAF6EE] border border-[#E2D8C5] rounded-md cursor-pointer"
                >
                  <option value="Tất cả">Tất cả danh mục</option>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedIds.size > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => void runBatchAI()}
                      disabled={aiBusy}
                      className="px-3 py-1.5 text-xs font-medium bg-[#131B2E] text-[#FAF6EE] rounded-md hover:bg-[#131B2E]/90 cursor-pointer"
                    >
                      AI phân loại ({selectedIds.size})
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleBatchApprove('published')}
                      className="px-3 py-1.5 text-xs font-medium bg-[#7A1C24] text-[#FAF6EE] rounded-md hover:bg-[#5C1319] cursor-pointer"
                    >
                      Duyệt đăng ({selectedIds.size})
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() =>
                    downloadTextFile(
                      'products.json',
                      JSON.stringify(
                        products.filter((p) => p.status === 'published'),
                        null,
                        2
                      ),
                      'application/json;charset=utf-8;'
                    )
                  }
                  disabled={stats.published === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#E2D8C5] text-[#131B2E] rounded-md hover:bg-[#F3ECE0] disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất JSON (GitHub Pages)</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadTextFile(
                      'do-theu-thanh-ha-products.csv',
                      exportProductsToCSV(products),
                      'text/csv;charset=utf-8;'
                    )
                  }
                  disabled={products.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#E2D8C5] text-[#131B2E] rounded-md hover:bg-[#F3ECE0] disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => void loadProducts()}
                  aria-label="Làm mới danh sách"
                  className="p-1.5 border border-[#E2D8C5] text-[#131B2E] rounded-md hover:bg-[#F3ECE0] cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-[#465066]">
                Đang tải dữ liệu kho sản phẩm...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-serif text-2xl font-semibold text-[#131B2E] mb-2">
                  Chưa có sản phẩm nào trong mục này
                </p>
                <p className="text-sm text-[#465066] max-w-lg mx-auto mb-5">
                  Hãy tải lên ảnh sản phẩm thật của Đồ thêu Thanh Hà hoặc nhập dữ liệu hàng loạt từ
                  file CSV/JSON để bắt đầu phân loại bằng AI.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#7A1C24] text-[#FAF6EE] rounded-md hover:bg-[#5C1319] cursor-pointer"
                  >
                    <FolderUp className="w-4 h-4" />
                    <span>Tải nhiều ảnh ngay</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('bulk')}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#E2D8C5] text-[#131B2E] rounded-md hover:bg-[#F3ECE0] cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Nhập CSV / JSON</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#FAF6EE] border-b border-[#E2D8C5] text-xs font-semibold text-[#465066] uppercase tracking-wider">
                      <th className="py-3 px-4 w-10">
                        <button
                          type="button"
                          onClick={toggleSelectAllFiltered}
                          aria-label="Chọn tất cả"
                          className="text-[#131B2E] cursor-pointer"
                        >
                          {filteredProducts.every((p) => selectedIds.has(p.id)) ? (
                            <CheckSquare className="w-4 h-4 text-[#7A1C24]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 px-4">Sản phẩm</th>
                      <th className="py-3 px-4">Danh mục</th>
                      <th className="py-3 px-4">Chất liệu & Kích thước</th>
                      <th className="py-3 px-4 text-right">Giá bán</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2D8C5]">
                    {filteredProducts.map((p) => {
                      const isSelected = selectedIds.has(p.id);
                      return (
                        <tr key={p.id} className="hover:bg-[#FAF6EE]/70 transition-colors">
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => toggleSelect(p.id)}
                              aria-label={`Chọn ${p.name}`}
                              className="cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#7A1C24]" />
                              ) : (
                                <Square className="w-4 h-4 text-[#465066]" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3 min-w-[220px]">
                              <div className="w-12 h-12 rounded overflow-hidden border border-[#E2D8C5] bg-[#F3ECE0] shrink-0">
                                <ResilientImage
                                  src={p.images[0]}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-[#131B2E] truncate max-w-[240px]">
                                  {p.name}
                                </p>
                                <p className="text-xs text-[#465066] font-mono">
                                  {p.sku}
                                  {p.aiClassified ? ' · AI đã phân tích' : ''}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#131B2E] whitespace-nowrap">
                            {p.category}
                          </td>
                          <td className="py-3 px-4 text-xs text-[#465066] max-w-[220px]">
                            <p className="truncate text-[#131B2E]">{p.material || 'Chưa rõ chất liệu'}</p>
                            <p className="truncate">{p.dimensions || 'Chưa nhập kích thước'}</p>
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-[#131B2E] tabular-nums whitespace-nowrap">
                            {formatVND(p.price)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => void handleToggleSingleStatus(p)}
                              className={`text-xs font-medium underline underline-offset-4 cursor-pointer ${
                                p.status === 'published' ? 'text-[#131B2E]' : 'text-[#7A1C24]'
                              }`}
                            >
                              {p.status === 'published' ? 'Đã đăng bán' : 'Chờ duyệt'}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingProduct(p)}
                                title="Kiểm tra & Chỉnh sửa"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-[#E2D8C5] text-[#131B2E] rounded hover:bg-[#F3ECE0] cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Sửa / Duyệt</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteProduct(p)}
                                aria-label={`Xóa ${p.name}`}
                                className="p-1.5 text-[#465066] hover:text-[#7A1C24] rounded hover:bg-[#F3ECE0] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MULTI-IMAGE UPLOAD & SINGLE ADD */}
        {activeTab === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-white border border-[#E2D8C5] rounded-lg p-6">
              <h2 className="font-serif text-2xl font-semibold text-[#131B2E] mb-2">
                Tải lên nhiều ảnh cùng lúc
              </h2>
              <p className="text-sm text-[#465066] leading-relaxed mb-5">
                Chọn nhiều ảnh sản phẩm từ máy tính (tối đa 50 ảnh/lượt). Hệ thống sẽ tạo bản
                nháp và cho AI nhận diện loại sản phẩm, chất liệu, họa tiết, màu sắc và công dụng.
              </p>

              <label className="flex items-center gap-2.5 text-sm text-[#131B2E] mb-5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoClassifyOnUpload}
                  onChange={(e) => setAutoClassifyOnUpload(e.target.checked)}
                  className="accent-[#7A1C24] w-4 h-4"
                />
                <span>Tự động chạy AI phân loại ngay sau khi tải ảnh</span>
              </label>

              <label className="block border-2 border-dashed border-[#7A1C24]/35 bg-[#FAF6EE] hover:bg-[#F3ECE0] rounded-lg p-8 text-center transition-colors cursor-pointer">
                <UploadCloud className="w-8 h-8 text-[#7A1C24] mx-auto mb-3" />
                <p className="text-sm font-semibold text-[#131B2E]">
                  {uploadingFiles
                    ? 'Đang tải ảnh lên máy chủ...'
                    : 'Nhấn để chọn nhiều ảnh sản phẩm (JPG, PNG, WebP)'}
                </p>
                <p className="text-xs text-[#465066] mt-1">
                  Mẹo: Đặt tên tệp rõ ràng (VD: khan-vuong-hoa-sen-45cm.jpg) giúp AI nhận diện chuẩn hơn.
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={uploadingFiles || aiBusy}
                  onChange={handleMultiImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            <form
              onSubmit={handleManualCreate}
              className="lg:col-span-7 bg-white border border-[#E2D8C5] rounded-lg p-6 space-y-4"
            >
              <h2 className="font-serif text-2xl font-semibold text-[#131B2E]">
                Thêm từng sản phẩm thủ công
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#465066] mb-1">
                    Tên sản phẩm *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="VD: Khăn vuông linen thêu hoa sen"
                    className="w-full px-3 py-2 text-sm bg-[#FAF6EE] border border-[#E2D8C5] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#465066] mb-1">
                    Danh mục *
                  </label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 text-sm bg-[#FAF6EE] border border-[#E2D8C5] rounded-md"
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#465066] mb-1">
                    Giá bán (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    placeholder="320000"
                    className="w-full px-3 py-2 text-sm bg-[#FAF6EE] border border-[#E2D8C5] rounded-md tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#465066] mb-1">
                    Kích thước
                  </label>
                  <input
                    type="text"
                    value={manualDimensions}
                    onChange={(e) => setManualDimensions(e.target.value)}
                    placeholder="45 x 45 cm"
                    className="w-full px-3 py-2 text-sm bg-[#FAF6EE] border border-[#E2D8C5] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#465066] mb-1">
                    Chất liệu
                  </label>
                  <input
                    type="text"
                    value={manualMaterial}
                    onChange={(e) => setManualMaterial(e.target.value)}
                    placeholder="Vải linen mộc tự nhiên"
                    className="w-full px-3 py-2 text-sm bg-[#FAF6EE] border border-[#E2D8C5] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#465066] mb-1">
                    Màu sắc (ngăn cách dấu phẩy)
                  </label>
                  <input
                    type="text"
                    value={manualColors}
                    onChange={(e) => setManualColors(e.target.value)}
                    placeholder="Kem, Đỏ đô, Xanh đen"
                    className="w-full px-3 py-2 text-sm bg-[#FAF6EE] border border-[#E2D8C5] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#465066] mb-1">
                    Họa tiết thêu
                  </label>
                  <input
                    type="text"
                    value={manualPattern}
                    onChange={(e) => setManualPattern(e.target.value)}
                    placeholder="Hoa sen truyền thống"
                    className="w-full px-3 py-2 text-sm bg-[#FAF6EE] border border-[#E2D8C5] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#465066] mb-1">
                    Tồn kho
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={manualStock}
                    onChange={(e) => setManualStock(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FAF6EE] border border-[#E2D8C5] rounded-md tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#465066] mb-1">
                  Đường dẫn ảnh (từ /images/products/ hoặc /uploads/products/)
                </label>
                <input
                  type="text"
                  value={manualImagePath}
                  onChange={(e) => setManualImagePath(e.target.value)}
                  placeholder="/images/products/ten-anh.jpg"
                  className="w-full px-3 py-2 text-sm bg-[#FAF6EE] border border-[#E2D8C5] rounded-md font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#465066] mb-1">Công dụng</label>
                <input
                  type="text"
                  value={manualUsage}
                  onChange={(e) => setManualUsage(e.target.value)}
                  placeholder="Khăn tay, gói quà hoặc phụ kiện trang nhã"
                  className="w-full px-3 py-2 text-sm bg-[#FAF6EE] border border-[#E2D8C5] rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#465066] mb-1">Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  placeholder="Mô tả chi tiết đường thêu, cách bảo quản..."
                  className="w-full px-3 py-2 text-sm bg-[#FAF6EE] border border-[#E2D8C5] rounded-md"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#131B2E] text-[#FAF6EE] text-sm font-medium rounded-md hover:bg-[#131B2E]/90 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Lưu vào danh sách Chờ duyệt</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: BULK CSV / JSON IMPORT */}
        {activeTab === 'bulk' && (
          <div className="bg-white border border-[#E2D8C5] rounded-lg p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-[#131B2E]">
                  Nhập hàng loạt sản phẩm (CSV / JSON)
                </h2>
                <p className="text-sm text-[#465066] mt-1">
                  Hỗ trợ nhập cùng lúc hàng trăm sản phẩm. Tải tệp mẫu để điền đúng cấu trúc cột.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadTextFile(
                      'mau-nhap-san-pham-thanh-ha.csv',
                      SAMPLE_CSV_TEMPLATE,
                      'text/csv;charset=utf-8;'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-[#E2D8C5] rounded-md hover:bg-[#F3ECE0] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải file mẫu CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadTextFile(
                      'mau-nhap-san-pham-thanh-ha.json',
                      SAMPLE_JSON_TEMPLATE,
                      'application/json;charset=utf-8;'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-[#E2D8C5] rounded-md hover:bg-[#F3ECE0] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải file mẫu JSON</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 space-y-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[#F3ECE0] border border-[#E2D8C5] rounded-md cursor-pointer hover:bg-[#E2D8C5]">
                  <FileSpreadsheet className="w-4 h-4 text-[#7A1C24]" />
                  <span>Chọn tệp .csv hoặc .json từ máy</span>
                  <input
                    type="file"
                    accept=".csv,.json,text/csv,application/json"
                    onChange={handleBulkFileLoad}
                    className="hidden"
                  />
                </label>

                <textarea
                  rows={10}
                  value={bulkText}
                  onChange={(e) => parseBulkInput(e.target.value)}
                  placeholder="Hoặc dán trực tiếp nội dung CSV / JSON vào đây..."
                  className="w-full p-3 text-xs font-mono bg-[#FAF6EE] border border-[#E2D8C5] rounded-md focus:outline-none focus:border-[#7A1C24]"
                />
              </div>

              <div className="lg:col-span-6 bg-[#FAF6EE] border border-[#E2D8C5] rounded-md p-4 flex flex-col justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#131B2E] mb-2">
                    Xem trước dữ liệu nhận diện ({parsedPreview.length} sản phẩm)
                  </p>
                  {parsedPreview.length === 0 ? (
                    <p className="text-xs text-[#465066] leading-relaxed">
                      Chưa có dữ liệu hợp lệ. Hãy chọn tệp CSV/JSON hoặc dán nội dung theo đúng cấu
                      trúc mẫu để xem trước.
                    </p>
                  ) : (
                    <ul className="divide-y divide-[#E2D8C5] max-h-[220px] overflow-y-auto text-xs">
                      {parsedPreview.slice(0, 20).map((item, idx) => (
                        <li key={idx} className="py-2 flex justify-between gap-3">
                          <span className="font-medium text-[#131B2E] truncate">
                            {idx + 1}. {item.name || 'Chưa đặt tên'}
                          </span>
                          <span className="text-[#465066] shrink-0">
                            {item.category || 'Chưa phân loại'} ·{' '}
                            <span className="tabular-nums">{formatVND(item.price ?? 0)}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-[#E2D8C5] flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={parsedPreview.length === 0 || importingBulk}
                    onClick={() => void handleImportBulk(false)}
                    className="px-4 py-2 text-xs font-medium bg-[#131B2E] text-[#FAF6EE] rounded-md hover:bg-[#131B2E]/90 disabled:opacity-50 cursor-pointer"
                  >
                    Nhập vào kho
                  </button>
                  <button
                    type="button"
                    disabled={parsedPreview.length === 0 || importingBulk || aiBusy}
                    onClick={() => void handleImportBulk(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#7A1C24] text-[#FAF6EE] rounded-md hover:bg-[#5C1319] disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Nhập & Cho AI phân loại ngay</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EDIT & REVIEW MODAL */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-50 bg-[#131B2E]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          onClick={() => setEditingProduct(null)}
        >
          <div
            className="bg-[#FAF6EE] border border-[#E2D8C5] rounded-lg max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-[#FAF6EE] border-b border-[#E2D8C5] px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-[#7A1C24] font-medium uppercase tracking-wider">
                  Kiểm duyệt & Chỉnh sửa sản phẩm
                </p>
                <h3 className="font-serif text-2xl font-semibold text-[#131B2E]">
                  {editingProduct.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-2 hover:bg-[#F3ECE0] rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {editingProduct.aiConfidenceNote && (
                <div className="bg-white border border-[#E2D8C5] rounded-md p-3.5 text-xs text-[#465066]">
                  <strong className="text-[#131B2E]">Ghi chú phân tích từ AI: </strong>
                  {editingProduct.aiConfidenceNote}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
                <div className="sm:col-span-4">
                  <div className="aspect-[4/3] rounded-md overflow-hidden border border-[#E2D8C5] bg-[#F3ECE0]">
                    <ResilientImage
                      src={editingProduct.images[0]}
                      alt={editingProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleReclassifyEditing()}
                    disabled={aiBusy}
                    className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#131B2E] text-[#FAF6EE] rounded-md hover:bg-[#131B2E]/90 disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{aiBusy ? 'AI đang đọc ảnh...' : 'Phân tích lại bằng AI'}</span>
                  </button>
                </div>

                <div className="sm:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#465066] mb-1">
                      Tên sản phẩm
                    </label>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, name: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-[#E2D8C5] rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#465066] mb-1">
                      Danh mục
                    </label>
                    <select
                      value={editingProduct.category}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          category: e.target.value as ProductCategory,
                        })
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-[#E2D8C5] rounded-md"
                    >
                      {PRODUCT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#465066] mb-1">
                      Giá bán (VNĐ)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editingProduct.price}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          price: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-[#E2D8C5] rounded-md tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#465066] mb-1">
                      Kích thước
                    </label>
                    <input
                      type="text"
                      value={editingProduct.dimensions}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, dimensions: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-[#E2D8C5] rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#465066] mb-1">
                      Chất liệu
                    </label>
                    <input
                      type="text"
                      value={editingProduct.material}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, material: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-[#E2D8C5] rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#465066] mb-1">
                      Màu sắc (ngăn cách dấu phẩy)
                    </label>
                    <input
                      type="text"
                      value={editingProduct.colors.join(', ')}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          colors: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-[#E2D8C5] rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#465066] mb-1">
                      Họa tiết
                    </label>
                    <input
                      type="text"
                      value={editingProduct.pattern}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, pattern: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-[#E2D8C5] rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#465066] mb-1">
                      Kiểu dáng
                    </label>
                    <input
                      type="text"
                      value={editingProduct.style}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, style: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-[#E2D8C5] rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#465066] mb-1">
                      Tồn kho & Mã SKU
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min={0}
                        value={editingProduct.stock}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            stock: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-full px-3 py-2 text-sm bg-white border border-[#E2D8C5] rounded-md tabular-nums"
                      />
                      <input
                        type="text"
                        value={editingProduct.sku}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, sku: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#E2D8C5] rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#465066] mb-1">Công dụng</label>
                <input
                  type="text"
                  value={editingProduct.usage}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, usage: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E2D8C5] rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#465066] mb-1">
                  Mô tả sản phẩm
                </label>
                <textarea
                  rows={3}
                  value={editingProduct.description}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E2D8C5] rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#465066] mb-1">
                  Danh sách đường dẫn ảnh (mỗi dòng 1 ảnh)
                </label>
                <textarea
                  rows={2}
                  value={editingProduct.images.join('\n')}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      images: e.target.value
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#E2D8C5] rounded-md"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-[#131B2E] cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingProduct.featured}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, featured: e.target.checked })
                  }
                  className="accent-[#7A1C24] w-4 h-4"
                />
                <span>Đánh dấu là sản phẩm nổi bật</span>
              </label>

              <div className="pt-4 border-t border-[#E2D8C5] flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-sm font-medium border border-[#E2D8C5] rounded-md hover:bg-[#F3ECE0] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={() => void handleSaveEdit(false)}
                  className="px-4 py-2 text-sm font-medium bg-[#131B2E] text-[#FAF6EE] rounded-md hover:bg-[#131B2E]/90 cursor-pointer"
                >
                  Lưu thay đổi
                </button>
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={() => void handleSaveEdit(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium bg-[#7A1C24] text-[#FAF6EE] rounded-md hover:bg-[#5C1319] cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu & Duyệt đăng lên web</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
