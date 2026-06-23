import React, { useState } from 'react';
import { useTelegram } from '../../hooks/useTelegram';
import { useCart } from '../../context/CartContext';
import { HelpCircle, ChevronDown, ChevronUp, Palette, Compass, MessageCircle, HelpCircle as HelpIcon } from 'lucide-react';

export default function FAQView() {
    const { triggerHapticImpact, openTelegramLink } = useTelegram();
    const { loyaltyCoins } = useCart();

    const [selectedTheme, setSelectedTheme] = useState('Default');
    const [openIndex, setOpenIndex] = useState(null);

    const themes = [
        { name: 'Default', desc: 'Telegram Match', colors: ['#2481cc', '#ffffff', '#17212b'] },
        { name: 'Cyberpunk', desc: 'Neon Synthwave', colors: ['#ff007f', '#00f0ff', '#120136'] },
        { name: 'Forest', desc: 'Deep Organic', colors: ['#2d6a4f', '#d8f3dc', '#081c15'] },
        { name: 'Sunset', desc: 'Warm Ocean', colors: ['#f77f00', '#fcbf49', '#003049'] },
        { name: 'Lavender', desc: 'Cyber Magic', colors: ['#7209b7', '#f72585', '#1e1a3a'] },
    ];

    const faqs = [
        {
            q: 'How does the Telegram Bot link with the Mini App?',
            a: 'When channel owners register their bot, the bot stores item details in our database. The Mini App pulls this structured catalog in real-time. When you buy, the bot receives an instant webhook to notify the channel admin.'
        },
        {
            q: 'How do I earn Amazone Coins?',
            a: 'You get 10% cash-back in Amazone Coins on every order you place! You can also earn extra coins by spinning our Daily Wheel or inviting friends to use the bot.'
        },
        {
            q: 'Are payments secure?',
            a: 'Yes, absolutely! Payment checkouts are powered directly by Telegram Payments API or integrated secured merchant gateways. Your sensitive credentials are never stored on our side.'
        },
        {
            q: 'Can I add my own products as a channel owner?',
            a: 'Yes! Simply click on the "Seller Portal" tab, enter your product name, details, and price, and click publish. It will immediately go live on the Amazone marketplace!'
        }
    ];

    const changeTheme = (themeName) => {
        setSelectedTheme(themeName);
        triggerHapticImpact('medium');

        const root = document.documentElement;
        if (themeName === 'Default') {
            root.style.removeProperty('--tg-theme-button-color');
            root.style.removeProperty('--tg-theme-button-text-color');
            root.style.removeProperty('--tg-theme-text-color');
            root.style.removeProperty('--tg-theme-bg-color');
            root.style.removeProperty('--tg-theme-secondary-bg-color');
        } else if (themeName === 'Cyberpunk') {
            root.style.setProperty('--tg-theme-button-color', '#ff007f');
            root.style.setProperty('--tg-theme-button-text-color', '#ffffff');
            root.style.setProperty('--tg-theme-text-color', '#00f0ff');
            root.style.setProperty('--tg-theme-bg-color', '#120136');
            root.style.setProperty('--tg-theme-secondary-bg-color', '#2a005c');
        } else if (themeName === 'Forest') {
            root.style.setProperty('--tg-theme-button-color', '#2d6a4f');
            root.style.setProperty('--tg-theme-button-text-color', '#ffffff');
            root.style.setProperty('--tg-theme-text-color', '#d8f3dc');
            root.style.setProperty('--tg-theme-bg-color', '#081c15');
            root.style.setProperty('--tg-theme-secondary-bg-color', '#1b4332');
        } else if (themeName === 'Sunset') {
            root.style.setProperty('--tg-theme-button-color', '#f77f00');
            root.style.setProperty('--tg-theme-button-text-color', '#ffffff');
            root.style.setProperty('--tg-theme-text-color', '#fcbf49');
            root.style.setProperty('--tg-theme-bg-color', '#003049');
            root.style.setProperty('--tg-theme-secondary-bg-color', '#021824');
        } else if (themeName === 'Lavender') {
            root.style.setProperty('--tg-theme-button-color', '#7209b7');
            root.style.setProperty('--tg-theme-button-text-color', '#ffffff');
            root.style.setProperty('--tg-theme-text-color', '#f72585');
            root.style.setProperty('--tg-theme-bg-color', '#1e1a3a');
            root.style.setProperty('--tg-theme-secondary-bg-color', '#3d348b');
        }
    };

    const toggleFaq = (index) => {
        triggerHapticImpact('light');
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="flex flex-col flex-1 px-4 py-3 pb-32 text-left">
            {/* Theme Customization Section */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <Palette className="w-5 h-5 text-tg-button" />
                    <h2 className="text-base font-bold text-tg-text">Personalization</h2>
                </div>

                <div className="bg-tg-secondary-bg/30 border border-tg-secondary-bg rounded-2xl p-4">
                    <p className="text-xs text-tg-hint mb-3 font-medium">Select a dynamic theme color for your shopping experience:</p>
                    <div className="grid grid-cols-2 gap-2.5">
                        {themes.map((theme) => (
                            <button
                                key={theme.name}
                                onClick={() => changeTheme(theme.name)}
                                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${selectedTheme === theme.name ? 'border-tg-button bg-tg-secondary-bg' : 'border-tg-secondary-bg hover:border-tg-hint'}`}
                            >
                                <span className="text-xs font-bold text-tg-text">{theme.name}</span>
                                <span className="text-[10px] text-tg-hint mt-0.5">{theme.desc}</span>
                                <div className="flex gap-1 mt-2">
                                    {theme.colors.map((c, i) => (
                                        <div key={i} style={{ backgroundColor: c }} className="w-3.5 h-3.5 rounded-full border border-black/10"></div>
                                    ))}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Help & Support Accordion Section */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <HelpCircle className="w-5 h-5 text-tg-button" />
                    <h2 className="text-base font-bold text-tg-text">Help & FAQ Desk</h2>
                </div>

                <div className="space-y-2.5">
                    {faqs.map((faq, idx) => (
                        <div
                            key={idx}
                            className="bg-tg-bg border border-tg-secondary-bg rounded-2xl overflow-hidden transition-all duration-200"
                        >
                            <button
                                onClick={() => toggleFaq(idx)}
                                className="w-full px-4 py-3.5 flex items-center justify-between text-left focus:outline-none"
                            >
                                <span className="text-xs font-bold text-tg-text pr-4">{faq.q}</span>
                                {openIndex === idx ? (
                                    <ChevronUp className="w-4 h-4 text-tg-hint shrink-0" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-tg-hint shrink-0" />
                                )}
                            </button>

                            {openIndex === idx && (
                                <div className="px-4 pb-4 pt-1 text-xs text-tg-hint leading-relaxed border-t border-tg-secondary-bg/20 bg-tg-secondary-bg/10 font-medium">
                                    {faq.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Loyalty point panel */}
            <div className="bg-gradient-to-br from-tg-button/20 to-tg-secondary-bg/30 border border-tg-button/30 rounded-3xl p-5 mb-5 flex flex-col items-center text-center">
                <Compass className="w-10 h-10 text-tg-button mb-2 animate-pulse" />
                <h3 className="text-sm font-bold text-tg-text">Your Loyalty Balance</h3>
                <p className="text-2xl font-black text-tg-button mt-1.5">{loyaltyCoins} Coins</p>
                <p className="text-[10px] text-tg-hint mt-1 leading-normal max-w-xs font-medium">
                    You can redeem these coins at checkout for direct discounts. Earn more by placing orders!
                </p>
            </div>

            {/* Direct support action */}
            <button
                onClick={() => openTelegramLink('https://t.me/amazone_support_bot')}
                className="w-full py-3 bg-tg-button text-tg-button-text font-black rounded-2xl shadow-md active-press flex items-center justify-center gap-2"
            >
                <MessageCircle className="w-5 h-5 animate-bounce" />
                <span>Contact Official Support Bot</span>
            </button>
        </div>
    );
}
