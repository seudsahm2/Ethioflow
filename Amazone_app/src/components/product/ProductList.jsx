import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { fetchProducts, fetchCategories } from '../../services/api';
import { useTelegram } from '../../hooks/useTelegram';
import { useCart } from '../../context/CartContext';
import { Search, X, RefreshCw, SlidersHorizontal, ArrowUpDown, History, Mic, MicOff, Sparkles, Flame, Eye } from 'lucide-react';

function ProductSkeleton() {
    return (
        <div className="flex flex-col bg-tg-secondary-bg/40 border border-tg-secondary-bg/60 rounded-2xl p-2.5 animate-pulse">
            <div className="h-32 bg-tg-secondary-bg/60 rounded-xl mb-3"></div>
            <div className="h-4 bg-tg-secondary-bg/60 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-tg-secondary-bg/60 rounded w-1/2"></div>
        </div>
    );
}

export default function ProductList({
    onProductClick,
    compareList = [],
    onToggleCompare,
    searchQuery: propSearchQuery,
    setSearchQuery: propSetSearchQuery
}) {
    const { initData, triggerHapticImpact, triggerHapticNotification } = useTelegram();
    const { recentlyViewed, addRecentlyViewed, bannedProductIds } = useCart();
    const [products, setProducts] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState('');
    const [searchMode, setSearchMode] = useState('products'); // 'products' or 'channels'
    const [categories, setCategories] = useState(['All']);
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Support both global elevated state or fallback to local state
    const [localSearchQuery, setLocalSearchQuery] = useState('');
    const searchQuery = propSearchQuery !== undefined ? propSearchQuery : localSearchQuery;
    const setSearchQuery = propSetSearchQuery !== undefined ? propSetSearchQuery : setLocalSearchQuery;

    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    // Advanced Sort & Filter states
    const [sortOption, setSortOption] = useState('default');
    const [showFilters, setShowFilters] = useState(false);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [ratingThreshold, setRatingThreshold] = useState(0);

    // Voice search state
    const [isListening, setIsListening] = useState(false);

    // Autocomplete State
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);

    // Flash Sale Timer State (simulates a rolling 2-hour sale timer)
    const [flashSaleTime, setFlashSaleTime] = useState('01:59:59');

    // Search History state
    const [recentSearches, setRecentSearches] = useState(() => {
        const saved = localStorage.getItem('amazone_recent_searches');
        return saved ? JSON.parse(saved) : [];
    });

    // Flash Sale Ticker effect
    useEffect(() => {
        let hours = 1, minutes = 59, seconds = 59;
        const interval = setInterval(() => {
            if (seconds > 0) {
                seconds--;
            } else {
                seconds = 59;
                if (minutes > 0) {
                    minutes--;
                } else {
                    minutes = 59;
                    if (hours > 0) {
                        hours--;
                    } else {
                        hours = 1; // reset
                    }
                }
            }
            const hStr = hours < 10 ? `0${hours}` : hours;
            const mStr = minutes < 10 ? `0${minutes}` : minutes;
            const sStr = seconds < 10 ? `0${seconds}` : seconds;
            setFlashSaleTime(`${hStr}:${mStr}:${sStr}`);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Fetch categories on mount
    useEffect(() => {
        let isMounted = true;
        async function loadCategories() {
            try {
                const cats = await fetchCategories(initData);
                if (isMounted) {
                    setCategories(cats);
                }
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        }
        loadCategories();
        return () => { isMounted = false; };
    }, [initData]);

    // Fetch products whenever category or search query changes
    useEffect(() => {
        let isMounted = true;
        async function loadProducts() {
            setIsLoading(true);
            setIsError(false);
            try {
                const apiSearchQuery = searchMode === 'products' ? searchQuery : '';
                const data = await fetchProducts(selectedCategory, apiSearchQuery, initData);
                if (isMounted) {
                    setProducts(data);
                    setIsLoading(false);
                }
            } catch (err) {
                console.error('Error fetching products:', err);
                if (isMounted) {
                    setIsError(true);
                    setIsLoading(false);
                }
            }
        }

        const timer = setTimeout(() => {
            loadProducts();

            // Save search history
            if (searchQuery.trim().length > 1) {
                setRecentSearches((prev) => {
                    const cleanQuery = searchQuery.trim();
                    const filtered = prev.filter((q) => q !== cleanQuery);
                    const updated = [cleanQuery, ...filtered].slice(0, 5);
                    localStorage.setItem('amazone_recent_searches', JSON.stringify(updated));
                    return updated;
                });
            }
        }, searchQuery ? 400 : 0);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [selectedCategory, searchQuery, initData, searchMode]);

    // Autocomplete Suggestions updater
    useEffect(() => {
        if (!searchQuery) {
            setSuggestions([]);
            return;
        }
        const filtered = products
            .filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .slice(0, 4);
        setSuggestions(filtered);
    }, [searchQuery, products]);

    const handleRetry = () => {
        setSelectedCategory('All');
        setSearchQuery('');
        setIsError(false);
        setIsLoading(true);
    };

    const handleRecentSearchClick = (query) => {
        triggerHapticImpact('light');
        setSearchQuery(query);
    };

    const handleClearRecent = () => {
        setRecentSearches([]);
        localStorage.removeItem('amazone_recent_searches');
    };

    const handleSuggestionClick = (p) => {
        triggerHapticImpact('medium');
        addRecentlyViewed(p);
        onProductClick(p);
        setSearchQuery('');
        setShowSuggestions(false);
    };

    // Voice Speech Search Handler
    const handleVoiceSearch = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Voice Search is not supported on this device client! Try Google Chrome or Android/iOS apps.");
            return;
        }

        triggerHapticImpact('heavy');
        const rec = new SpeechRecognition();
        rec.lang = 'en-US';

        setIsListening(true);
        rec.start();

        rec.onresult = (e) => {
            const resultText = e.results[0][0].transcript;
            setSearchQuery(resultText);
            setIsListening(false);
            triggerHapticNotification('success');
        };

        rec.onerror = () => {
            setIsListening(false);
        };

        rec.onend = () => {
            setIsListening(false);
        };
    };

    // Apply sorting/filtering
    const processedProducts = products
        .filter((product) => {
            const matchesMinPrice = minPrice === '' || product.price >= Number(minPrice);
            const matchesMaxPrice = maxPrice === '' || product.price <= Number(maxPrice);
            const rating = product.rating || (4.0 + (product.id % 10) * 0.1);
            const matchesRating = rating >= ratingThreshold;
            const matchesChannel = selectedChannel === '' || product.sellerChannel === selectedChannel;
            const isNotBanned = !bannedProductIds || !bannedProductIds.includes(product.id);

            // Search Mode matching (Products vs Channels)
            const matchesSearchQuery = searchQuery === '' || (
                searchMode === 'products'
                    ? product.title.toLowerCase().includes(searchQuery.toLowerCase()) || product.description.toLowerCase().includes(searchQuery.toLowerCase())
                    : product.sellerChannel && product.sellerChannel.toLowerCase().includes(searchQuery.toLowerCase())
            );

            return matchesMinPrice && matchesMaxPrice && matchesRating && matchesChannel && isNotBanned && matchesSearchQuery;
        })
        .sort((a, b) => {
            if (sortOption === 'price-asc') return a.price - b.price;
            if (sortOption === 'price-desc') return b.price - a.price;
            if (sortOption === 'rating') {
                const rA = a.rating || (4.0 + (a.id % 10) * 0.1);
                const rB = b.rating || (4.0 + (b.id % 10) * 0.1);
                return rB - rA;
            }
            return 0;
        });

    return (
        <div className="flex flex-col flex-1 px-4 py-3 pb-32">
            {/* Search Input Bar with Voice Support */}
            <div className="relative mb-2 flex gap-2">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-tg-hint">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search products..."
                        className="w-full pl-9 pr-9 py-2.5 rounded-xl text-xs bg-tg-secondary-bg text-tg-text placeholder-tg-hint border-none focus:outline-none focus:ring-2 focus:ring-tg-button transition-all duration-150"
                    />
                    {searchQuery !== '' && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-tg-hint active-press hover:text-tg-text"
                            aria-label="Clear search"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Microphone Voice Search Button */}
                <button
                    onClick={handleVoiceSearch}
                    className={`p-2.5 shrink-0 rounded-xl border flex items-center justify-center active-press ${isListening ? 'bg-red-500 text-white border-red-500 animate-pulse' : 'bg-tg-secondary-bg border-tg-secondary-bg text-tg-text'}`}
                    aria-label="Voice Search"
                >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
            </div>

            {/* Search Mode Selector (Products vs Channels) */}
            <div className="flex gap-2 mb-3 mt-1 justify-start animate-fade-in">
                <button
                    onClick={() => {
                        triggerHapticImpact('light');
                        setSearchMode('products');
                        setSearchQuery('');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wide uppercase transition-all duration-150 active-press ${searchMode === 'products' ? 'bg-tg-button text-tg-button-text shadow-sm scale-102' : 'bg-tg-secondary-bg text-tg-hint hover:text-tg-text'}`}
                >
                    📦 Search Products
                </button>
                <button
                    onClick={() => {
                        triggerHapticImpact('light');
                        setSearchMode('channels');
                        setSearchQuery('');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wide uppercase transition-all duration-150 active-press ${searchMode === 'channels' ? 'bg-tg-button text-tg-button-text shadow-sm scale-102' : 'bg-tg-secondary-bg text-tg-hint hover:text-tg-text'}`}
                >
                    📢 Search Channels
                </button>
            </div>

            {/* Auto-complete suggestions dropdown menu */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-4 right-4 z-[80] top-16 bg-tg-bg border border-tg-secondary-bg rounded-2xl shadow-xl divide-y divide-tg-secondary-bg/40 overflow-hidden text-left animate-fade-in">
                    {suggestions.map((p) => (
                        <div
                            key={p.id}
                            onMouseDown={() => handleSuggestionClick(p)}
                            className="px-4 py-3 text-xs font-bold text-tg-text flex items-center gap-2 cursor-pointer hover:bg-tg-secondary-bg/20"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-tg-button" />
                            <span>{p.title}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Flash Sale Countdown Timer Ticker Banner */}
            {searchQuery === '' && selectedCategory === 'All' && (
                <div className="bg-gradient-to-r from-red-600 via-orange-500 to-red-600 border border-orange-500/20 text-white rounded-2xl p-3 mb-4 flex items-center justify-between text-left shadow-md animate-pulse">
                    <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-yellow-300 fill-current shrink-0" />
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-wider leading-none">Flash Sale Deal</p>
                            <p className="text-xs font-black mt-1">Save 50% on selected items!</p>
                        </div>
                    </div>
                    <div className="text-right shrink-0 bg-black/20 px-3 py-1 rounded-xl backdrop-blur-md border border-white/10">
                        <p className="text-[8px] font-black uppercase text-yellow-300">Ends In</p>
                        <p className="text-xs font-mono font-black mt-0.5">{flashSaleTime}</p>
                    </div>
                </div>
            )}

            {/* Recent Searches Row */}
            {recentSearches.length > 0 && searchQuery === '' && (
                <div className="flex flex-col items-start gap-1.5 mb-3 text-left animate-fade-in">
                    <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-bold text-tg-hint uppercase tracking-wider flex items-center gap-1">
                            <History className="w-3 h-3" />
                            <span>Recent Searches</span>
                        </span>
                        <button onClick={handleClearRecent} className="text-[10px] text-tg-destructive font-bold active-press">
                            Clear
                        </button>
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto w-full py-0.5 scrollbar-hide">
                        {recentSearches.map((query) => (
                            <button
                                key={query}
                                onClick={() => handleRecentSearchClick(query)}
                                className="flex-shrink-0 bg-tg-secondary-bg/50 border border-tg-secondary-bg hover:border-tg-hint text-tg-text px-2.5 py-1 rounded-lg text-[10px] font-semibold active-press"
                            >
                                {query}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Category Pills Slider Row */}
            <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-hide -mx-4 px-4">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all duration-150 active-press ${selectedCategory === category
                                ? 'bg-tg-button text-tg-button-text shadow-sm'
                                : 'bg-tg-secondary-bg text-tg-hint hover:text-tg-text'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => {
                        triggerHapticImpact('light');
                        setShowFilters(!showFilters);
                    }}
                    className={`flex-shrink-0 p-2 rounded-full border active-press ${showFilters ? 'bg-tg-button text-tg-button-text border-tg-button' : 'bg-tg-secondary-bg border-tg-secondary-bg text-tg-text'}`}
                    aria-label="Filter options"
                >
                    <SlidersHorizontal className="w-4 h-4" />
                </button>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div className="bg-tg-secondary-bg/30 border border-tg-secondary-bg rounded-2xl p-4 mb-4 text-left space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1 text-xs font-bold text-tg-text">
                            <ArrowUpDown className="w-3.5 h-3.5 text-tg-button" />
                            <span>Sort By</span>
                        </div>
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="bg-tg-bg border border-tg-secondary-bg text-tg-text text-xs rounded-lg px-3 py-1.5 focus:outline-none"
                        >
                            <option value="default">None (Default)</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="rating">Highest Rated</option>
                        </select>
                    </div>

                    <div className="h-[1px] bg-tg-secondary-bg/55"></div>

                    <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-tg-hint uppercase tracking-wider">Price Range (USD)</span>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs rounded-lg bg-tg-bg text-tg-text placeholder-tg-hint border border-tg-secondary-bg focus:outline-none"
                            />
                            <span className="text-tg-hint text-xs font-bold">to</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs rounded-lg bg-tg-bg text-tg-text placeholder-tg-hint border border-tg-secondary-bg focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-tg-hint uppercase tracking-wider">Minimum Rating: <span className="text-tg-button font-extrabold">{ratingThreshold || 'Any'} Stars</span></span>
                        <div className="flex gap-1.5">
                            {[0, 3, 4, 4.5].map((stars) => (
                                <button
                                    key={stars}
                                    type="button"
                                    onClick={() => setRatingThreshold(stars)}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-lg border active-press ${ratingThreshold === stars ? 'bg-tg-button text-tg-button-text border-tg-button' : 'bg-tg-bg text-tg-hint border-tg-secondary-bg'}`}
                                >
                                    {stars === 0 ? 'Any' : `${stars}★ & Up`}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-1">
                        <button
                            onClick={() => {
                                setMinPrice('');
                                setMaxPrice('');
                                setRatingThreshold(0);
                                setSortOption('default');
                                triggerHapticImpact('light');
                            }}
                            className="text-[10px] text-tg-destructive font-bold active-press"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Active Single-Channel Filter Banner */}
            {selectedChannel && (
                <div className="bg-tg-button/5 border border-tg-button/15 rounded-2xl p-3.5 mb-4 flex items-center justify-between text-left animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-tg-button/5 rounded-full -mr-6 -mt-6"></div>
                    <div className="flex items-center gap-2.5 min-w-0 relative z-10">
                        <div className="w-8 h-8 rounded-full bg-tg-button/10 text-tg-button flex items-center justify-center shrink-0">
                            <span className="text-xs">📢</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-tg-hint font-black uppercase tracking-wider leading-none">Channel Filter Active</p>
                            <p className="text-xs font-bold text-tg-text mt-1 truncate">{selectedChannel}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            triggerHapticImpact('light');
                            setSelectedChannel('');
                        }}
                        className="px-3.5 py-2 bg-tg-secondary-bg hover:bg-tg-secondary-bg/80 text-tg-text text-[10px] font-black rounded-xl active-press shrink-0 relative z-10"
                    >
                        Clear Channel
                    </button>
                </div>
            )}

            {/* Error State */}
            {isError && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-sm font-semibold text-red-500 mb-2">Failed to connect to database</p>
                    <p className="text-xs text-tg-hint mb-4">Please check your network connection and try again.</p>
                    <button
                        onClick={handleRetry}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-tg-button-text bg-tg-button rounded-xl shadow-md active-press"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry Connection</span>
                    </button>
                </div>
            )}

            {/* Loading/Skeletons State */}
            {!isError && isLoading && (
                <div className="columns-2 gap-3 space-y-3 animate-fade-in">
                    <ProductSkeleton />
                    <ProductSkeleton />
                    <ProductSkeleton />
                    <ProductSkeleton />
                </div>
            )}

            {/* Products Grid State */}
            {!isError && !isLoading && (
                <>
                    {/* Recently Viewed Carousel Banner */}
                    {searchQuery === '' && selectedCategory === 'All' && recentlyViewed.length > 0 && (
                        <div className="flex flex-col text-left mb-5 animate-fade-in">
                            <span className="text-[10px] font-black text-tg-hint uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5 text-tg-button" />
                                <span>Recently Viewed Items</span>
                            </span>
                            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                                {recentlyViewed.map((p) => (
                                    <div
                                        key={p.id}
                                        onClick={() => {
                                            triggerHapticImpact('light');
                                            onProductClick(p);
                                        }}
                                        className="flex-shrink-0 w-28 bg-tg-secondary-bg/20 border border-tg-secondary-bg rounded-xl p-2 cursor-pointer active-press shadow-sm"
                                    >
                                        <div className={`h-14 rounded-lg ${p.color || 'bg-slate-700'} mb-1.5 flex items-center justify-center`}>
                                            <Eye className="w-3.5 h-3.5 text-white/50" />
                                        </div>
                                        <p className="text-[9px] font-bold text-tg-text line-clamp-1 text-center">{p.title}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="columns-2 gap-3 space-y-3">
                        {processedProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onClick={() => {
                                    triggerHapticImpact('medium');
                                    addRecentlyViewed(product); // save recently viewed
                                    onProductClick(product);
                                }}
                                compareList={compareList}
                                onToggleCompare={onToggleCompare}
                                onChannelClick={(chan) => {
                                    triggerHapticImpact('medium');
                                    setSelectedChannel(chan);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                            />
                        ))}
                    </div>

                    {processedProducts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <p className="text-sm font-semibold text-tg-hint">No products found</p>
                            <p className="text-xs text-tg-hint/70 mt-1">Try searching or clearing active filters.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
