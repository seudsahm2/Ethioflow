// ============================================================================
// CONFIGURATION: Real backend server URL
// ============================================================================
export const API_BASE_URL = 'http://localhost:3000/api';

// Helper to simulate network latency for a realistic database/backend feel.
const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch all products, optionally filtered by category and/or search query.
 */
export async function fetchProducts(category = 'All', searchQuery = '', initData = '') {
    try {
        const response = await fetch(`${API_BASE_URL}/products`, {
            headers: {
                'Authorization': `Bearer ${initData}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to fetch products from backend database');
        
        const json = await response.json();
        let products = json.data.map(p => ({
            ...p,
            sellerChannel: p.seller?.channelName || 'Unknown Seller'
        }));

        // Client-side filtering (ideally moved to backend later)
        if (category !== 'All') {
            products = products.filter(p => p.category === category);
        }
        if (searchQuery) {
            const sq = searchQuery.toLowerCase();
            products = products.filter(p => 
                p.title.toLowerCase().includes(sq) || 
                (p.description && p.description.toLowerCase().includes(sq))
            );
        }
        return products;
    } catch (error) {
        console.error('API Error (fetchProducts):', error);
        throw error;
    }
}

/**
 * Resolve a Telegram File ID to a real temporary URL securely via backend.
 */
export async function resolveTelegramImage(fileId) {
    if (!fileId) return null;
    try {
        const res = await fetch(`${API_BASE_URL}/resolve-image?file_id=${fileId}`);
        const data = await res.json();
        if (data.success) {
            return data.url;
        }
        return null;
    } catch (err) {
        console.error('Failed to resolve image:', err);
        return null;
    }
}

/**
 * Fetch all product categories dynamically from real product data.
 */
export async function fetchCategories(initData = '') {
    try {
        const products = await fetchProducts('All', '', initData);
        const uniqueCategories = [...new Set(products.map((p) => p.category).filter(Boolean))];
        return ['All', ...uniqueCategories];
    } catch (error) {
        console.error('API Error (fetchCategories):', error);
        return ['All']; // graceful fallback
    }
}

/**
 * Fetch a single product's detailed info by its ID.
 */
export async function fetchProductById(id, initData = '') {
    if (API_BASE_URL) {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${id}`, {
                headers: {
                    'Authorization': `Bearer ${initData}`
                }
            });
            if (!response.ok) throw new Error('Product not found');
            return await response.json();
        } catch (error) {
            console.error('API Error (fetchProductById):', error);
            throw error;
        }
    }

    // Fallback
    await delay(150);
    const found = mockProducts.find((p) => p.id === Number(id));
    if (!found) throw new Error('Product not found in mock store');
    return found;
}

/**
 * Fetch recommendations / similar items from the database.
 * Matches by same category, excludes the current product, and sorts/filters
 * to show close price ranges or same channel items if available.
 */
export async function fetchRecommendations(product, initData = '') {
    if (API_BASE_URL) {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${product.id}/recommendations`, {
                headers: {
                    'Authorization': `Bearer ${initData}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch recommendations');
            return await response.json();
        } catch (error) {
            console.error('API Error (fetchRecommendations):', error);
            throw error;
        }
    }

    // Fallback: Advanced similarity engine algorithm (client-side)
    await delay(300);
    return mockProducts
        .filter((p) => p.id !== product.id) // Exclude current product
        .map((p) => {
            // Compute similarity score based on category and price proximity
            let score = 0;
            if (p.category === product.category) score += 10;

            // Score based on price proximity (closer price = more similar/suitable recommendation)
            const priceDifference = Math.abs(p.price - product.price);
            const priceSimilarity = Math.max(0, 10 - (priceDifference / 5)); // up to 10 points
            score += priceSimilarity;

            return { product: p, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score) // Order by best score first
        .map((item) => item.product)
        .slice(0, 5); // Limit to top 5 recommendations
}

/**
 * Create a new order (checkout transaction) on the backend.
 * Sends the basket contents, user Telegram ID, and telegram auth token (initData).
 * Your bot backend will use this to notify the channel admin of a new order!
 */
export async function createOrder(orderData, initData = '') {
    if (API_BASE_URL) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${initData}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            if (!response.ok) throw new Error('Failed to create order on backend database');
            return await response.json();
        } catch (error) {
            console.error('API Error (createOrder):', error);
            throw error;
        }
    }

    // Fallback simulation
    await delay(800);
    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    return {
        success: true,
        orderId,
        message: 'Order created successfully. The merchant bot has been notified!',
        order: {
            id: orderId,
            items: orderData.items,
            totalPrice: orderData.totalPrice,
            buyerId: orderData.buyer?.id || 'guest_user',
            createdAt: new Date().toISOString()
        }
    };
}
