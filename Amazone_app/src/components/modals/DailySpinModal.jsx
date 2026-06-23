import React, { useState, useEffect } from 'react';
import { useTelegram } from '../../hooks/useTelegram';
import { useCart } from '../../context/CartContext';
import { X, Gift, Sparkles } from 'lucide-react';

export default function DailySpinModal({ onClose }) {
    const { triggerHapticImpact, triggerHapticNotification } = useTelegram();
    const { addCoins, applyPromoCode } = useCart();

    const [isSpinning, setIsSpinning] = useState(false);
    const [prize, setPrize] = useState(null);
    const [rotation, setRotation] = useState(0);
    const [hasSpunToday, setHasSpunToday] = useState(false);

    const segments = [
        { name: '10 Coins', color: 'bg-amber-500', action: () => addCoins(10), prizeText: '10 Amazone Coins!' },
        { name: 'AMAZONE10 (10% Off)', color: 'bg-emerald-500', action: () => applyPromoCode('AMAZONE10'), prizeText: '10% OFF Promo Code (AMAZONE10)!' },
        { name: '50 Coins', color: 'bg-yellow-500', action: () => addCoins(50), prizeText: '50 Amazone Coins!' },
        { name: 'SUPER20 (20% Off)', color: 'bg-indigo-500', action: () => applyPromoCode('SUPER20'), prizeText: '20% OFF Coupon Code (SUPER20)!' },
        { name: '100 Coins!', color: 'bg-orange-500', action: () => addCoins(100), prizeText: '100 Amazone Coins!' },
        { name: 'FREEGP (15% Off)', color: 'bg-purple-500', action: () => applyPromoCode('FREEGP'), prizeText: '15% OFF Promo Code (FREEGP)!' },
    ];

    useEffect(() => {
        const lastSpun = localStorage.getItem('amazone_last_spun');
        const today = new Date().toDateString();
        if (lastSpun === today) {
            setHasSpunToday(true);
        }
    }, []);

    const handleSpin = () => {
        if (isSpinning || hasSpunToday) return;

        setIsSpinning(true);
        triggerHapticImpact('heavy');

        // Spin between 4 to 8 full rotations + random segment
        const randomSegmentIndex = Math.floor(Math.random() * segments.length);
        const degreesPerSegment = 360 / segments.length;

        // Spin calculation
        const extraDegrees = randomSegmentIndex * degreesPerSegment + (degreesPerSegment / 2);
        const totalSpinDegrees = 360 * 5 + extraDegrees;

        setRotation(totalSpinDegrees);

        // Tick sounds simulation with haptic ticks!
        let tickInterval = setInterval(() => {
            triggerHapticImpact('light');
        }, 120);

        setTimeout(() => {
            clearInterval(tickInterval);
            setIsSpinning(false);

            const selectedPrize = segments[randomSegmentIndex];
            selectedPrize.action();
            setPrize(selectedPrize.prizeText);
            setHasSpunToday(true);

            // Mark as spun today
            localStorage.setItem('amazone_last_spun', new Date().toDateString());
            triggerHapticNotification('success');
        }, 3500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="relative w-full max-w-sm bg-tg-bg border border-tg-secondary-bg rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col items-center">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full bg-tg-secondary-bg text-tg-hint active-press hover:text-tg-text"
                    disabled={isSpinning}
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1.5 text-tg-button font-bold text-xs uppercase tracking-wider mb-2">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>Daily Rewards Wheel</span>
                </div>

                <h2 className="text-lg font-black text-tg-text mb-4 text-center">
                    Spin & Win Coins or Coupons!
                </h2>

                {/* The Visual Spin Wheel */}
                <div className="relative w-52 h-52 my-4 flex items-center justify-center">
                    {/* Outer Wheel Ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-tg-button/30 shadow-inner"></div>

                    {/* Rotating Wheel Container */}
                    <div
                        style={{
                            transform: `rotate(${rotation}deg)`,
                            transition: isSpinning ? 'transform 3.5s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none'
                        }}
                        className="relative w-full h-full rounded-full overflow-hidden border-2 border-tg-button"
                    >
                        {segments.map((seg, idx) => {
                            const angle = idx * (360 / segments.length);
                            return (
                                <div
                                    key={idx}
                                    style={{
                                        transform: `rotate(${angle}deg)`,
                                        transformOrigin: '50% 50%',
                                        clipPath: 'polygon(50% 50%, 30% 0, 70% 0)'
                                    }}
                                    className={`absolute inset-0 flex flex-col items-center pt-2 text-[10px] font-bold text-white ${seg.color}`}
                                >
                                    <span className="transform rotate-180 origin-center translate-y-3 font-semibold text-center leading-tight">
                                        {seg.name.replace(' (', '\n(')}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Wheel Spinner Pointer Pin */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-6 bg-red-600 rounded-b-md z-30 shadow-md">
                        <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-red-600 mx-auto mt-4"></div>
                    </div>

                    {/* Center Peg/Logo */}
                    <div className="absolute w-12 h-12 bg-tg-bg border-4 border-tg-button rounded-full flex items-center justify-center z-20 shadow-md">
                        <Gift className="w-5 h-5 text-tg-button animate-bounce" />
                    </div>
                </div>

                {/* Prize Banner or Spin Button */}
                {prize ? (
                    <div className="w-full bg-tg-secondary-bg/50 border border-tg-secondary-bg rounded-2xl p-4 text-center mt-4 animate-bounce">
                        <p className="text-xs text-tg-hint font-bold uppercase tracking-wider mb-1">Congratulations! You Won</p>
                        <p className="text-sm font-extrabold text-tg-button">{prize}</p>
                        <button
                            onClick={onClose}
                            className="mt-4 px-5 py-2 rounded-xl text-xs font-bold text-tg-button-text bg-tg-button active-press"
                        >
                            Awesome!
                        </button>
                    </div>
                ) : (
                    <div className="w-full text-center mt-4">
                        {hasSpunToday ? (
                            <p className="text-xs text-tg-hint font-semibold">
                                You already claimed your daily reward! Come back tomorrow.
                            </p>
                        ) : (
                            <button
                                onClick={handleSpin}
                                disabled={isSpinning}
                                className="w-full py-3 bg-tg-button text-tg-button-text font-extrabold rounded-2xl shadow-lg hover:shadow-xl active-press disabled:opacity-50"
                            >
                                {isSpinning ? 'SPINNING...' : 'SPIN THE WHEEL!'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
