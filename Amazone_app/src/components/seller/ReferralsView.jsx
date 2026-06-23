import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useTelegram } from '../../hooks/useTelegram';
import { Share2, Users, Gift, PlusCircle, Check } from 'lucide-react';

export default function ReferralsView() {
    const { referredUsers, inviteFriend, loyaltyCoins } = useCart();
    const { triggerHapticImpact, triggerHapticNotification, user } = useTelegram();
    const [friendInput, setFriendInput] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleInvite = (e) => {
        e.preventDefault();
        if (!friendInput) return;

        const cleanUsername = friendInput.trim().startsWith('@') ? friendInput.trim() : `@${friendInput.trim()}`;

        if (referredUsers.includes(cleanUsername)) {
            alert("This friend has already been referred!");
            return;
        }

        triggerHapticNotification('success');
        inviteFriend(cleanUsername);
        setSuccessMsg(`Invited ${cleanUsername} successfully! +30 Coins awarded.`);
        setFriendInput('');

        setTimeout(() => setSuccessMsg(''), 4000);
    };

    const handleShareLink = () => {
        triggerHapticImpact('medium');
        const refLink = `https://t.me/AmazoneBot/shop?startapp=ref_${user?.id || '12345'}`;

        // Try standard clipboard copying fallback
        navigator.clipboard.writeText(refLink).then(() => {
            alert("Referral Link copied to clipboard:\n" + refLink);
        });
    };

    return (
        <div className="flex flex-col flex-1 px-4 py-3 pb-32 text-left">
            <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-tg-button" />
                <h2 className="text-base font-bold text-tg-text">Referral Program</h2>
            </div>

            {/* Refer info panel */}
            <div className="bg-gradient-to-br from-tg-button/10 to-tg-secondary-bg/30 border border-tg-button/20 rounded-3xl p-5 mb-5 text-center">
                <Gift className="w-10 h-10 text-amber-500 mx-auto mb-2 animate-bounce" />
                <h3 className="text-sm font-bold text-tg-text">Invite Friends, Earn Coins</h3>
                <p className="text-xs text-tg-hint leading-relaxed mt-1 max-w-xs mx-auto font-medium">
                    Share your unique referral link with your contacts. For every friend who opens the Mini App, you'll instantly get <span className="font-bold text-tg-button">+30 Amazone Coins</span>!
                </p>
                <button
                    onClick={handleShareLink}
                    className="mt-4 px-6 py-2.5 bg-tg-button text-tg-button-text font-black rounded-xl text-xs flex items-center justify-center gap-1.5 mx-auto active-press shadow-md"
                >
                    <Share2 className="w-4 h-4" />
                    <span>Copy Invitation Link</span>
                </button>
            </div>

            {/* Success Prompt */}
            {successMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl p-4 mb-4 text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{successMsg}</span>
                </div>
            )}

            {/* Simulate Friend Invites Form */}
            <form onSubmit={handleInvite} className="bg-tg-secondary-bg/25 border border-tg-secondary-bg rounded-2xl p-4 mb-5 space-y-3">
                <span className="text-[10px] font-black text-tg-hint uppercase tracking-wider block">Mock Invites (Sandbox)</span>
                <p className="text-[10px] text-tg-hint leading-relaxed font-medium">Type a friend's Telegram handle to simulate they signed up via your link:</p>

                <div className="flex gap-2">
                    <input
                        type="text"
                        required
                        value={friendInput}
                        onChange={(e) => setFriendInput(e.target.value)}
                        placeholder="e.g. @telegram_user"
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-tg-bg text-tg-text placeholder-tg-hint border border-tg-secondary-bg focus:outline-none focus:ring-1 focus:ring-tg-button"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2.5 bg-tg-button text-tg-button-text font-bold rounded-xl text-xs active-press flex items-center gap-1 shrink-0"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span>Invite</span>
                    </button>
                </div>
            </form>

            {/* List of Referred friends */}
            <div className="space-y-3">
                <span className="text-[10px] font-black text-tg-hint uppercase tracking-wider block">Your Referrals ({referredUsers.length})</span>
                {referredUsers.length > 0 ? (
                    <div className="bg-tg-bg border border-tg-secondary-bg rounded-2xl divide-y divide-tg-secondary-bg/40">
                        {referredUsers.map((refUser, i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-3 text-xs font-medium">
                                <span className="text-tg-text">{refUser}</span>
                                <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full text-[9px] uppercase">Awarded +30🪙</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-tg-hint py-2 font-medium">No referred friends yet.</p>
                )}
            </div>
        </div>
    );
}
