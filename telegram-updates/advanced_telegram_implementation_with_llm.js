/**
 * Telegram Advanced Bot API Implementation
 * Covers: Bot-to-Bot Communication, Guest Mode, and Secretary (Business) Mode
 * 
 * UPDATE: Now integrated with an LLM for true Secretary "Understanding"
 * 
 * Requires: Node.js 18+ (uses native global fetch)
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // You need an LLM API Key now!
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

if (!BOT_TOKEN || !OPENAI_API_KEY) {
    console.error("Error: Please provide TELEGRAM_BOT_TOKEN and OPENAI_API_KEY.");
    process.exit(1);
}

// ==========================================
// LLM INTEGRATION (The "Brain")
// ==========================================

/**
 * Sends text to an LLM to understand human language and mimic a specific style.
 * @param {string} incomingMessage - The text from the user.
 * @param {string} senderName - The name of the person messaging.
 */
async function generateSecretaryResponse(incomingMessage, senderName) {
    const systemPrompt = `You are an AI assistant managing Telegram DMs for your boss, Alex. 
    Alex's style is very casual, friendly, uses lowercase mostly, and uses emojis sparingly. 
    Your goal is to be helpful but let the person know Alex will review the chat later. 
    Keep responses under 2 sentences. Do not sound like a generic corporate robot.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o", // or any modern model
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `${senderName} says: ${incomingMessage}` }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("LLM Error:", error);
        return "Hey, having some connection issues right now. I'll get back to you soon!";
    }
}

// ==========================================
// CORE API UTILITIES & LOOP PREVENTION
// ==========================================

const botInteractionHistory = new Map();
const MAX_BOT_REPLIES_PER_MINUTE = 3;

function isSafeToReplyToBot(botId) {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    if (!botInteractionHistory.has(botId)) botInteractionHistory.set(botId, []);
    let timestamps = botInteractionHistory.get(botId).filter(ts => ts > oneMinuteAgo);
    
    if (timestamps.length >= MAX_BOT_REPLIES_PER_MINUTE) return false;

    timestamps.push(now);
    botInteractionHistory.set(botId, timestamps);
    return true;
}

async function callTelegramApi(method, payload = {}) {
    try {
        const response = await fetch(`${API_URL}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!data.ok) console.error(`API Error (${method}):`, data.description);
        return data;
    } catch (err) {
        console.error(`Network Error (${method}):`, err.message);
        return null;
    }
}

// ==========================================
// FEATURE HANDLERS
// ==========================================

async function handleBotToBotMessage(message) {
    if (!isSafeToReplyToBot(message.from.id)) return;
    await callTelegramApi('sendMessage', {
        chat_id: message.chat.id,
        text: `Beep boop! Hello @${message.from.username}, acknowledging bot communication.`,
        reply_to_message_id: message.message_id
    });
}

async function handleGuestMessage(guestMessage) {
    const prompt = guestMessage.message?.text || "No text provided";
    await callTelegramApi('answerGuestQuery', {
        guest_query_id: guestMessage.guest_query_id,
        message: { text: `Guest Mode active. Acknowledging prompt: "${prompt}"` }
    });
}

/**
 * Feature 3: Secretary Mode (Business Connections)
 * NOW POWERED BY AI!
 */
async function handleBusinessMessage(businessMessage) {
    const businessConnectionId = businessMessage.business_connection_id;
    const fromUser = businessMessage.from.first_name;
    const chatId = businessMessage.chat.id;
    const incomingText = businessMessage.text || "";

    console.log(`[Secretary Mode] Processing DM from ${fromUser} through LLM...`);

    if (businessMessage.from.is_self) return; // Don't talk to yourself

    // 1. Pass the user's text to our LLM function
    const aiResponse = await generateSecretaryResponse(incomingText, fromUser);

    // 2. Send the AI-generated text back to Telegram as the account owner
    await callTelegramApi('sendMessage', {
        chat_id: chatId,
        business_connection_id: businessConnectionId,
        text: aiResponse,
    });
}

// ==========================================
// MAIN POLLING LOOP
// ==========================================

let lastUpdateId = 0;

async function pollUpdates() {
    const data = await callTelegramApi('getUpdates', {
        offset: lastUpdateId + 1,
        timeout: 30,
        allowed_updates: ["message", "business_connection", "business_message", "guest_message"]
    });

    if (data && data.ok && data.result.length > 0) {
        for (const update of data.result) {
            lastUpdateId = update.update_id;
            try {
                if (update.guest_message) await handleGuestMessage(update.guest_message);
                else if (update.business_message) await handleBusinessMessage(update.business_message);
                else if (update.message) {
                    if (update.message.from.is_bot) await handleBotToBotMessage(update.message);
                }
            } catch (err) {
                console.error("[Error]", err);
            }
        }
    }
    setImmediate(pollUpdates);
}

console.log("Starting AI-Powered Telegram Advanced Poller...");
pollUpdates();