import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function useCart() {
    return useContext(CartContext);
}

export function CartProvider({ children }) {
    // 1. Cart Items State
    const [cartItems, setCartItems] = useState(() => {
        const saved = localStorage.getItem('amazone_cart');
        return saved ? JSON.parse(saved) : [];
    });

    // 2. Wishlist Items State
    const [wishlistItems, setWishlistItems] = useState(() => {
        const saved = localStorage.getItem('amazone_wishlist');
        return saved ? JSON.parse(saved) : [];
    });

    // 3. Orders State
    const [orderHistory, setOrderHistory] = useState(() => {
        const saved = localStorage.getItem('amazone_orders');
        return saved ? JSON.parse(saved) : [];
    });

    // 4. Loyalty Points (Coins) State
    const [loyaltyCoins, setLoyaltyCoins] = useState(() => {
        const saved = localStorage.getItem('amazone_coins');
        return saved ? Number(saved) : 150; // default 150 starter coins
    });

    // 5. Applied Promo Coupon State
    const [appliedPromo, setAppliedPromo] = useState(null);

    // ============================================================================
    // ROUND 2 ADDITIONS: Extended e-commerce, gamification, and security states
    // ============================================================================

    // 6. Recently Viewed Products
    const [recentlyViewed, setRecentlyViewed] = useState(() => {
        const saved = localStorage.getItem('amazone_recently_viewed');
        return saved ? JSON.parse(saved) : [];
    });

    // 7. Shipping Address Book State
    const [shippingAddress, setShippingAddress] = useState(() => {
        const saved = localStorage.getItem('amazone_address_book');
        return saved ? JSON.parse(saved) : { fullName: '', phone: '', address: '' };
    });

    // 8. Achievements List State
    const [achievements, setAchievements] = useState(() => {
        const saved = localStorage.getItem('amazone_achievements');
        const defaultBadges = [
            { id: 'first_buy', title: 'Loyal Shopper', desc: 'Place your first order on Amazone.', unlocked: false, icon: '🛍️' },
            { id: 'spin_win', title: 'Spin Master', desc: 'Try your luck on the Daily Spin Wheel.', unlocked: false, icon: '🎡' },
            { id: 'clicker_fan', title: 'Tapper Elite', desc: 'Accumulate 100 taps in the clicker game.', unlocked: false, icon: '🖱️' },
            { id: 'super_saver', title: 'Savvy Saver', desc: 'Use a promo coupon code at checkout.', unlocked: false, icon: '🏷️' },
        ];
        return saved ? JSON.parse(saved) : defaultBadges;
    });

    // 9. Referral Program State
    const [referredUsers, setReferredUsers] = useState(() => {
        const saved = localStorage.getItem('amazone_referrals');
        return saved ? JSON.parse(saved) : ['@cryptoguy', '@telegram_dev'];
    });

    // 10. Clicker taps counter
    const [clickerTaps, setClickerTaps] = useState(() => {
        const saved = localStorage.getItem('amazone_clicker_taps');
        return saved ? Number(saved) : 0;
    });

    // 11. Banned/reported product IDs state (Community Content Moderation)
    const [bannedProductIds, setBannedProductIds] = useState(() => {
        const saved = localStorage.getItem('amazone_banned_products');
        return saved ? JSON.parse(saved) : [];
    });

    // Save states to localStorage
    useEffect(() => {
        localStorage.setItem('amazone_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    useEffect(() => {
        localStorage.setItem('amazone_wishlist', JSON.stringify(wishlistItems));
    }, [wishlistItems]);

    useEffect(() => {
        localStorage.setItem('amazone_orders', JSON.stringify(orderHistory));
    }, [orderHistory]);

    useEffect(() => {
        localStorage.setItem('amazone_coins', loyaltyCoins.toString());
    }, [loyaltyCoins]);

    useEffect(() => {
        localStorage.setItem('amazone_recently_viewed', JSON.stringify(recentlyViewed));
    }, [recentlyViewed]);

    useEffect(() => {
        localStorage.setItem('amazone_address_book', JSON.stringify(shippingAddress));
    }, [shippingAddress]);

    useEffect(() => {
        localStorage.setItem('amazone_achievements', JSON.stringify(achievements));
    }, [achievements]);

    useEffect(() => {
        localStorage.setItem('amazone_clicker_taps', clickerTaps.toString());
    }, [clickerTaps]);

    useEffect(() => {
        localStorage.setItem('amazone_banned_products', JSON.stringify(bannedProductIds));
    }, [bannedProductIds]);

    // Community Content Moderation Handlers
    const reportProduct = (productId) => {
        setBannedProductIds((prev) => {
            if (prev.includes(productId)) return prev;
            return [...prev, productId];
        });
    };

    const clearBannedProducts = () => {
        setBannedProductIds([]);
    };

    // Cart Handlers
    const addToCart = (product) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find((item) => item.id === product.id);
            if (existingItem) {
                return prevItems.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevItems, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find((item) => item.id === productId);
            if (!existingItem) return prevItems;
            if (existingItem.quantity === 1) {
                return prevItems.filter((item) => item.id !== productId);
            }
            return prevItems.map((item) =>
                item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
            );
        });
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const updateCartItemPrice = (productId, newPrice) => {
        setCartItems((prevItems) => {
            return prevItems.map((item) =>
                item.id === productId
                    ? { ...item, price: newPrice, originalPrice: item.originalPrice || item.price }
                    : item
            );
        });
    };

    // Wishlist Handlers
    const toggleWishlist = (product) => {
        setWishlistItems((prevItems) => {
            const isLiked = prevItems.some((item) => item.id === product.id);
            if (isLiked) {
                return prevItems.filter((item) => item.id !== product.id);
            } else {
                return [...prevItems, product];
            }
        });
    };

    const isInWishlist = (productId) => {
        return wishlistItems.some((item) => item.id === productId);
    };

    // Promo Coupons Handlers
    const applyPromoCode = (code) => {
        const uppercaseCode = code.toUpperCase().trim();
        const activeCoupons = {
            'AMAZONE10': { code: 'AMAZONE10', type: 'percent', value: 10 },
            'SUPER20': { code: 'SUPER20', type: 'percent', value: 20 },
            'COINSOFF': { code: 'COINSOFF', type: 'flat', value: 5 },
            'FREEGP': { code: 'FREEGP', type: 'percent', value: 15 }
        };

        if (activeCoupons[uppercaseCode]) {
            setAppliedPromo(activeCoupons[uppercaseCode]);
            unlockAchievement('super_saver');
            return { success: true, message: `Applied Coupon: ${activeCoupons[uppercaseCode].value}% off!` };
        }
        return { success: false, message: 'Invalid or expired coupon code.' };
    };

    const removePromoCode = () => {
        setAppliedPromo(null);
    };

    // Loyalty Coins Handlers
    const spendCoins = (amount) => {
        if (loyaltyCoins >= amount) {
            setLoyaltyCoins(prev => prev - amount);
            return true;
        }
        return false;
    };

    const addCoins = (amount) => {
        setLoyaltyCoins(prev => prev + amount);
    };

    // Add order to history
    const addOrderToHistory = (order) => {
        setOrderHistory(prev => [
            {
                ...order,
                status: 'Pending',
                id: order.id || 'ORD-' + Math.floor(100000 + Math.random() * 900000),
                createdAt: order.createdAt || new Date().toISOString()
            },
            ...prev
        ]);

        // Award loyalty points
        const coinsEarned = Math.floor(order.totalPrice * 0.1);
        if (coinsEarned > 0) {
            addCoins(coinsEarned);
        }

        // Unlock order achievements
        unlockAchievement('first_buy');
    };

    // ============================================================================
    // ROUND 2 METHODS
    // ============================================================================

    // Track recently viewed products
    const addRecentlyViewed = (product) => {
        setRecentlyViewed((prev) => {
            const filtered = prev.filter((p) => p.id !== product.id);
            return [product, ...filtered].slice(0, 6); // Limit to 6 items
        });
    };

    // Save shipping Address
    const saveShippingAddress = (details) => {
        setShippingAddress(details);
    };

    // Unlock Achievement Trophy
    const unlockAchievement = (id) => {
        setAchievements((prev) =>
            prev.map((ach) => {
                if (ach.id === id && !ach.unlocked) {
                    // Award bonus coins for unlocking achievement!
                    addCoins(25);
                    return { ...ach, unlocked: true };
                }
                return ach;
            })
        );
    };

    // Increment clicker taps
    const incrementClickerTaps = () => {
        setClickerTaps((prev) => {
            const updated = prev + 1;
            if (updated === 100) {
                unlockAchievement('clicker_fan');
            }
            // Give 1 coin for every 10 clicks
            if (updated % 10 === 0) {
                addCoins(1);
            }
            return updated;
        });
    };

    // Invite referral friend
    const inviteFriend = (username) => {
        if (!username) return;
        setReferredUsers((prev) => {
            if (prev.includes(username)) return prev;
            // Award bonus 30 coins for referral invite
            addCoins(30);
            return [username, ...prev];
        });
    };

    // Totals Calculations
    const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
    const rawTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

    // Calculate final price with discounts
    let discountAmount = 0;
    if (appliedPromo) {
        if (appliedPromo.type === 'percent') {
            discountAmount = rawTotal * (appliedPromo.value / 100);
        } else if (appliedPromo.type === 'flat') {
            discountAmount = Math.min(rawTotal, appliedPromo.value);
        }
    }
    const cartTotal = Math.max(0, rawTotal - discountAmount);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                clearCart,
                updateCartItemPrice,
                cartTotal,
                rawTotal,
                cartCount,
                discountAmount,

                // Wishlist exports
                wishlistItems,
                toggleWishlist,
                isInWishlist,

                // Orders exports
                orderHistory,
                addOrderToHistory,

                // Loyalty exports
                loyaltyCoins,
                addCoins,
                spendCoins,

                // Promo Coupon exports
                appliedPromo,
                applyPromoCode,
                removePromoCode,

                // Round 2 Exports
                recentlyViewed,
                addRecentlyViewed,
                shippingAddress,
                saveShippingAddress,
                achievements,
                unlockAchievement,
                referredUsers,
                inviteFriend,
                clickerTaps,
                incrementClickerTaps,

                // Safety Moderation exports
                bannedProductIds,
                reportProduct,
                clearBannedProducts
            }}
        >
            {children}
        </CartContext.Provider>
    );
}
