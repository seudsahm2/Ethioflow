# Telegram Bot API Updates: Implementation Guide

This guide breaks down the actual implementation details and code for three major recent Telegram updates: **Guest Mode**, **Bot-to-Bot Communication**, and **Telegram Business Profile Integration**.

---

## 1. Guest Mode Bots

**Guest Mode** (introduced in Bot API 10.x) allows users to `@mention` your bot in *any* chat (group, channel, or DM) even if the bot is not a member of that chat. The bot receives a one-time message and can respond in-place.

### How to Enable
1. Open **@BotFather**.
2. Go to your bot settings and enable **Guest Mode**.

### How it Works (Under the Hood)
When a user types `@your_bot hello`, the bot receives a specific update type called `guest_message`. Instead of a normal `chat_id`, this message provides a `guest_query_id`. The bot must respond using the `answerGuestQuery` method.

> [!IMPORTANT]
> A guest bot is stateless per interaction. You do not get access to the chat history or chat members, only the exact message where the bot was mentioned.

### Code Example (Node.js with grammY)

```typescript
import { Bot } from "grammy";

const bot = new Bot("YOUR_BOT_TOKEN");

// Listen for guest messages
bot.on("guest_message", async (ctx) => {
    const guestQueryId = ctx.update.guest_message.guest_query_id;
    const text = ctx.update.guest_message.text;
    const caller = ctx.update.guest_message.guest_bot_caller_user.first_name;

    console.log(`Received guest message from ${caller}: ${text}`);

    // You MUST use answerGuestQuery to reply
    await ctx.api.answerGuestQuery(guestQueryId, {
        text: `Hello ${caller}! I am responding as a guest in this chat.`
    });
});

bot.start();
```

---

## 2. Bot-to-Bot Communication

Previously, bots were blind to each other to prevent infinite loops. With the new native Bot-to-Bot communication, AI agents and manager bots can autonomously DM each other and coordinate tasks.

### How to Enable
1. Open **@BotFather**.
2. Select your bot, go to **Bot Settings**.
3. Enable **Bot-to-Bot Communication Mode**.
*(Note: Both the sending and receiving bots must have this enabled).*

### How it Works
Once enabled, bots can send private messages to other bots using their `@username` or chat ID, exactly as they would with a normal user. 

### Code Example (Python with aiogram)

```python
from aiogram import Bot, Dispatcher, types
import asyncio

# The "Manager" Bot
manager_bot = Bot(token="MANAGER_TOKEN")
dp = Dispatcher()

async def delegate_task():
    # Sending a message to another bot using its username
    await manager_bot.send_message(
        chat_id="@MyWorkerBot", 
        text="/process_data https://example.com/data.csv"
    )

# The "Worker" Bot receives it exactly like a normal user message
@dp.message()
async def handle_bot_message(message: types.Message):
    # You can check if the sender is a bot
    if message.from_user.is_bot:
        print(f"Received task from another bot: {message.from_user.username}")
        # Process the task...
        await message.reply("Task received and processing!")

```

---

## 3. Automatic Profile Integration (Telegram Business)

This is what people refer to as "automating my profile with a bot". Telegram Business allows users to connect a chatbot directly to their personal Telegram account. The bot acts as an agent, reading incoming messages to the user and replying *on the user's behalf*.

### How to Enable
1. The developer turns on **Business Mode** for the bot via **@BotFather**.
2. The user (who must have Telegram Premium/Business) goes to **Settings > Telegram Business > Chatbots** in their Telegram app.
3. The user adds your bot.

### How it Works (Under the Hood)
Your bot will receive entirely new update types:
- `business_connection`: Fires when a user connects or disconnects your bot to their profile. **You must save the `business_connection_id`**.
- `business_message`: Fires when the user's account receives a DM.

To reply as the user, you use standard methods (like `sendMessage`), but you inject the `business_connection_id` parameter.

> [!WARNING]
> You must strictly store and use the `business_connection_id`. Without it, your bot will try to send a normal bot message instead of acting on behalf of the user's profile.

### Code Example (Node.js with grammY)

```typescript
import { Bot } from "grammy";

const bot = new Bot("YOUR_BOT_TOKEN");

// 1. Listen for the user connecting your bot to their profile
bot.on("business_connection", (ctx) => {
    const connection = ctx.update.business_connection;
    
    if (connection.is_enabled) {
        console.log(`User ${connection.user.id} connected the bot!`);
        // Save connection.id to your database here
        // db.saveConnection(connection.user.id, connection.id);
    } else {
        console.log(`User disconnected the bot.`);
    }
});

// 2. Listen for messages sent TO the user's profile
bot.on("business_message", async (ctx) => {
    const bizMessage = ctx.update.business_message;
    const connectionId = ctx.update.business_connection_id;
    
    // Ignore outgoing messages (messages the user sent themselves)
    if (bizMessage.from.id === ctx.me.id || !connectionId) return;

    console.log(`User received a message: ${bizMessage.text}`);

    // 3. Reply ON BEHALF of the user
    // The key here is passing the business_connection_id parameter
    await ctx.api.sendMessage(
        bizMessage.chat.id,
        "Hello, this is an automated response. I am currently away.",
        { business_connection_id: connectionId }
    );
});

bot.start();
```

### Framework Recommendation
If you are building Business Bots or using Guest mode in Node.js/TypeScript, **grammY** is currently the recommended framework over Telegraf, as grammY has native, first-class support for `business_message` and `guest_message` typings.
