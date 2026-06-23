import React, { useState } from 'react';
import { CartProvider } from './context/CartContext';
import Header from './components/layout/Header';
import BottomNavigation from './components/layout/BottomNavigation';
import ProductList from './components/product/ProductList';
import ProductDetail from './components/product/ProductDetail';
import CartView from './components/cart/CartView';
import WishlistView from './components/cart/WishlistView';
import OrdersView from './components/cart/OrdersView';
import SellerPortal from './components/seller/SellerPortal';
import FAQView from './components/layout/FAQView';
import EarnView from './components/layout/EarnView';

// Modals & Chat Drawers
import DailySpinModal from './components/modals/DailySpinModal';
import CompareModal from './components/modals/CompareModal';
import HelpBot from './components/layout/HelpBot';

// Icons
import { Gift, Sparkles, MessageCircle } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('shop');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [botInitialAction, setBotInitialAction] = useState(null);

  // Modals & Drawer state
  const [showSpinModal, setShowSpinModal] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showHelpBot, setShowHelpBot] = useState(false);

  // If tab changes, clear product selection to avoid confusing UX
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedProduct(null);
  };

  const handleToggleCompare = (product) => {
    setCompareList((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 2) {
        alert("You can compare up to 2 products at a time!");
        return prev;
      }
      return [...prev, product];
    });
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'shop':
        return (
          <ProductList
            onProductClick={setSelectedProduct}
            compareList={compareList}
            onToggleCompare={handleToggleCompare}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        );
      case 'wishlist':
        return (
          <WishlistView
            onProductClick={setSelectedProduct}
            setActiveTab={handleTabChange}
          />
        );
      case 'orders':
        return <OrdersView setActiveTab={handleTabChange} />;
      case 'seller':
        return <SellerPortal onProductAdded={() => handleTabChange('shop')} />;
      case 'faq':
        return <FAQView />;
      case 'earn':
        return <EarnView />;
      case 'cart':
        return (
          <CartView
            setActiveTab={handleTabChange}
            onStartBotNegotiation={() => {
              setBotInitialAction('negotiate');
              setShowHelpBot(true);
            }}
          />
        );
      default:
        return (
          <ProductList
            onProductClick={setSelectedProduct}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-tg-bg text-tg-text relative">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        {selectedProduct ? (
          <ProductDetail
            product={selectedProduct}
            onBack={() => setSelectedProduct(null)}
            setSelectedProduct={setSelectedProduct}
            compareList={compareList}
            onToggleCompare={handleToggleCompare}
          />
        ) : (
          renderActiveTabContent()
        )}
      </main>

      {/* Chat Bot Support Floating Button */}
      {!selectedProduct && (
        <button
          onClick={() => setShowHelpBot(true)}
          className="fixed bottom-36 right-4 z-40 w-11 h-11 rounded-full bg-tg-secondary-bg text-tg-text border border-tg-secondary-bg flex items-center justify-center shadow-lg active-press"
          aria-label="Open Chatbot Assistant"
        >
          <MessageCircle className="w-5 h-5 text-tg-button animate-pulse" />
        </button>
      )}

      {/* Daily Spin Floating Button */}
      {!selectedProduct && activeTab === 'shop' && (
        <button
          onClick={() => setShowSpinModal(true)}
          className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-tg-button text-tg-button-text flex items-center justify-center shadow-xl border-2 border-tg-bg animate-bounce active-press"
          aria-label="Daily Spin Wheel"
        >
          <Gift className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
        </button>
      )}

      {/* Floating Compare Action Bar */}
      {!selectedProduct && compareList.length > 0 && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40 bg-tg-secondary-bg border border-tg-button/30 shadow-xl px-4 py-2 rounded-full flex items-center gap-3 animate-fade-in backdrop-blur-md">
          <p className="text-[10px] font-bold text-tg-text">
            Compare: <span className="text-tg-button font-black">{compareList.length}/2</span> Selected
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCompareModal(true)}
              className="px-3 py-1 bg-tg-button text-tg-button-text text-[10px] font-black rounded-full active-press flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Compare Now</span>
            </button>
            <button
              onClick={() => setCompareList([])}
              className="px-2 py-1 bg-tg-bg text-tg-hint text-[10px] font-bold rounded-full active-press border border-tg-secondary-bg"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Modals & Slide Drawers Mounting */}
      {showSpinModal && (
        <DailySpinModal onClose={() => setShowSpinModal(false)} />
      )}

      {showCompareModal && (
        <CompareModal
          products={compareList}
          onClose={() => {
            setShowCompareModal(false);
            setCompareList([]);
          }}
        />
      )}

      {showHelpBot && (
        <HelpBot
          onClose={() => {
            setShowHelpBot(false);
            setBotInitialAction(null);
          }}
          initialAction={botInitialAction}
          onClearInitialAction={() => setBotInitialAction(null)}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} setActiveTab={handleTabChange} />
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}
