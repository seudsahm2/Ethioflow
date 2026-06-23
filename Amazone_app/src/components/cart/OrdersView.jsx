import React from 'react';
import { useCart } from '../../context/CartContext';
import { Package, Truck, Clock, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';

export default function OrdersView({ setActiveTab }) {
    const { orderHistory } = useCart();

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Pending':
                return <Clock className="w-5 h-5 text-amber-500 animate-pulse" />;
            case 'Processing':
                return <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />;
            case 'Shipped':
                return <Truck className="w-5 h-5 text-blue-500" />;
            default:
                return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
        }
    };

    const getStatusTextClass = (status) => {
        switch (status) {
            case 'Pending':
                return 'text-amber-500 bg-amber-500/10';
            case 'Processing':
                return 'text-indigo-500 bg-indigo-500/10';
            case 'Shipped':
                return 'text-blue-500 bg-blue-500/10';
            default:
                return 'text-emerald-500 bg-emerald-500/10';
        }
    };

    if (!orderHistory || orderHistory.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 px-4 py-16 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-tg-secondary-bg text-tg-hint mb-4">
                    <Package className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-bold text-tg-text mb-1">No Orders Yet</h2>
                <p className="text-sm text-tg-hint max-w-[240px] leading-relaxed mb-6">
                    Place an order from your shopping cart to track your packages here.
                </p>
                <button
                    onClick={() => setActiveTab('shop')}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-tg-button-text bg-tg-button shadow-sm active-press"
                >
                    Browse Products
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 px-4 py-3 pb-32">
            <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-tg-button" />
                <h2 className="text-base font-bold text-tg-text">Your Order History</h2>
            </div>

            <div className="space-y-4">
                {orderHistory.map((order) => (
                    <div
                        key={order.id}
                        className="bg-tg-bg border border-tg-secondary-bg rounded-2xl p-4 shadow-sm text-left flex flex-col"
                    >
                        {/* Order Header */}
                        <div className="flex items-center justify-between border-b border-tg-secondary-bg pb-3 mb-3">
                            <div>
                                <p className="text-xs font-black text-tg-text uppercase tracking-wider">{order.id}</p>
                                <p className="text-[10px] text-tg-hint font-medium mt-0.5">
                                    {new Date(order.createdAt).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${getStatusTextClass(order.status)}`}>
                                    {order.status}
                                </span>
                                {getStatusIcon(order.status)}
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-2 mb-3">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs font-medium">
                                    <p className="text-tg-text truncate max-w-[200px]">
                                        <span className="font-extrabold text-tg-button mr-1.5">{item.quantity}x</span>
                                        {item.title}
                                    </p>
                                    <p className="text-tg-hint">${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>

                        {/* Order Footer Totals */}
                        <div className="flex items-center justify-between pt-3 border-t border-tg-secondary-bg mt-1">
                            <div>
                                <p className="text-[10px] text-tg-hint font-bold uppercase tracking-wider">Total Paid</p>
                                <p className="text-sm font-black text-tg-button mt-0.5">${order.totalPrice.toFixed(2)}</p>
                            </div>
                            <button
                                onClick={() => {
                                    alert(`Order Help Support initiated for Order Ref: ${order.id}. Contacting channel admin...`);
                                }}
                                className="flex items-center gap-1 text-[11px] font-black text-tg-text bg-tg-secondary-bg hover:bg-tg-secondary-bg/80 px-3 py-1.5 rounded-lg active-press"
                            >
                                <span>Get Help</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
