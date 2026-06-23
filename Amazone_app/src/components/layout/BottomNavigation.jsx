import React from 'react';
import { Store, Heart, PlusCircle, HelpCircle, Gamepad2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useTelegram } from '../../hooks/useTelegram';

export default function BottomNavigation({ activeTab, setActiveTab }) {
    const { wishlistItems, clickerTaps } = useCart();
    const { triggerHapticImpact } = useTelegram();

    const handleTabClick = (tab) => {
        triggerHapticImpact('light');
        setActiveTab(tab);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-tg-bg border-t border-tg-secondary-bg px-2 py-2 shadow-lg">
            {/* Shop Tab */}
            <button
                onClick={() => handleTabClick('shop')}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all duration-150 active-press ${activeTab === 'shop'
                    ? 'text-tg-button font-bold'
                    : 'text-tg-hint hover:text-tg-text'
                    }`}
            >
                <Store className="w-5 h-5" />
                <span className="text-[10px]">Shop</span>
            </button>

            {/* Wishlist Tab */}
            <button
                onClick={() => handleTabClick('wishlist')}
                className={`relative flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all duration-150 active-press ${activeTab === 'wishlist'
                    ? 'text-tg-button font-bold'
                    : 'text-tg-hint hover:text-tg-text'
                    }`}
            >
                <Heart className="w-5 h-5" />
                {wishlistItems.length > 0 && (
                    <span className="absolute top-0 right-2 flex items-center justify-center h-4 min-w-[16px] px-1 text-[9px] font-bold text-white bg-red-500 rounded-full border border-tg-bg">
                        {wishlistItems.length}
                    </span>
                )}
                <span className="text-[10px]">Favorites</span>
            </button>

            {/* Earn Rewards Tab */}
            <button
                onClick={() => handleTabClick('earn')}
                className={`relative flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all duration-150 active-press ${activeTab === 'earn'
                    ? 'text-tg-button font-bold'
                    : 'text-tg-hint hover:text-tg-text'
                    }`}
            >
                <Gamepad2 className="w-5 h-5" />
                {clickerTaps > 0 && clickerTaps < 100 && (
                    <span className="absolute top-0 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                )}
                <span className="text-[10px]">Earn</span>
            </button>

            {/* Seller Panel Tab */}
            <button
                onClick={() => handleTabClick('seller')}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all duration-150 active-press ${activeTab === 'seller'
                    ? 'text-tg-button font-bold'
                    : 'text-tg-hint hover:text-tg-text'
                    }`}
            >
                <PlusCircle className="w-5 h-5" />
                <span className="text-[10px]">Seller Portal</span>
            </button>

            {/* FAQ / Personalization Tab */}
            <button
                onClick={() => handleTabClick('faq')}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all duration-150 active-press ${activeTab === 'faq'
                    ? 'text-tg-button font-bold'
                    : 'text-tg-hint hover:text-tg-text'
                    }`}
            >
                <HelpCircle className="w-5 h-5" />
                <span className="text-[10px]">Help</span>
            </button>
        </nav>
    );
}
