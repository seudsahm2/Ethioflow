import { useEffect, useState } from 'react';

const tg = window.Telegram?.WebApp;

export function useTelegram() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (tg) {
            tg.ready();
            tg.expand();
            if (tg.initDataUnsafe?.user) {
                setUser(tg.initDataUnsafe.user);
            }
        }
    }, []);

    const onClose = () => {
        tg?.close();
    };

    const onToggleButton = (show, text = 'Checkout') => {
        if (!tg) return;
        if (show) {
            tg.MainButton.text = text;
            tg.MainButton.show();
        } else {
            tg.MainButton.hide();
        }
    };

    const showBackButton = (callback) => {
        if (!tg) return;
        tg.BackButton.show();
        if (callback) {
            tg.BackButton.onClick(callback);
        }
    };

    const hideBackButton = (callback) => {
        if (!tg) return;
        tg.BackButton.hide();
        if (callback) {
            tg.BackButton.offClick(callback);
        }
    };

    // Telegram Haptic Feedback wrappers
    const triggerHapticImpact = (style = 'medium') => {
        if (tg?.HapticFeedback) {
            try {
                tg.HapticFeedback.impactOccurred(style);
            } catch (err) {
                console.warn('Telegram Haptic Feedback failed:', err);
            }
        }
    };

    const triggerHapticNotification = (type = 'success') => {
        if (tg?.HapticFeedback) {
            try {
                tg.HapticFeedback.notificationOccurred(type);
            } catch (err) {
                console.warn('Telegram Haptic Feedback failed:', err);
            }
        }
    };

    // Open dynamic Telegram external links safely
    const openTelegramLink = (url) => {
        if (tg) {
            try {
                tg.openTelegramLink(url);
            } catch (err) {
                window.open(url, '_blank');
            }
        } else {
            window.open(url, '_blank');
        }
    };

    return {
        tg,
        user: user || { first_name: 'Guest', username: 'guest_user', id: 12345 },
        initData: tg?.initData || '',
        onClose,
        onToggleButton,
        showBackButton,
        hideBackButton,
        triggerHapticImpact,
        triggerHapticNotification,
        openTelegramLink,
        isTelegram: !!window.Telegram?.WebApp,
    };
}
