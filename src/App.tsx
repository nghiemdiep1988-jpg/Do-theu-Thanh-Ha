import { useCallback, useEffect, useMemo, useState } from 'react';
import { AIChatWidget } from './components/AIChatWidget.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { Footer } from './components/Footer.tsx';
import { GuideSection } from './components/GuideSection.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { Navbar, type ActivePage } from './components/Navbar.tsx';
import { ProductCatalog } from './components/ProductCatalog.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { StorySection } from './components/StorySection.tsx';
import type { CartItem, Product, ProductCategory } from './types.ts';
import { fetchPublishedProducts } from './utils/api.ts';

const CART_STORAGE_KEY = 'thanh_ha_cart_v1';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('storefront');
  const [publishedProducts, setPublishedProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'Tất cả' | ProductCategory>('Tất cả');
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed as CartItem[];
      }
    } catch {
      // Ignore invalid localStorage
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Ignore storage quota errors
    }
  }, [cartItems]);

  const fetchCatalog = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const { products } = await fetchPublishedProducts();
      setPublishedProducts(products);
    } catch {
      setPublishedProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    void fetchCatalog();
  }, [fetchCatalog]);

  const handleNavigate = (page: ActivePage, sectionId?: string) => {
    setActivePage(page);
    if (sectionId) {
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 40);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddToCart = (product: Product, quantity = 1, customEmbroideryNote?: string) => {
    setCartItems((prev) => {
      const idx = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          (item.customEmbroideryNote || '') === (customEmbroideryNote || '')
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + quantity,
        };
        return updated;
      }
      return [...prev, { product, quantity, customEmbroideryNote }];
    });
    setCartOpen(true);
  };

  const handleUpdateCartQuantity = (index: number, delta: number) => {
    setCartItems((prev) => {
      const next = [...prev];
      const target = next[index];
      if (!target) return prev;
      const newQty = target.quantity + delta;
      if (newQty <= 0) {
        next.splice(index, 1);
      } else {
        next[index] = { ...target, quantity: newQty };
      }
      return next;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalCartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const similarProducts = useMemo(() => {
    if (!detailProduct) return [];
    return publishedProducts
      .filter((p) => p.id !== detailProduct.id && p.category === detailProduct.category)
      .slice(0, 3);
  }, [detailProduct, publishedProducts]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6EE] text-[#131B2E]">
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        cartCount={totalCartCount}
        onOpenCart={() => setCartOpen(true)}
      />

      <main className="flex-1">
        {activePage === 'storefront' && (
          <>
            <HeroSection
              publishedCount={publishedProducts.length}
              onExploreProducts={() => handleNavigate('storefront', 'san-pham')}
              onOpenStory={() => handleNavigate('storefront', 'cau-chuyen')}
              onOpenAdmin={() => handleNavigate('admin')}
            />

            <ProductCatalog
              products={publishedProducts}
              loading={loadingProducts}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onViewProduct={setDetailProduct}
              onAddToCart={(product) => handleAddToCart(product, 1)}
              onOpenAdmin={() => handleNavigate('admin')}
              onOpenGuide={() => handleNavigate('guide')}
            />

            <StorySection />
          </>
        )}

        {activePage === 'admin' && (
          <AdminDashboard onCatalogChanged={() => void fetchCatalog()} />
        )}

        {activePage === 'guide' && <GuideSection onOpenAdmin={() => handleNavigate('admin')} />}
      </main>

      <Footer
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          handleNavigate('storefront', 'san-pham');
        }}
        onNavigate={handleNavigate}
      />

      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          similarProducts={similarProducts}
          onClose={() => setDetailProduct(null)}
          onAddToCart={handleAddToCart}
          onSelectProduct={setDetailProduct}
        />
      )}

      <CartDrawer
        isOpen={cartOpen}
        items={cartItems}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={() => setCartItems([])}
      />

      <AIChatWidget
        publishedCount={publishedProducts.length}
        onViewProduct={(prod) => setDetailProduct(prod)}
        onAddToCart={(prod) => handleAddToCart(prod, 1)}
      />
    </div>
  );
}
