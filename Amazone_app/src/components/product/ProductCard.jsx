import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useTelegram } from '../../hooks/useTelegram';
import { Plus, Minus, Laptop, Shirt, Shield, Flame, Wallet, Heart, Star, Columns, AlertTriangle } from 'lucide-react';
import { resolveTelegramImage } from '../../services/api';

const getCategoryIcon = (category) => {
    switch (category) {
        case 'Clothing':
            return <Shirt className="w-8 h-8 text-white/90" />;
        case 'Electronics':
            return <Laptop className="w-8 h-8 text-white/90" />;
        case 'Home & Kitchen':
            return <Flame className="w-8 h-8 text-white/90" />;
        case 'Accessories':
            return <Wallet className="w-8 h-8 text-white/90" />;
        default:
            return <Shield className="w-8 h-8 text-white/90" />;
    }
};

export default function ProductCard({ product, onClick, compareList = [], onToggleCompare, onChannelClick }) {
    const { cartItems, addToCart, removeFromCart, toggleWishlist, isInWishlist, reportProduct } = useCart();
    const { triggerHapticImpact, triggerHapticNotification, openTelegramLink } = useTelegram();

    const [resolvedImageUrl, setResolvedImageUrl] = useState(null);
    const [imageLoading, setImageLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function fetchImage() {
            // Check if product has a traditional image or a Telegram file ID
            if (product.image) {
                setResolvedImageUrl(product.image);
                setImageLoading(false);
            } else if (product.telegramFileIds && product.telegramFileIds.length > 0) {
                try {
                    // Resolve the first image in the album
                    const url = await resolveTelegramImage(product.telegramFileIds[0]);
                    if (isMounted && url) {
                        setResolvedImageUrl(url);
                        setImageLoading(false);
                    }
                } catch (err) {
                    console.error('Error resolving image:', err);
                    setImageLoading(false);
                }
            } else {
                setImageLoading(false); // No image to load
            }
        }
        fetchImage();
        return () => { isMounted = false; };
    }, [product.image, product.telegramFileIds]);

    const cartItem = cartItems.find((item) => item.id === product.id);
    const quantity = cartItem ? cartItem.quantity : 0;
    const isLiked = isInWishlist(product.id);
    const isCompared = compareList.some((p) => p.id === product.id);

    // Dynamic rating generation based on ID (simplified for string IDs)
    const numericId = typeof product.id === 'number' ? product.id : product.id.charCodeAt(0);
    const rating = product.rating || (4.0 + (numericId % 10) * 0.1);
    const reviewsCount = product.reviewsCount || (5 + (numericId % 50));

    // Dynamic badges
    const getBadge = () => {
        if (numericId % 4 === 1) return 'Best Seller';
        if (numericId % 4 === 2) return '20% OFF';
        if (numericId % 4 === 3) return 'New Arrival';
        return null;
    };
    const badge = getBadge();

    const handleAddToCart = (e) => {
        e.stopPropagation();
        addToCart(product);
        triggerHapticImpact('medium');
    };

    const handleRemoveFromCart = (e) => {
        e.stopPropagation();
        removeFromCart(product.id);
        triggerHapticImpact('light');
    };

    const handleLikeClick = (e) => {
        e.stopPropagation();
        toggleWishlist(product);
        triggerHapticImpact('medium');
    };

    const handleCompareClick = (e) => {
        e.stopPropagation();
        if (onToggleCompare) {
            onToggleCompare(product);
            triggerHapticImpact('light');
        }
    };

    return (
        <div
            onClick={onClick}
            className="break-inside-avoid inline-block w-full bg-tg-bg border border-tg-secondary-bg rounded-2xl overflow-hidden shadow-sm pinterest-card-hover animate-fade-in cursor-pointer active-press relative mb-3 text-left"
        >
            {/* Dynamic Product Tag Badge */}
            {badge && (
                <span className="absolute top-2 left-2 z-10 text-[8px] font-black uppercase bg-tg-button text-tg-button-text px-2 py-0.5 rounded-full shadow-sm">
                    {badge}
                </span>
            )}

            {/* Favorite (Heart) Toggle Button */}
            <button
                onClick={handleLikeClick}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/35 text-white backdrop-blur-md active-press"
                aria-label={isLiked ? 'Remove from favorites' : 'Add to favorites'}
            >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'text-red-500 fill-current animate-pulse' : 'text-white'}`} />
            </button>

            {/* Compare Checkbox Button */}
            {onToggleCompare && (
                <button
                    onClick={handleCompareClick}
                    className={`absolute top-10 right-2 z-10 p-1.5 rounded-full backdrop-blur-md active-press transition-all ${isCompared ? 'bg-tg-button text-tg-button-text shadow-sm' : 'bg-black/35 text-white'}`}
                    aria-label="Add to comparison"
                >
                    <Columns className="w-3.5 h-3.5" />
                </button>
            )}

            {/* Report Content Button (Flag) */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    const confirmed = window.confirm(`🚨 Safety Alert: Do you want to report "${product.title}" for adult, illegal, or malicious content? Reporting it will instantly ban and hide this listing from your feed.`);
                    if (confirmed) {
                        triggerHapticNotification('error');
                        reportProduct(product.id);
                        alert(`Report successful. "${product.title}" has been suspended and banned from your catalog.`);
                    }
                }}
                className="absolute top-18 right-2 z-10 p-1.5 rounded-full bg-black/35 text-white hover:text-red-400 backdrop-blur-md active-press transition-all"
                title="Report Listing"
            >
                <AlertTriangle className="w-3.5 h-3.5" />
            </button>

            {/* Product Image / Visual Box with dynamic height for Pinterest feel */}
            <div className={`relative flex items-center justify-center ${product.imageHeight || 'h-36'} ${product.color || 'bg-slate-700'} overflow-hidden`}>
                {resolvedImageUrl ? (
                    <img
                        src={resolvedImageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : imageLoading ? (
                    <div className="w-full h-full flex items-center justify-center bg-tg-secondary-bg/50 animate-pulse">
                        {/* Shimmer loading effect */}
                    </div>
                ) : (
                    <>
                        {/* Abstract design elements fallback if no image */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-6 -mt-6 transform rotate-45"></div>
                        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-black/10 rounded-full"></div>
                        {getCategoryIcon(product.category)}
                    </>
                )}

                <span className="absolute bottom-2 left-2 text-[9px] font-bold bg-black/25 text-white/95 px-2.5 py-0.5 rounded-full backdrop-blur-sm z-10">
                    {product.category || 'General'}
                </span>
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-3">
                {/* Title */}
                <h3 className="text-xs font-bold text-tg-text line-clamp-1 mb-0.5 text-left">
                    {product.title}
                </h3>

                {/* Seller channel name - clickable and filterable */}
                {product.sellerChannel && (
                    <div className="flex items-center gap-1 mb-1 mt-0.5">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onChannelClick) {
                                    onChannelClick(product.sellerChannel);
                                }
                            }}
                            className="text-[9px] font-black text-tg-button bg-tg-button/5 px-2 py-0.5 rounded truncate max-w-[100px] active-press flex items-center gap-0.5 text-left hover:bg-tg-button/10"
                            title={`Filter by channel ${product.sellerChannel}`}
                        >
                            <span>📢 {product.sellerChannel}</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                triggerHapticImpact('light');
                                openTelegramLink(`https://t.me/${product.sellerChannel.replace('@', '')}`);
                            }}
                            className="p-1 rounded bg-tg-secondary-bg hover:bg-tg-secondary-bg/85 text-tg-hint hover:text-tg-text active-press shrink-0 flex items-center justify-center"
                            title="Open Telegram Channel"
                        >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Rating row */}
                <div className="flex items-center gap-1 mb-1 text-[9px] font-bold text-left">
                    <div className="flex items-center text-amber-500">
                        <Star className="w-2.5 h-2.5 fill-current" />
                    </div>
                    <span className="text-tg-text">{rating.toFixed(1)}</span>
                    <span className="text-tg-hint font-medium">({reviewsCount})</span>
                </div>

                {/* Description */}
                <p className="text-[10px] text-tg-hint line-clamp-2 leading-relaxed mb-3 flex-1 text-left font-medium">
                    {product.description}
                </p>

                {/* Pricing & Button Area */}
                <div className="flex items-center justify-between gap-2 mt-auto">
                    <span className="text-xs font-black text-tg-text">
                        ${product.price.toFixed(2)}
                    </span>

                    {quantity === 0 ? (
                        <button
                            onClick={handleAddToCart}
                            className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black text-tg-button-text bg-tg-button rounded-xl shadow-sm active-press"
                        >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                        </button>
                    ) : (
                        <div className="flex items-center bg-tg-secondary-bg border border-tg-secondary-bg rounded-xl p-0.5 shadow-sm">
                            <button
                                onClick={handleRemoveFromCart}
                                className="flex items-center justify-center w-5 h-5 rounded-lg text-tg-text active-press hover:bg-tg-bg"
                                aria-label="Decrease quantity"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center text-[10px] font-bold text-tg-text">
                                {quantity}
                            </span>
                            <button
                                onClick={handleAddToCart}
                                className="flex items-center justify-center w-5 h-5 rounded-lg text-tg-text active-press hover:bg-tg-bg"
                                aria-label="Increase quantity"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
