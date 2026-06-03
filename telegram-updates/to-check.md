🛠️ Telegram Bot API 10.0+ Ultimate Developer Audit & To-Do Workbook
Your complete step-by-step master checklist for Guest Mode, Bot-to-Bot Communication, and Secretary (Business) Mode.

This workbook is designed to help you verify, audit, and refactor your existing Telegram Bot codebase. Use this checklist as your absolute reference for compliance, edge cases, and architectural integrity.

📌 PHASE 1: SYSTEM & BASE INFRASTRUCTURE
Before focusing on individual features, the underlying delivery mechanisms must be updated to prevent dropped events or unparsed payloads.

🔲 1. Update Registration & Parsing
[ ] Allowed Updates Scope: Ensure your webhook or getUpdates call explicitly includes the new events.

Required Array: ["message", "business_connection", "business_message", "edited_business_message", "deleted_business_messages", "guest_message"]

[ ] Raw HTTP Safety (No Middleware Blindness): If you are using frameworks like Express, Fastify, or Koa, ensure that your body-parser parses raw JSON and doesn't cut off unrecognized headers.

[ ] Error Boundary Isolation: Implement an outer try/catch wrapper on your main update router so that a crash in a guest handler doesn't prevent incoming business updates from being processed.

// Verification Code Snippet:
try {
    const update = JSON.parse(req.body);
    if (update.guest_message) await handleGuest(update.guest_message);
    else if (update.business_message) await handleBusiness(update.business_message);
} catch (globalErr) {
    console.error("CRITICAL: Failed to route update without crashing process", globalErr);
}

📌 PHASE 2: GUEST MODE (THE STEALTH SUMMON)
Guest Mode allows users to @mention your bot in any chat (group, supergroup, channel, or DM) where the bot is not a member.

🔲 2.1 The "Can Do" Checklist
[ ] Extract Calling Metadata: You can extract details about who summoned the bot using Message.guest_bot_caller_user (returns the User object).

[ ] Extract Chat Context: You can identify the chat where the bot was summoned using Message.guest_bot_caller_chat (returns the Chat object). Use this to log usage metrics by community size/type.

[ ] Execute Inline Formatting: You can send MarkdownV2, HTML, inline keyboards, custom buttons, and link previews within your guest response.

🔲 2.2 The "Cannot Do" Checklist
[ ] No Conversational Follow-Up: Your codebase must not attempt to follow up. Once the guest query is answered, you cannot send another message to that chat.

[ ] No Access to Chat History: Do not write code that assumes you can read surrounding messages. You only have access to the single message where your bot was tagged.

[ ] No Member Lists: Your bot cannot call getChatMember or getChatAdministrators on the caller chat. It will throw a 403 Forbidden error.

🔲 2.3 The "Must Do" & "Must Not Do" Checklist
[ ] MUST NOT use sendMessage: You must not call standard sendMessage with the chat_id of the guest group.

[ ] MUST reply via answerGuestQuery: You must call the specific answerGuestQuery endpoint using the guest_query_id received in the payload.

[ ] MUST respect the Expiration Window: You must answer within a 10-second window before the guest_query_id becomes stale. If your LLM/logic is slow, send an immediate acknowledgment first or use an aggressive timeout.

🔥 SUPER FEATURE: The Mini-App Context Handoff
Since you cannot continue a conversation in the caller chat, the premium design pattern is to reply to the guest query with an Inline Keyboard Button containing a web_app or a deep-link start URL.

How it works: When they click the button, it opens your Mini App or drops them into a private DM with your bot, automatically passing the metadata (guest_bot_caller_chat.id and guest_bot_caller_user.id) through a startapp deep link.

To-Do Item: Add a fallback redirect button on all guest responses to transition users from "stealth mode" to full application engagement.

📌 PHASE 3: BOT-TO-BOT MODE (THE COORDINATION LAYER)
Autonomous AI Agents can now communicate natively inside Telegram without requiring an external proxy server.

🔲 3.1 The "Can Do" Checklist
[ ] Private Peer-to-Peer Agent Messaging: Bot A can send a private message directly to Bot B by addressing its @username as the chat_id in sendMessage.

[ ] Structured Data Exchange: You can transmit structured payloads (JSON objects represented as strings) directly in the message text, which the receiver bot parses instantly.

[ ] Observed Collaboration: You can have an orchestrator bot deploy worker bots inside a shared group chat, with all workers communicating transparently for the human user to watch.

🔲 3.2 The "Cannot Do" Checklist
[ ] No Cold Bot Messaging: Bot A cannot message Bot B unless Bot B has explicitly enabled the feature and Bot A is configured to talk to other agents. Both must opt-in.

[ ] No Implicit Trust: You cannot trust that incoming bot messages are secure. You must verify the sender's bot ID against an approved roster.

🔲 3.3 The "Must Do" & "Must Not Do" Checklist
[ ] MUST NOT Deploy without Rate-Limiting: You must not let an automated response execute without passing through a sliding-window rate limiter.

[ ] MUST Check message.from.is_bot: You must explicitly parse whether the sender is a bot, routing it to a separate, heavily protected handling pipeline.

[ ] MUST Handle Serialization Errors: Since bots may send you malformed structural JSON, you must trap JSON parsing exceptions gracefully to avoid throwing execution loops.

🔥 SUPER FEATURE: Consensus Coordination Protocol (The "Task Hand-off")
When building complex systems, do not write a monolithic bot. Instead, implement a Multi-Agent Consensus Pattern:

Orchestrator Bot receives a user prompt (e.g., "Analyze this image and write code").

Orchestrator Bot sends a structured message to Vision Bot (@VisionBot): {"task": "describe_image", "file_id": "123"}.

Vision Bot replies back to Orchestrator Bot with the analysis.

Orchestrator Bot messages Coder Bot (@CoderBot) with the vision results to write the code.

Orchestrator Bot compiles the final answer and sends it back to the human.

To-Do Item: Define standard JSON schemas for internal bot-to-bot messaging ({ "task_id": "uuid", "sender": "@bot", "payload": {} }) to maintain clean agent boundaries.

📌 PHASE 4: SECRETARY (BUSINESS) MODE (THE PERSONAL AVATAR)
Connecting your bot to a user's personal profile (Premium required) to manage their personal DMs.

🔲 4.1 The "Can Do" Checklist
[ ] Natively Reply as the Owner: You can reply directly to any client's DM using the business_connection_id – the client sees your client's name and avatar, not your bot's.

[ ] Track State via Connection Updates: You can listen for when the business connection is authorized, modified, or severed using business_connection updates.

[ ] Welcome the Business Owner: When a user connects your bot, you can immediately send them a welcoming message in their private bot chat using the user_chat_id field from the connection object.

🔲 4.2 The "Cannot Do" Checklist
[ ] No Cold Spam (The 24-Hour Rule): You cannot send a message to a client if that client hasn't sent a message to the business owner in the last 24 hours. The Telegram API will block the request.

[ ] No Access to Group Chats / Channels: Business bots are restricted strictly to 1-to-1 direct messages (DMs) with customers. They cannot read or reply within group chats.

[ ] No Secret Chat Visibility: You cannot read or respond to end-to-end encrypted secret chats.

🔲 4.3 The "Must Do" & "Must Not Do" Checklist
[ ] MUST NOT Process Self-Messages: You must ignore updates where businessMessage.from.is_self is true. If your bot reads its own message and attempts to process/reply to it, it will trigger an immediate infinite recursion loop.

[ ] MUST Check Permissions Dynamically: When processing business_connection updates, you must check if the can_reply field is true. If the user disabled reply permissions, your bot must switch to a "Read-Only Monitor" state.

[ ] MUST Store Active Connections: You must save business_connection_id to a database alongside the connected user_id to route outgoing payloads accurately.

🔥 SUPER FEATURE: Instant Manual Takeover & 30-Min Cool Down
If the business owner sees their bot chatting and decides to type a message themselves, the AI must get out of the way immediately to prevent awkward, overlapping conversations.

How to Implement:

Listen to business_message updates.

Check if businessMessage.from.id === business_connection.user.id (meaning the owner just typed).

If yes, write a timestamp to your database: last_manual_intervention_time: Date.now().

Whenever the customer messages again, check if Date.now() - last_manual_intervention_time < 30 * 60 * 1000 (30 minutes).

If within the 30-minute window, silently skip generating an AI response.

To-Do Item: Implement a dynamic takeover lock table in your database schema.

🔥 SUPER FEATURE: Context Synchronization (Edits and Deletes)
A customer might delete a message they sent, or edit their previous message. Your LLM context needs to reflect this instantly.

How to Implement:

Edits: Capture edited_business_message updates, update the stored message in your history database, and trigger an updated LLM response if the client completely changed their query.

Deletes: Capture deleted_business_messages updates (which contains an array of message IDs) and delete those records from your vector DB / chat history database so the AI doesn't reference deleted information.

To-Do Item: Add specialized event handlers for edited_business_message and deleted_business_messages in your core routing code.

📋 SUMMARY AUDIT SHEET
Print or copy this matrix to measure your codebase's overall modern compliance:

| Metric / Check | Implemented? (Y/N) | Code File & Line Number | Notes / Missing Items |
| :--- | :--- | :--- | :--- |
| **Allowed Updates** configured for API 10.0+ | **Y** | `src/index.ts` (Lines 121-140) | Configured with `edited_business_message` and `deleted_business_messages` |
| **Loop-Prevention Circuit Breaker** for Bots | **Y** | `src/bot/handlers/businessMessage.ts` (Lines 63-67) | Ignores messages where `is_self === true` |
| **Guest Mode** handled via `answerGuestQuery` | **Y** | `src/bot/commands/search.ts` (Lines 37-52) | Calls `answerGuestQuery` with compliant `InlineQueryResultArticle` format |
| **is_self Filter** Active in Business Mode | **Y** | `src/bot/handlers/businessMessage.ts` (Lines 63-67) | Filters out messages generated by the connection itself |
| **Dynamic Takeover** (Quiet Window) Active | **Y** | `src/bot/handlers/businessMessage.ts` & `src/bot/handlers/negotiationEngine.ts` | Disables automated turns for 30 minutes if owner sent manual message |
| **Message Sync** (Edits & Deletions) Active | **Y** | `src/bot/handlers/businessMessage.ts` (Lines 10-53) | Synchronizes edit/deletion updates back to SQLite DB message history |
| **can_reply** Connection Checks Active | **Y** | `src/bot/handlers/businessConnection.ts` & `src/bot/handlers/negotiationEngine.ts` | Tracks permission and disables reply strategy if read-only |