import React, { useState, useRef, useEffect } from 'react';
import { useTelegram } from '../../hooks/useTelegram';
import { useCart } from '../../context/CartContext';
import { ShoppingBag, User, Package, Search, X } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, searchQuery, setSearchQuery }) {
    const { user, triggerHapticImpact } = useTelegram();
    const { cartCount, orderHistory } = useCart();
    const [isSearching, setIsSearching] = useState(false);
    const searchInputRef = useRef(null);

    const handleTabClick = (tab) => {
        triggerHapticImpact('light');
        setActiveTab(tab);
        if (isSearching) {
            setIsSearching(false);
        }
    };

    const handleSearchIconClick = () => {
        triggerHapticImpact('medium');
        setIsSearching(true);
        setActiveTab('shop'); // automatically switch to shop
    };

    const handleCloseSearch = () => {
        triggerHapticImpact('light');
        setIsSearching(false);
        setSearchQuery('');
    };

    useEffect(() => {
        if (isSearching && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearching]);

    // Handle search input changes
    const handleInputChange = (e) => {
        setSearchQuery(e.target.value);
        if (activeTab !== 'shop') {
            setActiveTab('shop');
        }
    };

    return (
        <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-tg-bg border-b border-tg-secondary-bg shadow-sm h-14 overflow-hidden">
            {isSearching ? (
                /* Dynamic Full-Width Slide-in Search Bar */
                <div className="flex-1 flex items-center gap-2 animate-fade-in">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-tg-hint">
                            <Search className="w-4 h-4" />
                        </div>
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={handleInputChange}
                            placeholder="Type to search shop..."
                            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-tg-secondary-bg text-tg-text placeholder-tg-hint border-none focus:outline-none focus:ring-2 focus:ring-tg-button transition-all duration-150"
                        />
                        {searchQuery !== '' && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-tg-hint active-press hover:text-tg-text"
                                aria-label="Clear search text"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleCloseSearch}
                        className="px-2 py-1.5 text-xs font-bold text-tg-destructive rounded-lg hover:bg-tg-secondary-bg active-press shrink-0"
                    >
                        Cancel
                    </button>
                </div>
            ) : (
                <>
                    {/* User Profile Info - Telegram integrated */}
                    <div className="flex items-center gap-2 animate-fade-in">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-tg-button to-indigo-500 text-white font-black text-xs shadow-sm shrink-0">
                            {user?.photo_url ? (
                                <img
                                    src={user.photo_url}
                                    alt={user?.first_name || 'User'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        // Fallback if URL fails
                                        e.target.style.display = 'none';
                                    }}
                                />
                            ) : (
                                <span>{(user?.first_name || 'G')[0].toUpperCase()}</span>
                            )}
                        </div>
                        <div className="text-left min-w-0">
                            <p className="text-[9px] text-tg-hint font-black uppercase tracking-wider leading-none">Welcome,</p>
                            <p className="text-xs font-black text-tg-text mt-0.5 truncate max-w-[120px]">
                                {user?.first_name || 'Guest'}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 animate-fade-in shrink-0">
                        {/* Search Trigger Button */}
                        <button
                            onClick={handleSearchIconClick}
                            className="p-2 rounded-full bg-tg-secondary-bg text-tg-text active-press hover:bg-tg-secondary-bg/80"
                            aria-label="Search Shop"
                        >
                            <Search className="w-4.5 h-4.5" />
                        </button>

                        {/* Orders Tracking Shortcut */}
                        <button
                            onClick={() => handleTabClick('orders')}
                            className={`relative p-2 rounded-full active-press ${activeTab === 'orders' ? 'bg-tg-button text-tg-button-text' : 'bg-tg-secondary-bg text-tg-text'}`}
                            aria-label="View Orders"
                        >
                            <Package className="w-4.5 h-4.5" />
                            {orderHistory.length > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                            )}
                        </button>

                        {/* Shopping Cart Shortcut */}
                        <button
                            onClick={() => handleTabClick('cart')}
                            className={`relative p-2 rounded-full active-press ${activeTab === 'cart' ? 'bg-tg-button text-tg-button-text' : 'bg-tg-secondary-bg text-tg-text'}`}
                            aria-label="View Cart"
                        >
                            <ShoppingBag className="w-4.5 h-4.5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex items-center justify-center h-4.5 min-w-[18px] px-1 text-[9px] font-black text-tg-button-text bg-tg-button rounded-full border border-tg-bg">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </>
            )}
        </header>
    );
}
