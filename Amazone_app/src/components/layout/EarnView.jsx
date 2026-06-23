import React, { useState } from 'react';
import ClickerGame from './ClickerGame';
import ReferralsView from '../seller/ReferralsView';
import { useTelegram } from '../../hooks/useTelegram';
import { Sparkles, Gamepad, Users } from 'lucide-react';

export default function EarnView() {
    const { triggerHapticImpact } = useTelegram();
    const [subTab, setSubTab] = useState('clicker'); // 'clicker', 'referrals'

    const handleSubTabChange = (tab) => {
        triggerHapticImpact('light');
        setSubTab(tab);
    };

    return (
        <div className="flex flex-col flex-1 pb-24">
            {/* Play & Earn Navigation Sub-pills */}
            <div className="px-4 pt-3 mb-2 flex gap-2">
                <button
                    onClick={() => handleSubTabChange('clicker')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active-press ${subTab === 'clicker'
                        ? 'bg-tg-button text-tg-button-text shadow-sm'
                        : 'bg-tg-secondary-bg text-tg-hint hover:text-tg-text'
                        }`}
                >
                    <Gamepad className="w-4 h-4" />
                    <span>Coin Clicker</span>
                </button>
                <button
                    onClick={() => handleSubTabChange('referrals')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active-press ${subTab === 'referrals'
                        ? 'bg-tg-button text-tg-button-text shadow-sm'
                        : 'bg-tg-secondary-bg text-tg-hint hover:text-tg-text'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    <span>Invite & Earn</span>
                </button>
            </div>

            {/* Content view render */}
            {subTab === 'clicker' ? <ClickerGame /> : <ReferralsView />}
        </div>
    );
}
