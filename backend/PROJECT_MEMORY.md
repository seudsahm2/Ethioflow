# 🏆 EthioFlow Project Memory & Documentation

## 📖 Vision & Core Concept
**EthioFlow** is a full automation platform for Ethiopian buyers and sellers, operating entirely inside Telegram. It is a unified seller marketplace where sellers register, and buyers search for products seamlessly without leaving their conversations.

**Key Rule:** Every Telegram bot feature must be a "load-bearing wall." None are decoration.

---

## 🎯 Answers to Final Architecture & Syncing Questions

### 1. How to automate seller registration?
**The "Admin Invite" Hack:** Instead of filling out manual forms, the seller simply adds `@EthioFlowBot` as an Administrator to their existing Telegram Channel.
- Telegram's Bot API instantly fires a `my_chat_member` event when the bot is added.
- The bot automatically captures the Channel Name, ID, and Owner information.
- The bot sends a direct message to the owner: *"I see you added me to [Channel Name]! Your store is now officially registered on EthioFlow."*

### 2. How to auto-sync new posts (No Double Entry)?
Because the bot is now an Admin in the seller's channel, it receives a `channel_post` webhook event every time the seller posts something new.
- The seller posts to their channel exactly as they always do.
- EthioFlow silently catches the post in the background.
- It passes the text + image to an LLM (e.g., Gemini) to extract: `Product Name`, `Price`, `Condition`, `Specs`.
- The bot automatically saves this to the EthioFlow marketplace database.

### 3. How to handle previous posts?
The standard Telegram Bot API does not allow reading past messages when added to a channel. Instead of risking bans with a Userbot (MTProto), we use a clever, frictionless approach:
- **Bulk Forwarding:** The bot tells the seller, *"Select up to 100 of your previous channel posts and forward them to me here in our DM."*
- When the bot receives forwarded messages from the seller's channel, it validates the channel ID, uses the LLM to parse each product, and retroactively populates their store inventory in seconds.

---

## 🏗️ Technical Stack Recommendations

To build a professional, scalable, and modular system, here is the recommended stack:

| Component | Technology | Why it's best for EthioFlow |
|-----------|------------|-----------------------------|
| **Language** | TypeScript (Node.js) | Type safety, huge ecosystem, perfect for async chat logic. |
| **Bot Framework** | `telegraf` | The most robust, community-supported Telegram framework for Node.js. |
| **Database** | PostgreSQL | Relational data is crucial for marketplaces (Sellers ↔ Products ↔ Buyers). |
| **ORM** | Prisma | Typesafe database access, easy migrations, fast development speed. |
| **Caching/Session** | Redis | To track bot conversation states (Wizards), user sessions, and rate-limit searches. |
| **AI Intelligence** | Google Gemini API / OpenAI | Fast, cost-effective extraction of product details from Amharic/English unstructured channel text. |
| **Hosting** | Render or Vercel | Easy deployment with webhook support. |

---

## 🗂️ Professional Decoupled Folder Structure

This modular structure ensures that the buyer flow, seller flow, and AI logic never entangle, allowing clean scaling.

```text
Ethioflow/
├── src/
│   ├── bot/                   # Core Bot Engine
│   │   ├── middlewares/       # Auth, Session, Rate Limiting
│   │   ├── commands/          # /start, /search, /help
│   │   ├── flows/             # Conversation Wizards (State Machines)
│   │   │   ├── buyerFlow/     # Guest search, Negotiation, Trust scoring
│   │   │   └── sellerFlow/    # Onboarding, Brand Voice setup
│   │   └── handlers/          # Event Handlers
│   │       ├── channelPost.ts # Auto-syncs new channel posts
│   │       └── forwards.ts    # Handles past inventory syncing
│   ├── core/                  # Business Logic & Intelligence
│   │   ├── ai/                # LLM Integration (Gemini/OpenAI prompts & extraction)
│   │   ├── db/                # Prisma client setup
│   │   └── services/          # Decoupled logic (ProductService, SellerService, TrustScoreService)
│   ├── jobs/                  # Background Tasks (e.g., Nightly Bot-to-Bot Reports)
│   ├── types/                 # Global TypeScript interfaces
│   ├── config/                # Environment variables, constants
│   └── index.ts               # Entry point (Webhook/Polling setup)
├── prisma/
│   └── schema.prisma          # Database schema
├── .env                       # Secrets
├── package.json
└── tsconfig.json
```

---

## 🛠️ Complete Feature Set & Functional Requirements

### Buyer Flow
1. **Inline Price Search (Guest Bot):** Buyers can tag `@EthioFlowBot` inline in any chat to query products. The bot returns ranked search results from the database.
2. **Invisible Fraud Check:** The platform assigns a trust score (1-10) based on seller history and verification.
3. **Chat Automation (Negotiation):** Buyers can initiate automated negotiation via the bot before revealing themselves to the seller.
4. **Streaming Responses:** Bot replies stream word-by-word for a human-like feel.

### Seller Flow
1. **Zero-Friction Onboarding:** Sellers register by simply adding the bot as a channel admin.
2. **Auto-Sync Inventory:** New channel posts are auto-parsed by AI and added to the database.
3. **Past Inventory Backfill:** Sellers forward past posts to the bot for instant catalog generation.
4. **Custom AI Styles:** Sellers define their brand voice (e.g., "Friendly Amharic, emphasize warranty").
5. **Nightly Intelligence Digest (Bot-to-Bot):** Nightly automated reports (Sales, Market Trends, Competitor Pricing) sent to the seller.

---
**This document acts as the definitive roadmap and boundary for EthioFlow. Stick to this architecture and scope to ensure a robust MVP.**