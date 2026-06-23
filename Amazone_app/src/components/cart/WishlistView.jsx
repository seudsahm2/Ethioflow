import React from 'react';
import { useCart } from '../../context/CartContext';
import { useTelegram } from '../../hooks/useTelegram';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';

export default function WishlistView({ onProductClick, setActiveTab }) {
    const { wishlistItems, toggleWishlist, addToCart } = useCart();
    const { triggerHapticImpact } = useTelegram();

    const handleAddToCart = (e, product) => {
        e.stopPropagation();
        addToCart(product);
        triggerHapticImpact('medium');
    };

    const handleRemove = (e, product) => {
        e.stopPropagation();
        toggleWishlist(product);
        triggerHapticImpact('light');
    };

    if (!wishlistItems || wishlistItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 px-4 py-16 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-tg-secondary-bg text-tg-hint mb-4">
                    <Heart className="w-8 h-8 text-tg-hint" />
                </div>
                <h2 className="text-lg font-bold text-tg-text mb-1">Your Wishlist is Empty</h2>
                <p className="text-sm text-tg-hint max-w-[240px] leading-relaxed mb-6">
                    Tap the heart icon on any product to save your favorite items here.
                </p>
                <button
                    onClick={() => setActiveTab('shop')}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-tg-button-text bg-tg-button shadow-sm active-press"
                >
                    Explore Products
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 px-4 py-3 pb-32">
            <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-red-500 fill-current" />
                <h2 className="text-base font-bold text-tg-text">Your Favorites</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 animate-fade-in">
                {wishlistItems.map((product) => (
                    <div
                        key={product.id}
                        onClick={() => onProductClick(product)}
                        className="flex flex-col bg-tg-bg border border-tg-secondary-bg rounded-2xl p-2.5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer relative"
                    >
                        {/* Remove Action */}
                        <button
                            onClick={(e) => handleRemove(e, product)}
                            className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-black/45 text-white backdrop-blur-md active-press"
                            aria-label="Remove from Favorites"
                        >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>

                        {/* Visual Image/Block with Real Picture */}
                        <div className="h-28 rounded-xl bg-tg-secondary-bg mb-2.5 overflow-hidden flex items-center justify-center relative shadow-inner">
                            {product.image ? (
                                <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className={`w-full h-full flex items-center justify-center ${product.color || 'bg-slate-700'}`}>
                                    <span className="text-white text-xs font-bold">Item</span>
                                </div>
                            )}
                        </div>

                        {/* Title and Category */}
                        <div className="flex-1 text-left min-w-0">
                            <span className="text-[9px] font-bold text-tg-hint uppercase tracking-wider block mb-0.5">
                                {product.category}
                            </span>
                            <h3 className="text-xs font-semibold text-tg-text line-clamp-1 mb-1">
                                {product.title}
                            </h3>
                            <p className="text-xs font-bold text-tg-button">
                                ${product.price.toFixed(2)}
                            </p>
                        </div>

                        {/* Add to Cart CTA */}
                        <button
                            onClick={(e) => handleAddToCart(e, product)}
                            className="w-full mt-3 py-2 bg-tg-button text-tg-button-text text-xs font-bold rounded-xl flex items-center justify-center gap-1 active-press"
                        >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Add to Cart</span>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
