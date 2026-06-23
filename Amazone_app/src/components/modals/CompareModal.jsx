import React from 'react';
import { useCart } from '../../context/CartContext';
import { useTelegram } from '../../hooks/useTelegram';
import { X, ShoppingCart, Check, HelpCircle } from 'lucide-react';

export default function CompareModal({ products, onClose }) {
    const { addToCart, cartItems } = useCart();
    const { triggerHapticImpact } = useTelegram();

    if (!products || products.length === 0) return null;

    const handleAddToCart = (p) => {
        addToCart(p);
        triggerHapticImpact('light');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
            <div className="w-full max-w-lg bg-tg-bg border-t sm:border border-tg-secondary-bg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-tg-secondary-bg bg-tg-secondary-bg/20">
                    <div>
                        <h2 className="text-sm font-black text-tg-text">Compare Products</h2>
                        <p className="text-[10px] text-tg-hint">Side-by-side spec comparison</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full bg-tg-secondary-bg text-tg-hint active-press hover:text-tg-text"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Main comparison grid */}
                <div className="flex-1 overflow-x-auto overflow-y-auto p-4 scrollbar-hide">
                    <div className="min-w-[480px] grid grid-cols-3 gap-3">
                        {/* Empty label column */}
                        <div className="space-y-4 text-[11px] font-bold text-tg-hint uppercase tracking-wider pt-24 text-left">
                            <div className="h-10 flex items-center">Price</div>
                            <div className="h-8 flex items-center">Category</div>
                            <div className="h-24 flex items-start pt-2">Description</div>
                            <div className="h-12 flex items-center">In Cart</div>
                        </div>

                        {/* Product Spec columns */}
                        {products.slice(0, 2).map((product) => {
                            const isAdded = cartItems.some(item => item.id === product.id);
                            const qty = cartItems.find(item => item.id === product.id)?.quantity || 0;
                            return (
                                <div key={product.id} className="flex flex-col border border-tg-secondary-bg bg-tg-bg rounded-2xl p-3 text-center">
                                    {/* Visual block with Real Image */}
                                    <div className={`relative h-20 rounded-xl ${product.color || 'bg-slate-700'} mb-2 flex items-center justify-center overflow-hidden`}>
                                        {product.image ? (
                                            <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-white font-extrabold text-xs px-2 line-clamp-1">{product.title}</span>
                                        )}
                                    </div>
                                    <h3 className="text-xs font-bold text-tg-text line-clamp-1 mb-3">{product.title}</h3>

                                    {/* specs rows */}
                                    <div className="space-y-4 text-xs font-medium text-tg-text text-center">
                                        {/* Price */}
                                        <div className="h-10 flex items-center justify-center font-extrabold text-tg-button">
                                            ${product.price.toFixed(2)}
                                        </div>

                                        {/* Category */}
                                        <div className="h-8 flex items-center justify-center text-[11px] text-tg-hint font-bold">
                                            {product.category}
                                        </div>

                                        {/* Description */}
                                        <div className="h-24 text-[10px] text-tg-hint line-clamp-4 leading-relaxed text-left overflow-y-auto pr-1">
                                            {product.description}
                                        </div>

                                        {/* Cart count state */}
                                        <div className="h-12 flex items-center justify-center">
                                            {qty > 0 ? (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                                                    <Check className="w-3 h-3" />
                                                    <span>{qty} Added</span>
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-tg-hint bg-tg-secondary-bg/50 px-2 py-1 rounded-full">
                                                    Not Added
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action button */}
                                    <button
                                        onClick={() => handleAddToCart(product)}
                                        className="w-full mt-3 py-2 bg-tg-button text-tg-button-text font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5 active-press"
                                    >
                                        <ShoppingCart className="w-3.5 h-3.5" />
                                        <span>Add to Cart</span>
                                    </button>
                                </div>
                            );
                        })}

                        {/* Third slot placeholder if only 1 item selected */}
                        {products.length < 2 && (
                            <div className="flex flex-col border border-dashed border-tg-secondary-bg/60 bg-tg-bg/20 rounded-2xl p-4 items-center justify-center text-center opacity-70">
                                <HelpCircle className="w-8 h-8 text-tg-hint mb-2 animate-pulse" />
                                <p className="text-[11px] text-tg-hint font-bold leading-normal">
                                    Select another item to compare side-by-side
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-tg-secondary-bg/10 border-t border-tg-secondary-bg flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-tg-text bg-tg-secondary-bg active-press"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
