# 🚀 EthioFlow Team Development Plan

This document outlines the independent responsibilities of our 3 team members. Because each of you will be using AI tools (like Cline, Cursor, or ChatGPT), this guide contains the exact boundaries and **AI Prompts** you can use to start your work.

## 📊 Task Difficulty Ranking
Not sure who should take which role? Here is the ranking from **Easiest** to **Hardest**:

1. **🟢 Easiest: Team Member 3 (Buyer Experience)**
   *Why:* Mostly straightforward Telegram bot setup, basic commands (`/start`), and inline queries. Uses mock data initially. Perfect for getting quick, visible results.
2. **🟡 Medium: Team Member 2 (Seller Experience)**
   *Why:* Involves handling Telegram background events (`channel_post`, `my_chat_member`). Requires a good understanding of how Telegram channels and bots interact.
3. **🔴 Hardest: Team Member 1 (Core Data & AI)**
   *Why:* Requires setting up the PostgreSQL database, writing Prisma queries, and connecting to an external AI API (Gemini/OpenAI) to parse unstructured text. 

---

## 🛑 Core Rule for Parallel Development
Do **not** modify `prisma/schema.prisma` or `src/types/index.ts` without notifying the team. These files are the **Contracts** that allow you to work without blocking each other. Until the backend is fully connected, use the types exported in `src/types/index.ts` to mock your data.

---

## 👩‍💻 Team Member 1: Core Data & AI Engineer
**Domain:** Database, Data Services, and AI Parsing.
**Working Directory:** `src/core/` and `prisma/`

### Responsibilities:
1. Initialize the Prisma Client in `src/core/db/index.ts`.
2. Implement the database CRUD operations in `src/core/services/` (e.g., `productService.ts`, `sellerService.ts`).
3. Implement the LLM connection in `src/core/ai/index.ts` using Google Gemini or OpenAI to parse unstructured Amharic/English text into the structured `Product` schema.

### 🤖 AI Prompt to Start Your Work:
> "I am working on the Core Services for a Telegram Bot marketplace. My job is to implement `src/core/services/productService.ts` and `src/core/services/sellerService.ts` using Prisma. The schema is already defined in `prisma/schema.prisma`. Please generate the basic CRUD functions for Sellers (registration, fetching by telegramId) and Products (creation from AI parsed data, text-based search). Then, help me implement `src/core/ai/index.ts` using the Google Gemini API to accept a raw string (a telegram channel post) and return a JSON object matching the `ParsedProductData` type in `src/types/index.ts`."

---

## 👨‍💻 Team Member 2: Seller Experience Engineer
**Domain:** Seller Onboarding, Background Webhooks, and Automated Jobs.
**Working Directory:** `src/bot/handlers/`, `src/bot/flows/sellerFlow/`, and `src/jobs/`

### Responsibilities:
1. **Onboarding:** Handle the `my_chat_member` event in Telegraf to detect when the bot is added to a channel as an admin, then register the seller via the `sellerService`.
2. **Auto-Sync:** Handle `channel_post` events. When a seller posts in their channel, grab the text and pass it to the AI parsing function, then save the product.
3. **Past Sync:** Handle forwarded messages in DMs (`src/bot/handlers/forwards.ts`) to backfill old inventory.

### 🤖 AI Prompt to Start Your Work:
> "I am building the Seller Flow for a Telegraf-based Telegram Bot. My focus is on background event handlers. I need to write a handler in `src/bot/handlers/channelPost.ts` that listens to `bot.on('channel_post')`. When triggered, it should extract the message text and photos. Since the Core Services aren't finished yet, assume there is a mock function `parseProductFromText(text: string)` that returns a `ParsedProductData` object, and `saveProduct(product)` that saves it. Also, write the `my_chat_member` event handler to register the channel owner when the bot is made an admin. Please provide the Telegraf logic for these handlers, ensuring they just export functions that take a Telegraf bot instance."

---

## 🧑‍💻 Team Member 3: Buyer Experience & Bot Architect
**Domain:** Bot Initialization, Search, and Buyer Interactions.
**Working Directory:** `src/index.ts`, `src/bot/commands/`, `src/bot/middlewares/`, and `src/bot/flows/buyerFlow/`

### Responsibilities:
1. **Bot Core:** Initialize the Telegraf bot in `src/index.ts` and apply necessary middlewares (e.g., session handling, rate limiting).
2. **Buyer Search:** Implement the `/search` command and inline query responses (`@EthioFlowBot search_term`). 
3. **Negotiation Wizard:** Build the Telegraf Wizard scene (`src/bot/flows/buyerFlow/index.ts`) for buyers negotiating prices.

### 🤖 AI Prompt to Start Your Work:
> "I am building the Buyer Search Experience for a Telegraf-based Telegram Bot. My job is to set up the main bot instance in `src/index.ts` and implement the inline query functionality so users can type `@EthioFlowBot <search>` in any chat. For now, use mock data matching the `Product` interface in `src/types/index.ts`. Please give me the code to initialize the bot with local webhook/polling, set up a basic session middleware, and handle `bot.on('inline_query')` by returning 3 mock products with their titles and prices."

---

## 🔄 Merging Strategy
1. **TM1** pushes database services.
2. **TM2** and **TM3** can pull those services to replace their mocked functions.
3. Since your directories are physically separated (Core vs. Seller vs. Buyer), you should have **zero merge conflicts** when integrating to the main branch.
