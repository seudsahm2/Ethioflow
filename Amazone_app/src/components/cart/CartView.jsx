import React, { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useTelegram } from '../../hooks/useTelegram';
import { createOrder } from '../../services/api';
import InvoiceModal from '../modals/InvoiceModal';
import { Trash2, Plus, Minus, ShoppingBag, Loader2, Check, Gift, Truck, MapPin, Edit2, ShieldAlert, Bot, Sparkles } from 'lucide-react';

export default function CartView({ setActiveTab, onStartBotNegotiation }) {
    const {
        cartItems, addToCart, removeFromCart, clearCart, cartTotal, rawTotal,
        discountAmount, loyaltyCoins, spendCoins, appliedPromo, applyPromoCode,
        removePromoCode, addOrderToHistory, shippingAddress, saveShippingAddress
    } = useCart();

    const { tg, isTelegram, initData, user, triggerHapticImpact, triggerHapticNotification } = useTelegram();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Secured Invoice Modal visibility
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);

    // Promo Code local state
    const [promoInput, setPromoInput] = useState('');
    const [promoError, setPromoError] = useState('');
    const [promoSuccess, setPromoSuccess] = useState('');

    // Shipping Address Editor states
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [fullNameInput, setFullNameInput] = useState(shippingAddress.fullName || '');
    const [phoneInput, setPhoneInput] = useState(shippingAddress.phone || '');
    const [addressInput, setAddressInput] = useState(shippingAddress.address || '');

    // Gift Checkout State
    const [isGiftCheckout, setIsGiftCheckout] = useState(false);
    const [giftUsername, setGiftUsername] = useState('');

    // Loyalty points state
    const [applyCoins, setApplyCoins] = useState(false);
    const coinValueInDollars = Math.min(rawTotal - discountAmount, loyaltyCoins / 10); // 10 coins = $1.00
    const finalBillTotal = Math.max(0, cartTotal - (applyCoins ? coinValueInDollars : 0));

    // Shipping Progress Bar calculation
    const freeShippingThreshold = 100;
    const isFreeShippingUnlocked = rawTotal >= freeShippingThreshold;
    const shippingProgress = Math.min(100, (rawTotal / freeShippingThreshold) * 100);

    const handleApplyPromo = (e) => {
        e.preventDefault();
        if (!promoInput) return;

        triggerHapticImpact('medium');
        const res = applyPromoCode(promoInput);
        if (res.success) {
            setPromoSuccess(res.message);
            setPromoError('');
            setPromoInput('');
        } else {
            setPromoError(res.message);
            setPromoSuccess('');
        }
    };

    const handleRemovePromo = () => {
        triggerHapticImpact('light');
        removePromoCode();
        setPromoSuccess('');
        setPromoError('');
    };

    const handleToggleCoins = () => {
        triggerHapticImpact('light');
        setApplyCoins(!applyCoins);
    };

    const handleSaveAddress = (e) => {
        e.preventDefault();
        triggerHapticNotification('success');
        saveShippingAddress({
            fullName: fullNameInput,
            phone: phoneInput,
            address: addressInput
        });
        setIsEditingAddress(false);
    };

    const handleCheckoutClick = () => {
        // Validate shipping address first
        if (!shippingAddress.address && !isGiftCheckout) {
            triggerHapticNotification('error');
            setIsEditingAddress(true);
            alert("Please save your shipping address details first!");
            return;
        }
        triggerHapticImpact('heavy');
        setShowInvoiceModal(true);
    };

    // Callback once Stripe invoice succeeds in InvoiceModal
    const handleInvoicePaymentConfirmed = async () => {
        setShowInvoiceModal(false);
        setIsSubmitting(true);

        const orderPayload = {
            items: cartItems.map((item) => ({
                id: item.id,
                title: item.title,
                quantity: item.quantity,
                price: item.price,
            })),
            totalPrice: finalBillTotal,
            buyer: user,
            shippingDetails: isGiftCheckout ? { isGift: true, friendUsername: giftUsername } : shippingAddress,
            timestamp: new Date().toISOString(),
        };

        try {
            // 1. Save order to backend database
            const result = await createOrder(orderPayload, initData);

            // Deduct loyalty points if used
            if (applyCoins) {
                spendCoins(Math.floor(coinValueInDollars * 10));
            }

            // Add to order history
            addOrderToHistory({
                id: result.orderId,
                items: orderPayload.items,
                totalPrice: orderPayload.totalPrice
            });

            // 2. Send data back to the Telegram bot so it can reply in real-time
            if (isTelegram && tg) {
                tg.sendData(JSON.stringify({
                    ...orderPayload,
                    orderId: result.orderId || 'ORD-UNKNOWN'
                }));
            } else {
                alert(`[Browser Checkout Success]\n\nOrder Ref: ${result.orderId}\n\nInvoice paid. Receipt archived on DB!`);
            }

            clearCart();
            setActiveTab('shop');
        } catch (error) {
            console.error("Database connection error during order submission:", error);
            if (isTelegram && tg) {
                tg.showAlert('Failed to save to database, but sending order payload: ' + error.message);
                tg.sendData(JSON.stringify(orderPayload));
            }
            clearCart();
            setActiveTab('shop');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        // Handle showing/hiding Telegram main Pay button
        if (cartItems.length > 0 && tg && !isSubmitting && !showInvoiceModal) {
            tg.MainButton.text = `PAY $${finalBillTotal.toFixed(2)}`;
            tg.MainButton.show();
            tg.MainButton.onClick(handleCheckoutClick);
        } else if (tg) {
            tg.MainButton.hide();
        }

        return () => {
            if (tg) {
                tg.MainButton.hide();
                tg.MainButton.offClick(handleCheckoutClick);
            }
        };
    }, [cartItems, finalBillTotal, tg, isSubmitting, showInvoiceModal, shippingAddress, isGiftCheckout]);

    if (cartItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 px-4 py-16 text-center animate-fade-in">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-tg-secondary-bg text-tg-hint mb-4">
                    <ShoppingBag className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-bold text-tg-text mb-1">Your cart is empty</h2>
                <p className="text-sm text-tg-hint max-w-[240px] leading-relaxed mb-6">
                    Add items from the store to see them here and place an order.
                </p>
                <button
                    onClick={() => setActiveTab('shop')}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-tg-button-text bg-tg-button shadow-sm active-press"
                >
                    Go Shopping
                </button>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col flex-1 px-4 py-3 pb-32">

            {/* Loading Overlay */}
            {isSubmitting && (
                <div className="absolute inset-0 bg-tg-bg/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center p-6">
                    <Loader2 className="w-10 h-10 text-tg-button animate-spin mb-4" />
                    <p className="text-sm font-bold text-tg-text">Processing Order...</p>
                    <p className="text-xs text-tg-hint mt-1">Notifying merchant and updating database.</p>
                </div>
            )}

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-tg-text">Shopping Cart</h2>
                <button
                    onClick={clearCart}
                    className="flex items-center gap-1 text-xs font-semibold text-tg-destructive active-press"
                >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All</span>
                </button>
            </div>

            {/* Free Shipping / Delivery Progress Bar */}
            <div className="bg-tg-secondary-bg/20 border border-tg-secondary-bg rounded-2xl p-4 mb-4 text-left">
                <div className="flex items-center gap-1.5 mb-2">
                    <Truck className="w-4 h-4 text-tg-button" />
                    <span className="text-xs font-bold text-tg-text">
                        {isFreeShippingUnlocked ? 'Free shipping is unlocked!' : `Add $${(freeShippingThreshold - rawTotal).toFixed(2)} more for Free Shipping`}
                    </span>
                </div>
                <div className="w-full h-2 bg-tg-secondary-bg rounded-full overflow-hidden mb-1">
                    <div
                        style={{ width: `${shippingProgress}%` }}
                        className="h-full bg-gradient-to-r from-tg-button to-emerald-500 rounded-full transition-all duration-300"
                    ></div>
                </div>
                <div className="flex justify-between text-[9px] text-tg-hint font-bold">
                    <span>Cashback: +${(finalBillTotal * 0.1).toFixed(2)} in Coins</span>
                    <span>$100.00 Threshold</span>
                </div>
            </div>

            {/* Pulsing HelpBot Negotiation Trigger Agent Callout Card */}
            {onStartBotNegotiation && (
                <div className="bg-tg-secondary-bg/30 border border-tg-button/20 rounded-2xl p-4 mb-4 text-left flex flex-col gap-3.5 animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-tg-button/5 rounded-full -mr-8 -mt-8"></div>
                    <div className="flex items-start gap-3 relative z-10">
                        <div className="w-9 h-9 rounded-full bg-tg-button/10 text-tg-button flex items-center justify-center shrink-0 shadow-sm relative">
                            <Bot className="w-4.5 h-4.5" />
                            <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tg-button opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-tg-button"></span>
                            </span>
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-tg-text">HelpBot Price Bargaining Agent</h4>
                            <p className="text-[10px] text-tg-hint font-medium leading-relaxed mt-1">
                                Let your autonomous shopping bot contact each channel merchant bot directly and bargain for a custom price markdown!
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            triggerHapticImpact('heavy');
                            onStartBotNegotiation();
                        }}
                        className="w-full py-2.5 bg-gradient-to-r from-tg-button to-indigo-500 hover:from-tg-button/95 hover:to-indigo-600 text-white font-black rounded-xl text-xs active-press flex items-center justify-center gap-1.5 shadow-sm relative z-10 transition-all"
                    >
                        <Sparkles className="w-3.5 h-3.5 fill-current animate-pulse text-yellow-300" />
                        <span>Bargain & Make a Deal via Bot</span>
                    </button>
                </div>
            )}

            {/* Cart Items List */}
            <div className="space-y-3 mb-5">
                {cartItems.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center gap-3 bg-tg-bg border border-tg-secondary-bg rounded-2xl p-3 shadow-sm"
                    >
                        {/* Visual Image Box with Real Picture */}
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden bg-tg-secondary-bg shrink-0 shadow-inner">
                            {item.image ? (
                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className={`w-full h-full flex items-center justify-center ${item.color || 'bg-slate-700'}`}>
                                    <span className="text-white text-[10px] font-bold">Item</span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0 text-left">
                            <h3 className="text-sm font-semibold text-tg-text truncate mb-0.5">
                                {item.title}
                            </h3>
                            <p className="text-xs text-tg-hint font-medium flex items-center gap-1.5 flex-wrap">
                                {item.originalPrice && item.originalPrice !== item.price ? (
                                    <>
                                        <span className="text-tg-destructive line-through">${item.originalPrice.toFixed(2)}</span>
                                        <span className="text-emerald-500 font-extrabold flex items-center gap-0.5">
                                            <span>${item.price.toFixed(2)}</span>
                                            <span className="text-[8px] bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider font-black">Bot Negotiated</span>
                                        </span>
                                    </>
                                ) : (
                                    <span>${item.price.toFixed(2)} each</span>
                                )}
                            </p>
                        </div>

                        <div className="flex items-center bg-tg-secondary-bg rounded-lg p-0.5 shadow-sm">
                            <button
                                onClick={() => removeFromCart(item.id)}
                                className="flex items-center justify-center w-6 h-6 rounded-md text-tg-text active-press hover:bg-tg-bg"
                                aria-label="Decrease"
                            >
                                <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-5 text-center text-xs font-bold text-tg-text">
                                {item.quantity}
                            </span>
                            <button
                                onClick={() => {
                                    addToCart(item);
                                    triggerHapticImpact('medium');
                                }}
                                className="flex items-center justify-center w-6 h-6 rounded-md text-tg-text active-press hover:bg-tg-bg"
                                aria-label="Increase"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Gift Delivery Toggle */}
            <div className="bg-tg-secondary-bg/25 border border-tg-secondary-bg rounded-2xl p-4 mb-4 text-left space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <p className="text-xs font-bold text-tg-text flex items-center gap-1.5">
                            <Gift className="w-4 h-4 text-rose-500" />
                            <span>Send as Gift to Friend?</span>
                        </p>
                        <p className="text-[10px] text-tg-hint font-medium">Deliver this item directly to a friends Telegram handle.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => { triggerHapticImpact('light'); setIsGiftCheckout(!isGiftCheckout); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active-press ${isGiftCheckout ? 'bg-rose-500 text-white animate-pulse' : 'bg-tg-secondary-bg text-tg-hint border border-tg-secondary-bg'}`}
                    >
                        {isGiftCheckout ? 'Active!' : 'Toggle'}
                    </button>
                </div>

                {isGiftCheckout && (
                    <input
                        type="text"
                        required
                        value={giftUsername}
                        onChange={(e) => setGiftUsername(e.target.value)}
                        placeholder="Friend's @username..."
                        className="w-full px-3.5 py-2 rounded-xl text-xs bg-tg-bg text-tg-text border border-tg-secondary-bg focus:outline-none focus:ring-1 focus:ring-tg-button placeholder-tg-hint"
                    />
                )}
            </div>

            {/* Shipping Address Book section */}
            {!isGiftCheckout && (
                <div className="bg-tg-secondary-bg/25 border border-tg-secondary-bg rounded-2xl p-4 mb-4 text-left space-y-3.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-tg-text">
                            <MapPin className="w-4 h-4 text-tg-button" />
                            <span>Shipping Address details</span>
                        </div>
                        <button
                            onClick={() => { triggerHapticImpact('light'); setIsEditingAddress(!isEditingAddress); }}
                            className="text-tg-button p-1 active-press"
                            aria-label="Edit address"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    </div>

                    {isEditingAddress ? (
                        <form onSubmit={handleSaveAddress} className="space-y-3 animate-fade-in">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-tg-hint uppercase tracking-wider">Full Name</label>
                                <input type="text" required value={fullNameInput} onChange={(e) => setFullNameInput(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs bg-tg-bg text-tg-text border border-tg-secondary-bg focus:outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-tg-hint uppercase tracking-wider">Phone</label>
                                <input type="text" required value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs bg-tg-bg text-tg-text border border-tg-secondary-bg focus:outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-tg-hint uppercase tracking-wider">Full Address</label>
                                <input type="text" required value={addressInput} onChange={(e) => setAddressInput(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs bg-tg-bg text-tg-text border border-tg-secondary-bg focus:outline-none" />
                            </div>
                            <button type="submit" className="w-full py-2 bg-tg-button text-tg-button-text rounded-xl font-bold text-xs active-press">
                                Save Details
                            </button>
                        </form>
                    ) : shippingAddress.address ? (
                        <div className="text-xs space-y-1 text-tg-hint font-medium">
                            <p className="font-extrabold text-tg-text">{shippingAddress.fullName}</p>
                            <p>Phone: {shippingAddress.phone}</p>
                            <p>Address: {shippingAddress.address}</p>
                        </div>
                    ) : (
                        <div className="flex gap-2 text-xs text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>No address saved! Please click edit and input shipping details.</span>
                        </div>
                    )}
                </div>
            )}

            {/* Loyalty Point Coin Redeeming Panel */}
            {loyaltyCoins >= 10 && (
                <div className="bg-gradient-to-r from-amber-500/10 to-tg-secondary-bg border border-amber-500/20 rounded-2xl p-4 mb-4 text-left flex items-center justify-between">
                    <div className="space-y-0.5 pr-2">
                        <p className="text-xs font-bold text-tg-text flex items-center gap-1.5">
                            <Gift className="w-4 h-4 text-amber-500" />
                            <span>Apply Loyalty Points?</span>
                        </p>
                        <p className="text-[10px] text-tg-hint font-medium leading-normal">
                            Redeem up to <span className="font-bold text-amber-500">{loyaltyCoins} coins</span> for a direct discount of <span className="font-bold text-emerald-500">${coinValueInDollars.toFixed(2)}</span>.
                        </p>
                    </div>
                    <button
                        onClick={handleToggleCoins}
                        className={`px-4 py-2 shrink-0 rounded-xl text-xs font-bold transition-all active-press ${applyCoins ? 'bg-amber-500 text-white' : 'bg-tg-secondary-bg text-tg-hint hover:text-tg-text border border-tg-secondary-bg'}`}
                    >
                        {applyCoins ? 'Applied!' : 'Apply'}
                    </button>
                </div>
            )}

            {/* Promo Code Input panel */}
            <div className="bg-tg-secondary-bg/20 border border-tg-secondary-bg rounded-2xl p-4 mb-4 text-left">
                <span className="text-[10px] font-black text-tg-hint uppercase tracking-wider block mb-2">Have a Promo Coupon Code?</span>

                {appliedPromo ? (
                    <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/25 p-2.5 rounded-xl text-xs font-bold text-emerald-500">
                        <span className="flex items-center gap-1.5">
                            <Check className="w-4 h-4" />
                            <span>Coupon "{appliedPromo.code}" active</span>
                        </span>
                        <button onClick={handleRemovePromo} className="text-[10px] text-red-500 font-extrabold uppercase hover:underline">
                            Remove
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleApplyPromo} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="e.g. AMAZONE10"
                            value={promoInput}
                            onChange={(e) => setPromoInput(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-xs bg-tg-bg text-tg-text border border-tg-secondary-bg focus:outline-none focus:ring-1 focus:ring-tg-button placeholder-tg-hint"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-tg-button text-tg-button-text font-bold rounded-xl text-xs active-press"
                        >
                            Apply
                        </button>
                    </form>
                )}
                {promoError && <p className="text-[10px] font-bold text-red-500 mt-2">{promoError}</p>}
                {promoSuccess && <p className="text-[10px] font-bold text-emerald-500 mt-2">{promoSuccess}</p>}
            </div>

            {/* Bill Details */}
            <div className="bg-tg-secondary-bg/50 border border-tg-secondary-bg rounded-2xl p-4 space-y-2.5 text-left">
                <h3 className="text-xs font-bold text-tg-text uppercase tracking-wider mb-1">
                    Bill Details
                </h3>
                <div className="flex items-center justify-between text-xs text-tg-hint font-medium">
                    <span>Subtotal</span>
                    <span className="text-tg-text">${rawTotal.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-500">
                        <span>Promo Code Discount</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                )}

                {applyCoins && (
                    <div className="flex items-center justify-between text-xs font-bold text-amber-500">
                        <span>Loyalty Points Used ({Math.floor(coinValueInDollars * 10)} coins)</span>
                        <span>-${coinValueInDollars.toFixed(2)}</span>
                    </div>
                )}

                <div className="flex items-center justify-between text-xs text-tg-hint font-medium">
                    <span>Delivery / Service Fee</span>
                    <span className="text-emerald-500 font-semibold">FREE</span>
                </div>
                <div className="h-[1px] bg-tg-secondary-bg my-1"></div>
                <div className="flex items-center justify-between text-sm font-bold text-tg-text pt-0.5">
                    <span>To Pay</span>
                    <span className="text-tg-button text-base font-black">${finalBillTotal.toFixed(2)}</span>
                </div>
            </div>

            {/* Browser Fallback Checkout Button (Hidden if in Telegram) */}
            {!isTelegram && (
                <button
                    onClick={handleCheckoutClick}
                    className="w-full mt-6 py-3.5 bg-tg-button text-tg-button-text font-bold rounded-2xl shadow-md active-press"
                >
                    Checkout (${finalBillTotal.toFixed(2)})
                </button>
            )}

            {/* Mount Secure Payment Invoice Simulator */}
            {showInvoiceModal && (
                <InvoiceModal
                    amount={finalBillTotal}
                    onConfirm={handleInvoicePaymentConfirmed}
                    onClose={() => setShowInvoiceModal(false)}
                />
            )}
        </div>
    );
}
