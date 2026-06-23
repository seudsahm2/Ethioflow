import React, { useState, useRef, useEffect } from 'react';
import { useTelegram } from '../../hooks/useTelegram';
import { useCart } from '../../context/CartContext';
import { mockProducts } from '../../mockData';
import { X, Send, Bot, User, Sparkles } from 'lucide-react';

export default function HelpBot({ onClose, initialAction, onClearInitialAction }) {
    const { triggerHapticImpact, triggerHapticNotification } = useTelegram();
    const { cartItems, addToCart, updateCartItemPrice } = useCart();
    const [messages, setMessages] = useState([
        { id: 1, sender: 'bot', text: 'Hello! I am your Amazone Shop Assistant. How can I help you today? Try asking about "shipping", "coins", "seller", or "coupons"!' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping]);

    // Handle initial trigger actions (e.g. triggered directly from Cart View deal button)
    useEffect(() => {
        if (initialAction === 'negotiate') {
            if (cartItems.length > 0) {
                // Add a small user-like automated message to the stream
                const userMsg = { id: Date.now(), sender: 'user', text: "🤖 Let's make a deal on the items in my cart!" };
                setMessages((prev) => [...prev, userMsg]);

                // Trigger negotiation automatically
                handleNegotiation(cartItems);
            } else {
                setMessages((prev) => [...prev, {
                    id: Date.now(),
                    sender: 'bot',
                    text: "🤖 You clicked 'Bargain via Bot', but your cart is empty! Let me help you find something first! Try searching for 'hoodie' or 'mouse'."
                }]);
            }
            if (onClearInitialAction) {
                onClearInitialAction();
            }
        }
    }, [initialAction]);

    const handleNegotiation = (itemsToNegotiate) => {
        setIsTyping(true);

        // 1. Initial contact message
        setTimeout(() => {
            setMessages((prev) => [...prev, {
                id: Date.now() + 10,
                sender: 'bot',
                text: `🤖 **Automated Bargaining Agent Initiated!** 🤝\n\nI am contacting the seller channel merchant bots for the ${itemsToNegotiate.length} item(s) currently in your cart. Please stand by while I negotiate custom deals directly with them...`
            }]);
            triggerHapticNotification('success');
        }, 800);

        let currentDelay = 3000;

        itemsToNegotiate.forEach((item, index) => {
            const originalPrice = item.price;
            // Bargain a custom 10% to 20% discount based on item ID
            const discountPercentage = 0.10 + (item.id % 5) * 0.035;
            const finalPrice = Number((originalPrice * (1 - discountPercentage)).toFixed(2));
            const merchant = item.sellerChannel || `@channel_merchant_${item.id % 10}`;

            // Step 1: Inform starting on this item
            setTimeout(() => {
                setMessages((prev) => [...prev, {
                    id: Date.now() + 20 + index * 10,
                    sender: 'bot',
                    text: `📞 *Contacting merchant ${merchant} regarding your "${item.title}"...*`
                }]);
                triggerHapticImpact('light');
            }, currentDelay);

            currentDelay += 2000;

            // Step 2: Merchant offer
            setTimeout(() => {
                setMessages((prev) => [...prev, {
                    id: Date.now() + 21 + index * 10,
                    sender: 'bot',
                    text: `💬 **Merchant Bot ${merchant}**: "Standard price for the ${item.title} is $${originalPrice.toFixed(2)}, but since you represent an active buyer, I can discount it slightly to $${(originalPrice * 0.95).toFixed(2)}."`
                }]);
                triggerHapticImpact('light');
            }, currentDelay);

            currentDelay += 2200;

            // Step 3: HelpBot counter bargain
            setTimeout(() => {
                setMessages((prev) => [...prev, {
                    id: Date.now() + 22 + index * 10,
                    sender: 'bot',
                    text: `🤖 **HelpBot Agent**: "That is a start, but our buyer is looking at other stores and wants to confirm their order right now! Can you do a final clearance price of **$${finalPrice.toFixed(2)}**? It is a guaranteed sale."`
                }]);
                triggerHapticImpact('medium');
            }, currentDelay);

            currentDelay += 2400;

            // Step 4: Agreement
            setTimeout(() => {
                setMessages((prev) => [...prev, {
                    id: Date.now() + 23 + index * 10,
                    sender: 'bot',
                    text: `🤝 **Merchant Bot ${merchant}**: "Alright, you drive a hard bargain! I will lock in the deal at **$${finalPrice.toFixed(2)}** for this buyer's active session. Price updated."`
                }]);
                updateCartItemPrice(item.id, finalPrice);
                triggerHapticImpact('heavy');
            }, currentDelay);

            currentDelay += 2000;
        });

        // Consolidated Final Summary
        setTimeout(() => {
            setIsTyping(false);
            const totalSaved = itemsToNegotiate.reduce((sum, item) => {
                const discountPercentage = 0.10 + (item.id % 5) * 0.035;
                return sum + (item.price * discountPercentage) * item.quantity;
            }, 0);

            setMessages((prev) => [...prev, {
                id: Date.now() + 99,
                sender: 'bot',
                text: `🎉 **FINISHED NEGOTIATING!** 🎉\n\nI have successfully beat down prices across all items inside your cart!\n\n💰 **Money Saved for You**: $${totalSaved.toFixed(2)}\n\n🛒 **What to do next**:\nOpen your shopping cart tab now! You will see the newly discounted prices highlighted in green. Click checkout and secure your package before this deal session expires!`
            }]);
            triggerHapticNotification('success');
        }, currentDelay);
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        triggerHapticImpact('light');
        const userQuery = input.trim();
        const userMsg = { id: Date.now(), sender: 'user', text: userQuery };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');

        // Trigger bot response
        setIsTyping(true);
        setTimeout(() => {
            let botReply = "I'm sorry, I didn't quite catch that. You can ask me about shipping, loyalty coins, selling items, or coupons, or contact our human support under settings!";

            const lowerQuery = userQuery.toLowerCase();

            // 1. Negotiation Flow Check
            if (lowerQuery.includes('negotiate') || lowerQuery.includes('bargain') || lowerQuery.includes('discount') || lowerQuery.includes('price')) {
                if (cartItems.length === 0) {
                    setMessages((prev) => [...prev, {
                        id: Date.now() + 1,
                        sender: 'bot',
                        text: "🤖 Your shopping cart is empty! Tell me what you'd like to find (e.g. 'find earbuds') or add products to your cart first, and I will go directly to the channel merchants and negotiate a discount for you!"
                    }]);
                    setIsTyping(false);
                    triggerHapticImpact('medium');
                    return;
                }

                // Trigger Simulated Live Negotiation Sequence
                setIsTyping(false); // Managed by sequence
                handleNegotiation(cartItems);
                return;
            }

            // 2. Automated Product Searching / Auto-Shopping Flow Check
            const searchKeywords = ['find', 'buy', 'get', 'order', 'add', 'search', 'want', 'need'];
            const matchesSearchCommand = searchKeywords.some(keyword => lowerQuery.startsWith(keyword) || lowerQuery.includes(' ' + keyword + ' '));

            if (matchesSearchCommand) {
                let cleanQuery = lowerQuery;
                searchKeywords.forEach(keyword => {
                    cleanQuery = cleanQuery.replace(keyword, '');
                });
                cleanQuery = cleanQuery.replace('me', '').replace('a ', '').replace('the ', '').replace('some ', '').trim();

                const matchedProduct = mockProducts.find(product =>
                    product.title.toLowerCase().includes(cleanQuery) ||
                    product.category.toLowerCase().includes(cleanQuery) ||
                    cleanQuery.includes(product.title.toLowerCase())
                );

                if (matchedProduct) {
                    addToCart(matchedProduct);
                    triggerHapticNotification('success');
                    botReply = `🛒 🤖 **Auto-Shopping Agent Engaged!**\n\nI scanned the merchant channels and found exactly what you were looking for:\n\n✨ **${matchedProduct.title}** ($${matchedProduct.price.toFixed(2)})\n\nI have successfully fetched this item and placed it inside your shopping cart! 🛍\n\n👉 **What to do now:**\nOpen your shopping cart and review the items. Cancel anything you don't want, and once you confirm you like everything, type **'negotiate'** here. I will then go directly to the merchants and bargain for a discount!`;

                    setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'bot', text: botReply }]);
                    setIsTyping(false);
                    return;
                } else {
                    botReply = `🤖 I searched all seller channels for "${cleanQuery}" but couldn't find a matching product.\n\n💡 Try asking me to find something from our active collection, such as:\n• 'find hoodie'\n• 'buy wireless mouse'\n• 'get smart flask'\n• 'order mechanical keyboard'\n• 'add earbuds'\n• 'buy leather wallet'`;

                    setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'bot', text: botReply }]);
                    setIsTyping(false);
                    triggerHapticImpact('medium');
                    return;
                }
            }

            // 3. Fallback standard queries
            if (lowerQuery.includes('shipping') || lowerQuery.includes('delivery')) {
                botReply = "Standard delivery on Amazone is completely FREE! Items from channels are shipped within 2-3 business days, and you can track them on your 'Orders' tab.";
            } else if (lowerQuery.includes('coin') || lowerQuery.includes('points') || lowerQuery.includes('loyalty')) {
                botReply = "Amazone Coins are your cashback rewards! You get 10% cash-back on every purchase. You can also tap the Golden Coin in our Clicker game to earn free points!";
            } else if (lowerQuery.includes('seller') || lowerQuery.includes('add product') || lowerQuery.includes('merchant')) {
                botReply = "Are you a channel creator? Head to the 'Seller Portal' tab to publish products directly from your channel to our marketplace. It will go live immediately!";
            } else if (lowerQuery.includes('coupon') || lowerQuery.includes('promo') || lowerQuery.includes('code')) {
                botReply = "You can win active promo codes like 'AMAZONE10' (10% off) or 'SUPER20' (20% off) by spinning the daily rewards wheel on our home page!";
            } else if (lowerQuery.includes('stars') || lowerQuery.includes('payment') || lowerQuery.includes('crypto')) {
                botReply = "We support standard secure Credit Card billing as well as Telegram Stars and TON cryptocurrency transactions. Select your preferred checkout option in your cart!";
            }

            setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'bot', text: botReply }]);
            setIsTyping(false);
            triggerHapticImpact('medium');
        }, 1200);
    };

    return (
        <div className="fixed inset-y-0 right-0 z-[120] w-full max-w-sm bg-tg-bg border-l border-tg-secondary-bg shadow-2xl flex flex-col animate-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-tg-secondary-bg bg-tg-secondary-bg/25">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-tg-button text-tg-button-text flex items-center justify-center shadow-md">
                        <Bot className="w-4.5 h-4.5" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-tg-text flex items-center gap-1">
                            <span>Amazone Chatbot</span>
                            <Sparkles className="w-3 h-3 text-amber-500 fill-current" />
                        </h3>
                        <p className="text-[9px] text-tg-hint font-bold uppercase tracking-wider">Online Support</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-full bg-tg-secondary-bg text-tg-hint active-press hover:text-tg-text"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-2.5 max-w-[85%] text-left ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                        {/* Avatar */}
                        <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white ${msg.sender === 'user' ? 'bg-tg-button' : 'bg-slate-700'}`}>
                            {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                        </div>

                        {/* Bubble */}
                        <div className={`rounded-2xl px-3.5 py-2.5 text-xs font-medium leading-relaxed shadow-sm ${msg.sender === 'user' ? 'bg-tg-button text-tg-button-text rounded-tr-none' : 'bg-tg-secondary-bg/50 text-tg-text rounded-tl-none'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex gap-2.5 mr-auto max-w-[85%] text-left">
                        <div className="w-7 h-7 rounded-full bg-slate-700 shrink-0 flex items-center justify-center text-white">
                            <Bot className="w-3.5 h-3.5" />
                        </div>
                        <div className="bg-tg-secondary-bg/50 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1 items-center shadow-sm">
                            <div className="w-1.5 h-1.5 bg-tg-hint rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-tg-hint rounded-full animate-bounce delay-150"></div>
                            <div className="w-1.5 h-1.5 bg-tg-hint rounded-full animate-bounce delay-300"></div>
                        </div>
                    </div>
                )}

                <div ref={scrollRef}></div>
            </div>

            {/* Input Form Footer */}
            <form onSubmit={handleSend} className="p-3 border-t border-tg-secondary-bg bg-tg-bg flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-tg-secondary-bg text-tg-text placeholder-tg-hint border-none focus:outline-none focus:ring-1 focus:ring-tg-button"
                />
                <button
                    type="submit"
                    className="p-2.5 bg-tg-button text-tg-button-text rounded-xl shadow-md active-press shrink-0"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}
