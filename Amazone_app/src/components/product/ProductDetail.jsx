import React, { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useTelegram } from '../../hooks/useTelegram';
import { fetchRecommendations } from '../../services/api';
import { mockProducts } from '../../mockData';
import ProductCard from './ProductCard';
import {
    ArrowLeft, Plus, Minus, Laptop, Shirt, Shield, Flame, Wallet,
    ShoppingCart, Share2, Star, MessageSquare, ChevronLeft, ChevronRight, Zap, CheckCircle2, Image, AlertCircle, X, Sparkles
} from 'lucide-react';

const getCategoryIconLarge = (category) => {
    switch (category) {
        case 'Clothing':
            return <Shirt className="w-16 h-16 text-white/95" />;
        case 'Electronics':
            return <Laptop className="w-16 h-16 text-white/95" />;
        case 'Home & Kitchen':
            return <Flame className="w-16 h-16 text-white/95" />;
        case 'Accessories':
            return <Wallet className="w-16 h-16 text-white/95" />;
        default:
            return <Shield className="w-16 h-16 text-white/95" />;
    }
};

const getCategoryIconSmall = (category) => {
    switch (category) {
        case 'Clothing':
            return <Shirt className="w-4 h-4 text-white/90" />;
        case 'Electronics':
            return <Laptop className="w-4 h-4 text-white/90" />;
        case 'Home & Kitchen':
            return <Flame className="w-4 h-4 text-white/90" />;
        case 'Accessories':
            return <Wallet className="w-4 h-4 text-white/90" />;
        default:
            return <Shield className="w-4 h-4 text-white/90" />;
    }
};

export default function ProductDetail({ product, onBack, setSelectedProduct }) {
    const { cartItems, addToCart, removeFromCart, addOrderToHistory, reportProduct } = useCart();

    // Filter mockProducts to find other listings by the same seller channel (excluding current product)
    const channelProducts = mockProducts
        .filter((p) => p.sellerChannel === product.sellerChannel && p.id !== product.id);

    const [visibleChannelProductsCount, setVisibleChannelProductsCount] = useState(2);
    const displayedChannelProducts = channelProducts.slice(0, visibleChannelProductsCount);
    const { showBackButton, hideBackButton, isTelegram, initData, triggerHapticImpact, triggerHapticNotification, openTelegramLink } = useTelegram();

    const [recommendations, setRecommendations] = useState([]);
    const [recsLoading, setRecsLoading] = useState(true);

    // Multi-Image swiper state - connects to real 3-image mock data array
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const swiperImages = product.images || [product.image];
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);

    // Auto loop effect for multi-image product pictures
    useEffect(() => {
        if (swiperImages.length <= 1 || isAutoPlayPaused) return;
        const interval = setInterval(() => {
            setActiveImageIndex((prev) => (prev + 1) % swiperImages.length);
        }, 3500); // 3.5s loop interval
        return () => clearInterval(interval);
    }, [swiperImages, isAutoPlayPaused]);

    const pauseAutoPlayTemporarily = () => {
        setIsAutoPlayPaused(true);
        // Clear previous timeout if any exists
        if (window.autoPlayTimeoutId) {
            clearTimeout(window.autoPlayTimeoutId);
        }
        window.autoPlayTimeoutId = setTimeout(() => {
            setIsAutoPlayPaused(false);
        }, 10000); // Resume auto loop after 10s of inactivity
    };

    // Variant Selection State
    const isClothing = product.category === 'Clothing';
    const variants = isClothing ? ['S', 'M', 'L', 'XL'] : ['128GB', '256GB', '512GB'];
    const [selectedVariant, setSelectedVariant] = useState(variants[0]);

    // Review formulation State
    const [reviewText, setReviewText] = useState('');
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewImageAttached, setReviewImageAttached] = useState(false);

    // Seller status mock Vacation checks
    const isSellerOnVacation = product.id % 7 === 1;

    const rating = product.rating || (4.0 + (product.id % 10) * 0.1);
    const reviewsCount = product.reviewsCount || (5 + (product.id % 50));
    const sellerChannel = product.sellerChannel || `@channel_merchant_${product.id % 10}`;

    const [reviewsList, setReviewsList] = useState([
        { name: 'Alex K.', rating: 5, date: 'Yesterday', text: 'Incredibly high-quality! Fast delivery directly through the channel bot.', img: null },
        { name: 'Sarah M.', rating: 4, date: '3 days ago', text: 'Really handy features and works beautifully. Highly recommend.', img: null },
    ]);

    const cartItem = cartItems.find((item) => item.id === product.id);
    const quantity = cartItem ? cartItem.quantity : 0;

    // Set up Telegram native BackButton
    useEffect(() => {
        showBackButton(onBack);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        return () => {
            hideBackButton(onBack);
        };
    }, [product.id, onBack]);

    // Fetch dynamic recommendations
    useEffect(() => {
        let isMounted = true;
        async function loadRecs() {
            setRecsLoading(true);
            try {
                const recs = await fetchRecommendations(product, initData);
                if (isMounted) {
                    setRecommendations(recs);
                    setRecsLoading(false);
                }
            } catch (err) {
                console.error('Error loading recommendations:', err);
                if (isMounted) {
                    setRecsLoading(false);
                }
            }
        }
        loadRecs();
        return () => {
            isMounted = false;
        };
    }, [product.id, initData]);

    const handleShare = () => {
        triggerHapticImpact('medium');
        const shareText = `Check out this amazing product on Amazone Mini App: ${product.title} (${selectedVariant}) for only $${product.price.toFixed(2)}!`;
        const shareUrl = `https://t.me/share/url?url=https://t.me/AmazoneBot/shop?startapp=item_${product.id}&text=${encodeURIComponent(shareText)}`;
        openTelegramLink(shareUrl);
    };

    const handleVariantChange = (v) => {
        triggerHapticImpact('light');
        setSelectedVariant(v);
    };

    const handleAttachImage = () => {
        triggerHapticImpact('medium');
        setReviewImageAttached(!reviewImageAttached);
    };

    const handleAddReview = (e) => {
        e.preventDefault();
        if (!reviewText.trim()) return;

        triggerHapticNotification('success');
        const newReview = {
            name: 'You (Buyer)',
            rating: reviewRating,
            date: 'Just now',
            text: reviewText.trim(),
            img: reviewImageAttached ? product.image : null
        };

        setReviewsList((prev) => [newReview, ...prev]);
        setReviewText('');
        setReviewImageAttached(false);
    };

    const handleExpressBuy = () => {
        if (isSellerOnVacation) return;
        triggerHapticImpact('heavy');
        const expressOrder = {
            items: [{
                id: product.id,
                title: `${product.title} (${selectedVariant})`,
                quantity: 1,
                price: product.price
            }],
            totalPrice: product.price,
            createdAt: new Date().toISOString()
        };

        if (isTelegram && window.Telegram?.WebApp) {
            window.Telegram.WebApp.showPopup({
                title: '⚡ Express 1-Click Buy',
                message: `Do you want to instantly buy ${product.title} (${selectedVariant}) for $${product.price.toFixed(2)}?`,
                buttons: [
                    { id: 'buy', type: 'default', text: 'Confirm Express Buy' },
                    { id: 'cancel', type: 'cancel', text: 'Cancel' }
                ]
            }, (btnId) => {
                if (btnId === 'buy') {
                    addOrderToHistory(expressOrder);
                    triggerHapticNotification('success');

                    window.Telegram.WebApp.showPopup({
                        title: 'Success!',
                        message: 'Your express order has been submitted successfully to the seller bot!',
                        buttons: [{ type: 'ok' }]
                    }, () => {
                        onBack();
                    });
                }
            });
        } else {
            const confirmed = window.confirm(`[Mock Browser Express] Buy ${product.title} (${selectedVariant}) for $${product.price.toFixed(2)}?`);
            if (confirmed) {
                addOrderToHistory(expressOrder);
                alert(`Express order completed! $${product.price} paid.`);
                onBack();
            }
        }
    };

    const nextImage = (e) => {
        if (e) e.stopPropagation();
        setActiveImageIndex((prev) => (prev + 1) % swiperImages.length);
        triggerHapticImpact('light');
        pauseAutoPlayTemporarily();
    };

    const prevImage = (e) => {
        if (e) e.stopPropagation();
        setActiveImageIndex((prev) => (prev - 1 + swiperImages.length) % swiperImages.length);
        triggerHapticImpact('light');
        pauseAutoPlayTemporarily();
    };

    return (
        <div className="flex flex-col flex-1 px-4 py-3 pb-32 bg-tg-bg text-tg-text">
            {/* Top action row */}
            <div className="flex justify-between items-center mb-4 gap-2">
                {!isTelegram ? (
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-xs font-semibold text-tg-hint active-press self-start"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Shop</span>
                    </button>
                ) : (
                    <div></div>
                )}

                <button
                    onClick={() => {
                        const confirmed = window.confirm(`🚨 Safety Alert: Do you want to report "${product.title}" for adult, illegal, or malicious content? Reporting it will instantly ban and hide this listing from your feed.`);
                        if (confirmed) {
                            triggerHapticNotification('error');
                            reportProduct(product.id);
                            alert(`Report successful. "${product.title}" has been suspended and banned from your catalog.`);
                            onBack(); // go back since item is now banned and hidden!
                        }
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-red-500 bg-red-500/10 border border-red-500/15 px-3 py-1.5 rounded-full active-press hover:bg-red-500/20 ml-auto shrink-0 animate-pulse"
                    title="Report Listing"
                >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Report</span>
                </button>

                <button
                    onClick={handleShare}
                    className="flex items-center gap-1 text-[11px] font-bold text-tg-button bg-tg-secondary-bg/80 border border-tg-secondary-bg px-3 py-1.5 rounded-full active-press shrink-0"
                >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                </button>
            </div>

            {/* Merchant Vacation Banner */}
            {isSellerOnVacation && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl p-4 mb-4 text-xs font-bold flex gap-2.5 text-left animate-pulse">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <p>Merchant Temporary Offline</p>
                        <p className="text-[10px] text-red-400 mt-1 leading-normal font-medium">
                            Merchant {sellerChannel} is currently on vacation. Listing is read-only and purchasing is temporarily paused.
                        </p>
                    </div>
                </div>
            )}

            {/* Swiper Gallery - rendering real multi-angle product photos */}
            <div
                onClick={() => setIsFullscreen(true)}
                className="group relative flex flex-col items-center justify-center h-64 rounded-3xl bg-tg-secondary-bg border border-tg-secondary-bg overflow-hidden shadow-sm mb-5 transition-all duration-300 cursor-zoom-in"
            >
                {swiperImages[activeImageIndex] ? (
                    <img
                        src={swiperImages[activeImageIndex]}
                        alt={`${product.title} view ${activeImageIndex + 1}`}
                        className="w-full h-full object-cover transition-all duration-500"
                    />
                ) : (
                    <>
                        <div className="absolute inset-0 bg-slate-700 flex items-center justify-center">
                            {getCategoryIconLarge(product.category)}
                        </div>
                    </>
                )}

                <button onClick={prevImage} className="absolute left-3 p-2 bg-black/40 text-white rounded-full backdrop-blur-md active-press z-10 hover:bg-black/60">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={nextImage} className="absolute right-3 p-2 bg-black/40 text-white rounded-full backdrop-blur-md active-press z-10 hover:bg-black/60">
                    <ChevronRight className="w-5 h-5" />
                </button>

                {/* Translucent Strip of All Pictures on Hover */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-black/45 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg z-20 pointer-events-auto transition-all duration-300 translate-y-2 md:translate-y-4 opacity-95 md:opacity-0 group-hover:opacity-100 group-hover:translate-y-0">
                    {swiperImages.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveImageIndex(idx);
                                triggerHapticImpact('light');
                                pauseAutoPlayTemporarily();
                            }}
                            className={`w-9 h-9 rounded-lg overflow-hidden border-2 transition-all active-press shrink-0 ${activeImageIndex === idx ? 'border-tg-button scale-105 shadow-sm' : 'border-white/20 hover:border-white/50'}`}
                        >
                            <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>

                <span className="absolute bottom-3 left-3 text-[10px] font-black bg-black/25 text-white/95 px-3 py-1 rounded-full backdrop-blur-md uppercase tracking-wider z-10">
                    {product.category}
                </span>
            </div>

            {/* Product Meta details */}
            <div className="flex flex-col mb-4 text-left">
                <button
                    onClick={() => openTelegramLink(`https://t.me/${sellerChannel.replace('@', '')}`)}
                    className="text-[10px] font-extrabold text-tg-button uppercase tracking-wider hover:underline mb-1"
                >
                    Seller: {sellerChannel}
                </button>

                <h1 className="text-xl font-bold text-tg-text tracking-tight mb-1.5 leading-tight">
                    {product.title}
                </h1>

                <div className="flex items-center gap-1.5 text-xs font-bold mb-4">
                    <div className="flex items-center text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-current" />
                    </div>
                    <span>{rating.toFixed(1)}</span>
                    <span className="text-tg-hint font-medium">({reviewsCount} ratings)</span>
                    <div className="h-3 w-[1px] bg-tg-secondary-bg mx-1"></div>
                    <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">Verified Merchant</span>
                </div>

                {/* Variant Selection Chips */}
                <div className="mb-4">
                    <span className="text-[10px] font-black text-tg-hint uppercase tracking-wider block mb-2">Select Variant Option</span>
                    <div className="flex gap-2">
                        {variants.map((v) => (
                            <button
                                key={v}
                                onClick={() => handleVariantChange(v)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active-press ${selectedVariant === v ? 'bg-tg-button text-tg-button-text' : 'bg-tg-secondary-bg text-tg-text border border-tg-secondary-bg'}`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-tg-secondary-bg/30 border border-tg-secondary-bg rounded-2xl p-4">
                    <h3 className="text-[10px] font-black text-tg-text uppercase tracking-wider mb-2">
                        Product Description
                    </h3>
                    <p className="text-xs text-tg-hint leading-relaxed font-medium">
                        {product.description}
                    </p>
                </div>
            </div>

            {/* Purchase Options Row */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="flex items-center justify-between bg-tg-secondary-bg border border-tg-secondary-bg rounded-2xl px-3.5 py-3 shadow-sm">
                    <div className="flex flex-col items-start">
                        <span className="text-[9px] text-tg-hint font-bold uppercase">In Cart</span>
                        <span className="text-xs font-extrabold mt-0.5 text-tg-text">${product.price.toFixed(2)}</span>
                    </div>

                    {isSellerOnVacation ? (
                        <ShoppingCart className="w-4 h-4 text-tg-hint shrink-0" />
                    ) : quantity === 0 ? (
                        <button
                            onClick={() => {
                                addToCart({ ...product, title: `${product.title} (${selectedVariant})` });
                                triggerHapticImpact('medium');
                            }}
                            className="p-2.5 bg-tg-button text-tg-button-text rounded-xl shadow-md active-press"
                            aria-label="Add to cart"
                        >
                            <ShoppingCart className="w-4 h-4" />
                        </button>
                    ) : (
                        <div className="flex items-center bg-tg-bg border border-tg-secondary-bg rounded-xl p-0.5 shadow-inner">
                            <button
                                onClick={() => removeFromCart(product.id)}
                                className="flex items-center justify-center w-7 h-7 rounded-lg text-tg-text active-press hover:bg-tg-secondary-bg"
                            >
                                <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center text-xs font-black">
                                {quantity}
                            </span>
                            <button
                                onClick={() => {
                                    addToCart({ ...product, title: `${product.title} (${selectedVariant})` });
                                    triggerHapticImpact('medium');
                                }}
                                className="flex items-center justify-center w-7 h-7 rounded-lg text-tg-text active-press hover:bg-tg-secondary-bg"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleExpressBuy}
                    disabled={isSellerOnVacation}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-tg-secondary-bg disabled:to-tg-secondary-bg disabled:text-tg-hint disabled:cursor-not-allowed text-white font-extrabold rounded-2xl shadow-md active-press flex items-center justify-center gap-1.5 p-3 animate-fade-in"
                >
                    <Zap className="w-4 h-4 shrink-0 fill-current" />
                    <div className="flex flex-col items-start text-left">
                        <span className="text-[8px] font-black uppercase tracking-wider leading-none text-white/90">Express Buy</span>
                        <span className="text-xs font-black mt-0.5">Buy Now 1-Click</span>
                    </div>
                </button>
            </div>

            {/* Write a review simulator */}
            <form onSubmit={handleAddReview} className="bg-tg-secondary-bg/10 border border-tg-secondary-bg rounded-2xl p-4 mb-6 text-left space-y-3.5">
                <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-tg-button animate-pulse" />
                    <h3 className="text-xs font-bold text-tg-text uppercase tracking-wider">Leave a Review</h3>
                </div>

                {/* Rating selection */}
                <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => { triggerHapticImpact('light'); setReviewRating(s); }}
                            className="text-amber-500 active-press"
                        >
                            <Star className={`w-5 h-5 ${reviewRating >= s ? 'fill-current' : 'text-tg-hint'}`} />
                        </button>
                    ))}
                </div>

                {/* Input text and photo */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        required
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Write a public review..."
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-tg-bg text-tg-text border border-tg-secondary-bg focus:outline-none placeholder-tg-hint"
                    />

                    {/* Attach image button */}
                    <button
                        type="button"
                        onClick={handleAttachImage}
                        className={`p-2.5 rounded-xl border shrink-0 flex items-center justify-center active-press ${reviewImageAttached ? 'bg-tg-button border-tg-button text-tg-button-text' : 'bg-tg-bg border-tg-secondary-bg text-tg-hint'}`}
                        aria-label="Attach Photo"
                    >
                        <Image className="w-4 h-4" />
                    </button>

                    <button
                        type="submit"
                        className="px-4 py-2.5 bg-tg-button text-tg-button-text rounded-xl font-bold text-xs shrink-0 active-press"
                    >
                        Post
                    </button>
                </div>
            </form>

            {/* Customer Reviews breakdown Section */}
            <div className="bg-tg-secondary-bg/15 border border-tg-secondary-bg/85 rounded-2xl p-4 mb-6 text-left">
                <div className="flex items-center gap-1.5 mb-3">
                    <MessageSquare className="w-4 h-4 text-tg-button" />
                    <h3 className="text-xs font-bold text-tg-text uppercase tracking-wider">Customer Reviews ({reviewsList.length + reviewsCount})</h3>
                </div>

                <div className="grid grid-cols-5 gap-1.5 mb-4 text-[10px] font-bold text-tg-hint">
                    <div className="col-span-1">5 Stars</div>
                    <div className="col-span-3 h-2 bg-tg-secondary-bg rounded-full self-center">
                        <div className="h-full bg-amber-500 rounded-full w-5/6"></div>
                    </div>
                    <div className="col-span-1 text-right text-tg-text">82%</div>

                    <div className="col-span-1">4 Stars</div>
                    <div className="col-span-3 h-2 bg-tg-secondary-bg rounded-full self-center">
                        <div className="h-full bg-amber-500 rounded-full w-1/6"></div>
                    </div>
                    <div className="col-span-1 text-right text-tg-text">14%</div>
                </div>

                <div className="space-y-3">
                    {reviewsList.map((rev, idx) => (
                        <div key={idx} className="border-t border-tg-secondary-bg/30 pt-2.5 flex flex-col animate-fade-in">
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="font-extrabold text-tg-text">{rev.name}</span>
                                <span className="text-tg-hint font-medium">{rev.date}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center text-amber-500 my-1">
                                    {[...Array(rev.rating)].map((_, i) => (
                                        <Star key={i} className="w-2.5 h-2.5 fill-current" />
                                    ))}
                                </div>
                                {rev.img && (
                                    <div className="w-12 h-12 rounded border border-tg-secondary-bg overflow-hidden shrink-0 shadow-sm">
                                        <img src={rev.img} alt="review attachment" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-tg-hint leading-relaxed font-medium">{rev.text}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dedicated "More From This Channel" Section */}
            {channelProducts.length > 0 && (
                <div className="flex flex-col text-left border-t border-tg-secondary-bg/40 pt-6 mt-6">
                    <h2 className="text-sm font-black text-tg-text mb-4 tracking-wide uppercase flex items-center gap-1.5">
                        <span className="text-base text-tg-button">📢</span>
                        <span>More from {sellerChannel}</span>
                    </h2>
                    <div className="columns-2 gap-3 space-y-3">
                        {displayedChannelProducts.map((chanProduct) => (
                            <ProductCard
                                key={chanProduct.id}
                                product={chanProduct}
                                onClick={() => {
                                    triggerHapticImpact('medium');
                                    setSelectedProduct(chanProduct);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                            />
                        ))}
                    </div>

                    {channelProducts.length > visibleChannelProductsCount && (
                        <div className="flex justify-center mt-4">
                            <button
                                onClick={() => {
                                    triggerHapticImpact('light');
                                    setVisibleChannelProductsCount((prev) => prev + 2);
                                }}
                                className="px-4 py-2 bg-tg-secondary-bg hover:bg-tg-secondary-bg/80 text-tg-text text-[10px] font-black tracking-wide uppercase rounded-xl active-press"
                            >
                                Load More Products ({channelProducts.length - visibleChannelProductsCount} remaining)
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Recommendations Section - Rich scrolling vertical/horizontal product grid */}
            <div className="flex flex-col text-left border-t border-tg-secondary-bg/40 pt-6 mt-6">
                <h2 className="text-sm font-black text-tg-text mb-4 tracking-wide uppercase flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500 fill-current animate-pulse" />
                    <span>Explore Related Products</span>
                </h2>
                {recsLoading ? (
                    <div className="columns-2 gap-3 space-y-3">
                        {[1, 2].map((n) => (
                            <div key={n} className="flex flex-col bg-tg-secondary-bg/40 border border-tg-secondary-bg rounded-2xl p-2.5 animate-pulse">
                                <div className="h-28 bg-tg-secondary-bg/60 rounded-xl mb-3"></div>
                                <div className="h-4 bg-tg-secondary-bg/60 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-tg-secondary-bg/60 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : recommendations.length > 0 ? (
                    <div className="columns-2 gap-3 space-y-3">
                        {recommendations.map((rec) => (
                            <ProductCard
                                key={rec.id}
                                product={rec}
                                onClick={() => {
                                    triggerHapticImpact('medium');
                                    setSelectedProduct(rec);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-tg-hint font-medium py-2">No related items found.</p>
                )}
            </div>

            {/* Glassmorphic Fullscreen Image Viewer Modal */}
            {isFullscreen && (
                <div
                    className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in text-white"
                    onClick={() => setIsFullscreen(false)}
                >
                    {/* Top Close Button */}
                    <button
                        onClick={() => setIsFullscreen(false)}
                        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 active-press text-white z-[210] shadow-md border border-white/10"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Centered Large Image with Left/Right arrows */}
                    <div className="relative max-w-full max-h-[75vh] px-4 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={swiperImages[activeImageIndex]}
                            alt={product.title}
                            className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl border border-white/5"
                        />

                        {swiperImages.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                    className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md active-press border border-white/10"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                    className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md active-press border border-white/10"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Image Strip / Indicator Index Dot Bar in Fullscreen */}
                    <div className="absolute bottom-8 flex flex-col items-center gap-3">
                        <p className="text-xs font-bold text-white/60 tracking-wider">
                            View {activeImageIndex + 1} of {swiperImages.length}
                        </p>
                        <div className="flex gap-2">
                            {swiperImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveImageIndex(idx);
                                        triggerHapticImpact('light');
                                        pauseAutoPlayTemporarily();
                                    }}
                                    className={`w-11 h-11 rounded-lg overflow-hidden border-2 transition-all active-press ${activeImageIndex === idx ? 'border-tg-button scale-105 shadow-md' : 'border-white/20 hover:border-white/45'}`}
                                >
                                    <img src={img} alt={`Fullscreen Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
