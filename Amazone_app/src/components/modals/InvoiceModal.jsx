import React, { useState } from 'react';
import { useTelegram } from '../../hooks/useTelegram';
import { X, CreditCard, Shield, Star, DollarSign, Loader2, CheckCircle2 } from 'lucide-react';

export default function InvoiceModal({ amount, onConfirm, onClose }) {
    const { triggerHapticImpact, triggerHapticNotification } = useTelegram();
    const [paymentMethod, setPaymentMethod] = useState('card'); // 'card', 'crypto', 'stars'
    const [isPaying, setIsPaying] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handlePay = () => {
        triggerHapticImpact('heavy');
        setIsPaying(true);

        setTimeout(() => {
            setIsPaying(false);
            setIsSuccess(true);
            triggerHapticNotification('success');

            setTimeout(() => {
                onConfirm();
            }, 1800);
        }, 2200);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="relative w-full max-w-sm bg-tg-bg border border-tg-secondary-bg rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col text-left">

                {/* Close Button */}
                {!isPaying && !isSuccess && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 rounded-full bg-tg-secondary-bg text-tg-hint active-press hover:text-tg-text"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}

                {/* Paying Processing State */}
                {isPaying && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Loader2 className="w-12 h-12 text-tg-button animate-spin mb-4" />
                        <h3 className="text-sm font-bold text-tg-text">Authorizing Secured Payment</h3>
                        <p className="text-[10px] text-tg-hint mt-1">Contacting Stripe payment gateways...</p>
                    </div>
                )}

                {/* Success Paid State */}
                {isSuccess && (
                    <div className="flex flex-col items-center justify-center py-12 text-center animate-scale-up">
                        <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
                        <h3 className="text-base font-black text-tg-text">Payment Confirmed!</h3>
                        <p className="text-[11px] text-tg-hint mt-1">Receipt reference registered on database.</p>
                    </div>
                )}

                {/* Main Billing Forms */}
                {!isPaying && !isSuccess && (
                    <>
                        <div className="flex items-center gap-1.5 text-tg-button font-bold text-[10px] uppercase tracking-wider mb-1.5">
                            <Shield className="w-3.5 h-3.5" />
                            <span>Telegram Secured Payment</span>
                        </div>
                        <h2 className="text-lg font-black text-tg-text mb-5">Pay Securely</h2>

                        {/* Invoice summary info */}
                        <div className="bg-tg-secondary-bg/30 border border-tg-secondary-bg rounded-2xl p-4 mb-5 flex items-center justify-between">
                            <div>
                                <p className="text-[9px] text-tg-hint font-bold uppercase tracking-wider">Amount Due</p>
                                <p className="text-xl font-black text-tg-button mt-0.5">${amount.toFixed(2)}</p>
                            </div>
                            <span className="text-[9px] font-bold text-tg-hint bg-tg-secondary-bg px-2.5 py-1 rounded-full border border-tg-secondary-bg">SECURE CARD</span>
                        </div>

                        {/* Choose payment method */}
                        <span className="text-[10px] font-black text-tg-hint uppercase tracking-wider block mb-2">Select Payment Method</span>
                        <div className="grid grid-cols-3 gap-2 mb-5">
                            <button
                                onClick={() => setPaymentMethod('card')}
                                className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${paymentMethod === 'card' ? 'border-tg-button bg-tg-secondary-bg' : 'border-tg-secondary-bg opacity-75'}`}
                            >
                                <CreditCard className="w-4 h-4 text-tg-text mb-1" />
                                <span className="text-[9px] font-bold text-tg-text">Card</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod('crypto')}
                                className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${paymentMethod === 'crypto' ? 'border-tg-button bg-tg-secondary-bg' : 'border-tg-secondary-bg opacity-75'}`}
                            >
                                <Star className="w-4 h-4 text-amber-500 mb-1" />
                                <span className="text-[9px] font-bold text-tg-text">Stars</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod('wallet')}
                                className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${paymentMethod === 'wallet' ? 'border-tg-button bg-tg-secondary-bg' : 'border-tg-secondary-bg opacity-75'}`}
                            >
                                <DollarSign className="w-4 h-4 text-emerald-500 mb-1" />
                                <span className="text-[9px] font-bold text-tg-text">Crypto</span>
                            </button>
                        </div>

                        {/* Dynamic sub-forms */}
                        {paymentMethod === 'card' && (
                            <div className="space-y-3.5 mb-6">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-tg-hint uppercase tracking-wider">Card Number</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            readOnly
                                            value="4111 •••• •••• 9012"
                                            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-tg-secondary-bg text-tg-text border border-tg-secondary-bg outline-none"
                                        />
                                        <CreditCard className="w-3.5 h-3.5 text-tg-hint absolute left-3 top-1/2 -translate-y-1/2" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-tg-hint uppercase tracking-wider">Expiry</label>
                                        <input type="text" readOnly value="12 / 28" className="w-full px-3 py-2 rounded-xl text-xs bg-tg-secondary-bg text-tg-text border border-tg-secondary-bg outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-tg-hint uppercase tracking-wider">CVC</label>
                                        <input type="password" readOnly value="•••" className="w-full px-3 py-2 rounded-xl text-xs bg-tg-secondary-bg text-tg-text border border-tg-secondary-bg outline-none" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'crypto' && (
                            <div className="bg-tg-secondary-bg/25 border border-tg-secondary-bg rounded-2xl p-4 mb-6 flex gap-3">
                                <Star className="w-6 h-6 text-amber-500 shrink-0" />
                                <div className="text-[10px]">
                                    <p className="font-bold text-tg-text">Pay with Telegram Stars</p>
                                    <p className="text-tg-hint leading-relaxed mt-1">
                                        Redeem <span className="font-semibold text-amber-500">{Math.floor(amount * 50)} Stars</span> directly. Invoices are signed using Telegram's built-in sandbox validation.
                                    </p>
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'wallet' && (
                            <div className="bg-tg-secondary-bg/25 border border-tg-secondary-bg rounded-2xl p-4 mb-6 flex gap-3">
                                <DollarSign className="w-6 h-6 text-emerald-500 shrink-0" />
                                <div className="text-[10px]">
                                    <p className="font-bold text-tg-text">Pay with Toncoin (TON)</p>
                                    <p className="text-tg-hint leading-relaxed mt-1">
                                        Opens standard Telegram Tonkeeper wallet directly to execute safe blockchain transfers. Price: <span className="font-semibold text-emerald-500">{(amount / 7).toFixed(3)} TON</span>.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Pay Button */}
                        <button
                            onClick={handlePay}
                            className="w-full py-3.5 bg-tg-button text-tg-button-text font-black rounded-2xl shadow-md active-press flex items-center justify-center gap-1.5"
                        >
                            <span>Pay ${amount.toFixed(2)}</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
