import React, { useState } from 'react';
import { useTelegram } from '../../hooks/useTelegram';
import { PlusCircle, Info, Image, Plus, Check, AlertTriangle } from 'lucide-react';
import { mockProducts } from '../../mockData';

export default function SellerPortal({ onProductAdded }) {
    const { triggerHapticNotification, user } = useTelegram();
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('Electronics');
    const [color, setColor] = useState('bg-slate-700');
    const [description, setDescription] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [safetyErrorMsg, setSafetyErrorMsg] = useState('');

    const categories = ['Clothing', 'Electronics', 'Home & Kitchen', 'Accessories', 'Beauty', 'Fitness'];

    const BANNED_KEYWORDS = [
        // Adult Content / NSFW terms
        "porn", "nsfw", "adult", "sex", "erotic", "xxx", "naked", "nudity", "strip", "escort", "sensual", "massage", "onlyfans",
        // Restricted / Illegal terms
        "drug", "cocaine", "marijuana", "weed", "weapon", "gun", "pistol", "ammo", "rifle", "crack", "cannabis", "explosive",
        // Cybersecurity / Frauds
        "hack", "phishing", "scam", "phish", "counterfeit", "fake id", "gamble", "betting", "casino"
    ];

    const colors = [
        { name: 'Slate Gray', value: 'bg-slate-700' },
        { name: 'Royal Blue', value: 'bg-blue-800' },
        { name: 'Emerald Green', value: 'bg-emerald-800' },
        { name: 'Crimson Red', value: 'bg-red-800' },
        { name: 'Indigo Purple', value: 'bg-indigo-900' },
        { name: 'Amber Gold', value: 'bg-amber-800' },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title || !price || !description) return;

        // Strict Safety Moderation Filter for Banned/Adult content
        const combinedContent = `${title} ${description} ${category}`.toLowerCase();
        const detectedBannedWord = BANNED_KEYWORDS.find((word) => combinedContent.includes(word));

        if (detectedBannedWord) {
            triggerHapticNotification('error');
            setSafetyErrorMsg(`🚫 safety block: Your submission contains restricted content ("${detectedBannedWord}"). To keep the Amazone marketplace safe and compliant with Telegram policies, listings featuring adult keywords or banned substances are blocked.`);
            setSuccessMsg('');
            // Clear message after 10 seconds
            setTimeout(() => setSafetyErrorMsg(''), 10000);
            return;
        }

        const newId = Math.floor(1000 + Math.random() * 9000);
        const newProduct = {
            id: newId,
            title,
            price: Number(price),
            category,
            description,
            color,
            sellerChannel: `@${user?.username || 'amazone_merchant'}`,
            rating: 5,
            reviewsCount: 1,
            images: [color]
        };

        // Add to our static / mockData set so the app can list it immediately
        mockProducts.unshift(newProduct);

        setSuccessMsg(`"${title}" listed successfully on the marketplace!`);
        triggerHapticNotification('success');

        // Reset
        setTitle('');
        setPrice('');
        setDescription('');
        setSafetyErrorMsg('');

        if (onProductAdded) {
            onProductAdded();
        }

        setTimeout(() => setSuccessMsg(''), 4000);
    };

    return (
        <div className="flex flex-col flex-1 px-4 py-3 pb-32">
            <div className="flex items-center gap-2 mb-4">
                <PlusCircle className="w-5 h-5 text-tg-button" />
                <h2 className="text-base font-bold text-tg-text">Seller Dashboard</h2>
            </div>

            {/* Merchant info callout */}
            <div className="bg-tg-secondary-bg/30 border border-tg-secondary-bg rounded-2xl p-4 mb-5 flex gap-3 text-left">
                <Info className="w-5 h-5 text-tg-button shrink-0 mt-0.5" />
                <div className="text-xs">
                    <p className="font-bold text-tg-text">Add items on behalf of your channel</p>
                    <p className="text-tg-hint leading-relaxed mt-1">
                        Listing products here mimics pushing goods to your channel bot. Active listing channel: <span className="font-semibold text-tg-button">@{user?.username || 'amazone_channel'}</span>
                    </p>
                </div>
            </div>

            {/* Success Prompt */}
            {successMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl p-4 mb-5 text-xs font-bold flex items-center gap-2 animate-bounce">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{successMsg}</span>
                </div>
            )}

            {/* Safety Moderation Warning Banner */}
            {safetyErrorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl p-4 mb-5 text-xs font-bold flex items-start gap-2.5 text-left leading-relaxed">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                    <span>{safetyErrorMsg}</span>
                </div>
            )}

            {/* Add product form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
                {/* Title */}
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-tg-hint uppercase tracking-wider">Product Name</label>
                    <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Vintage Leather Jacket"
                        className="w-full px-4 py-2.5 rounded-xl text-xs bg-tg-secondary-bg text-tg-text placeholder-tg-hint border-none focus:outline-none focus:ring-2 focus:ring-tg-button"
                    />
                </div>

                {/* Price */}
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-tg-hint uppercase tracking-wider">Price (USD)</label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="e.g. 79.99"
                        className="w-full px-4 py-2.5 rounded-xl text-xs bg-tg-secondary-bg text-tg-text placeholder-tg-hint border-none focus:outline-none focus:ring-2 focus:ring-tg-button"
                    />
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-tg-hint uppercase tracking-wider">Category</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl text-xs bg-tg-secondary-bg text-tg-text border-none focus:outline-none focus:ring-2 focus:ring-tg-button"
                    >
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Cover Theme Color Picker */}
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-tg-hint uppercase tracking-wider">Cover Theme</label>
                    <div className="flex gap-2.5 overflow-x-auto py-1 scrollbar-hide">
                        {colors.map((col) => (
                            <button
                                key={col.value}
                                type="button"
                                onClick={() => setColor(col.value)}
                                className={`w-8 h-8 rounded-full ${col.value} border-2 relative shrink-0 transition-all ${color === col.value ? 'border-tg-button scale-110 shadow-md' : 'border-transparent opacity-70'}`}
                                aria-label={col.name}
                            >
                                {color === col.value && <Plus className="w-4 h-4 text-white absolute inset-0 m-auto" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-tg-hint uppercase tracking-wider">Description</label>
                    <textarea
                        required
                        rows="4"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What makes this item awesome? Describe specs, condition, and shipping options..."
                        className="w-full px-4 py-2.5 rounded-xl text-xs bg-tg-secondary-bg text-tg-text placeholder-tg-hint border-none focus:outline-none focus:ring-2 focus:ring-tg-button leading-relaxed resize-none"
                    ></textarea>
                </div>

                {/* Submit button */}
                <button
                    type="submit"
                    className="w-full py-3.5 mt-2 bg-tg-button text-tg-button-text font-black rounded-2xl shadow-md active-press flex items-center justify-center gap-2"
                >
                    <PlusCircle className="w-5 h-5" />
                    <span>Publish Item to Marketplace</span>
                </button>
            </form>
        </div>
    );
}
