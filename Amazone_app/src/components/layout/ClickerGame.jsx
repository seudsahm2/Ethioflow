import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useTelegram } from '../../hooks/useTelegram';
import { Trophy, Coins, Zap, Sparkles } from 'lucide-react';

export default function ClickerGame() {
    const { loyaltyCoins, clickerTaps, incrementClickerTaps, achievements } = useCart();
    const { triggerHapticImpact } = useTelegram();
    const [popups, setPopups] = useState([]); // tracks floating +1 indicators
    const [isAnimating, setIsAnimating] = useState(false);

    const handleTap = (e) => {
        triggerHapticImpact('light');
        incrementClickerTaps();
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 100);

        // Click coordinates for floating numerical +1 indicators
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newPopup = { id: Date.now(), x, y };
        setPopups((prev) => [...prev, newPopup]);

        setTimeout(() => {
            setPopups((prev) => prev.filter((p) => p.id !== newPopup.id));
        }, 800);
    };

    return (
        <div className="flex flex-col flex-1 px-4 py-3 pb-32 text-left select-none">
            {/* Upper stats row */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-tg-secondary-bg/30 border border-tg-secondary-bg rounded-2xl p-3 flex items-center gap-2.5">
                    <Coins className="w-5 h-5 text-amber-500" />
                    <div>
                        <p className="text-[10px] text-tg-hint font-bold uppercase tracking-wider">Your Balance</p>
                        <p className="text-xs font-black text-tg-text">{loyaltyCoins} Coins</p>
                    </div>
                </div>
                <div className="bg-tg-secondary-bg/30 border border-tg-secondary-bg rounded-2xl p-3 flex items-center gap-2.5">
                    <Zap className="w-5 h-5 text-tg-button animate-pulse" />
                    <div>
                        <p className="text-[10px] text-tg-hint font-bold uppercase tracking-wider">Total Taps</p>
                        <p className="text-xs font-black text-tg-text">{clickerTaps} Taps</p>
                    </div>
                </div>
            </div>

            {/* Clicker Area */}
            <div className="flex flex-col items-center justify-center py-6 mb-6">
                <p className="text-[10px] font-black text-tg-hint uppercase tracking-wider mb-2">Tap Coin to Earn Free Coins!</p>
                <p className="text-[9px] text-tg-hint mb-6">(1 Coin per 10 Taps • Clicker achievement at 100 taps)</p>

                {/* The Golden Coin Button */}
                <div
                    onClick={handleTap}
                    className="relative w-44 h-44 cursor-pointer"
                >
                    {/* Floating plus indicators */}
                    {popups.map((p) => (
                        <span
                            key={p.id}
                            style={{ left: p.x, top: p.y }}
                            className="absolute z-30 text-amber-400 font-black text-lg select-none pointer-events-none animate-float-up"
                        >
                            +1
                        </span>
                    ))}

                    {/* Circular Ripple / Background glow */}
                    <div className={`absolute inset-0 rounded-full bg-amber-500/25 blur-xl transition-all duration-300 ${isAnimating ? 'scale-125 opacity-100' : 'scale-100 opacity-60'}`}></div>

                    {/* Golden Coin Visual representation */}
                    <div className={`w-full h-full rounded-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 border-8 border-yellow-400 shadow-xl flex items-center justify-center transition-all active:scale-95 duration-100 relative ${isAnimating ? 'rotate-6' : ''}`}>
                        {/* Inner ridge */}
                        <div className="absolute inset-2.5 rounded-full border-4 border-dashed border-yellow-300/40"></div>

                        {/* Center Star / Logo */}
                        <Sparkles className="w-16 h-16 text-yellow-100 drop-shadow animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Achievements/Trophies Area */}
            <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-3">
                    <Trophy className="w-4.5 h-4.5 text-tg-button" />
                    <h3 className="text-xs font-bold text-tg-text uppercase tracking-wider">Trophies & Milestones</h3>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                    {achievements.map((ach) => (
                        <div
                            key={ach.id}
                            className={`flex gap-2.5 p-3 rounded-2xl border text-left items-start relative overflow-hidden transition-all ${ach.unlocked ? 'bg-gradient-to-br from-tg-button/10 to-tg-secondary-bg/20 border-tg-button/30' : 'bg-tg-secondary-bg/25 border-tg-secondary-bg/80 opacity-70'}`}
                        >
                            <div className="text-2xl mt-0.5 shrink-0 select-none">{ach.icon}</div>
                            <div className="min-w-0">
                                <h4 className="text-xs font-black text-tg-text truncate">{ach.title}</h4>
                                <p className="text-[10px] text-tg-hint leading-normal mt-0.5 font-medium">{ach.desc}</p>

                                {ach.unlocked ? (
                                    <span className="text-[8px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full mt-2 inline-block">Unlocked +25🪙</span>
                                ) : (
                                    <span className="text-[8px] font-bold uppercase text-tg-hint bg-tg-secondary-bg px-1.5 py-0.5 rounded-full mt-2 inline-block">Locked</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
