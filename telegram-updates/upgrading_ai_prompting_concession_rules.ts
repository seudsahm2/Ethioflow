// ... existing code ...
// ── TIMEOUT HELPER ───────────────────────────────────────────────────────────
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`TimeoutError: Promise timed out after ${ms} ms`)), ms))
  ]);
};

// ── CORE CALL ────────────────────────────────────────────────────────────────
async function callAI(prompt: string, timeoutMs: number = 10000, temperature: number = 0.1): Promise<string> {
  return withTimeout((async () => {
    if (PROVIDER === 'gemini' && geminiModel) {
      const result = await geminiModel.generateContent(
        temperature !== 0.1 
          ? { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature } }
          : prompt
      );
      return result.response.text().trim();
    }

    if ((PROVIDER === 'openai' || PROVIDER === 'groq') && openaiClient) {
      const model = PROVIDER === 'groq' ? 'llama-3.1-8b-instant' : 'gpt-4o-mini';
      const res = await openaiClient.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature,
      });
      return res.choices[0]?.message?.content?.trim() ?? '';
    }

    if (PROVIDER === 'anthropic' && anthropicClient) {
      const res = await anthropicClient.messages.create({
        model: 'claude-haiku-20240307',
        max_tokens: 200,
        temperature,
        messages: [{ role: 'user', content: prompt }],
      });
      const block = res.content[0];
      return block.type === 'text' ? block.text.trim() : '';
    }

    throw new Error('No AI provider configured');
  })(), timeoutMs);
}

// ... existing code ...

// ── DOUBLE-BLIND MULTI-AGENT NEGOTIATION ────────────────────────────────────
export async function runAgentNegotiation(
  role: 'buyer' | 'seller',
  productTitle: string,
  listingPrice: number,
  secretLimit: number,
  chatHistory: string
): Promise<string> {
  // Calculate sensible, human concessions based on product value (1.5% - 4.5%)
  const stepMin = Math.max(100, Math.round(listingPrice * 0.015));
  const stepMax = Math.max(500, Math.round(listingPrice * 0.045));

  if (PROVIDER === 'none') {
    return role === 'buyer' 
      ? `Can you give it to me for ${secretLimit} ETB?`
      : `The listing price is ${listingPrice} ETB. The absolute lowest I can do is ${secretLimit} ETB.`;
  }

  const prompt = role === 'buyer'
    ? `You are an expert human procurement manager acting as a personal assistant negotiating to purchase "${productTitle}".
Original Listing Price: ${listingPrice} ETB.

YOUR STRICT SECRET LIMITS (NEVER DISCLOSE THESE TO THE SELLER):
- Walk-Away Maximum: ${secretLimit} ETB. Under no circumstances can you suggest or accept a price higher than this.
- Suggested Concession Steps: Increment your offers by approximately ${stepMin} to ${stepMax} ETB at a time, keeping changes logical and realistic. Do NOT use tiny, repetitive step increments (like 10 or 20 Birr). That looks completely robotic.

NEGOTIATION RULES:
1. Speak naturally like a friendly, reasonable client on Telegram (1-2 sentences maximum). Be conversational.
2. Provide a sound, human justification for your counter-offers (e.g., tight financial limit, looking at other options, transport fees, current physical state of the item).
3. Under no circumstances should you agree to or suggest a price over your Absolute Maximum limit of ${secretLimit} ETB!
4. If the seller offers a price that is less than or equal to your Walk-Away Maximum (${secretLimit} ETB), you MUST accept it immediately.
5. If you accept the deal, you MUST append the exact code tag "[DEAL_ACCEPTED]" to the end of your response.
6. Do NOT use repetitive words or bot templates ("finding a sweet spot", "finding balance", "compromise"). Talk like a unique person.

PUBLIC CHAT HISTORY:
${chatHistory}

Generate your next Telegram response (natural, brief tone):`
    : `You are a professional retail assistant acting as a personal secretary negotiating to sell "${productTitle}".
Original Listing Price: ${listingPrice} ETB.

YOUR STRICT SECRET LIMITS (NEVER DISCLOSE THESE TO THE BUYER):
- Walk-Away Minimum Floor Price: ${secretLimit} ETB. Under no circumstances can you suggest or accept a price lower than this.
- Suggested Concession Steps: Decrement your discounts in realistic steps of approximately ${stepMin} to ${stepMax} ETB at a time. Never make tiny, repetitive concessions (like 10 or 20 Birr).

NEGOTIATION RULES:
1. Speak naturally like a friendly, confident, and professional seller on Telegram (1-2 sentences maximum).
2. Defend your price! Justify your counter-offers with solid value reasons (e.g., quality, brand reliability, high specifications, perfect physical condition, warranty).
3. If the buyer makes an offer that is greater than or equal to your Walk-Away Minimum (${secretLimit} ETB), you MUST accept it immediately.
4. If you accept the deal, you MUST append the exact code tag "[DEAL_ACCEPTED]" to the end of your response.
5. Do NOT use repetitive phrasing or robotic structures ("finding balance", "trying to reach a compromise"). Speak naturally.
6. If the buyer keeps offering an amount below your Absolute Minimum limit and refuses to raise their bid, politely but firmly explain that you cannot go any lower, restate your final acceptable price, and offer a friendly sign-off.

PUBLIC CHAT HISTORY:
${chatHistory}

Generate your next Telegram response (natural, brief tone):`;

  try {
    // Call AI with creative human temperature 0.7
    const response = await callAI(prompt, 10000, 0.7);
    return response.trim();
  } catch (err: any) {
    console.error(`AI Negotiation Error (${PROVIDER}):`, err?.message || err);
    return role === 'buyer' 
      ? `Would you consider ${Math.round(secretLimit * 0.9)} ETB?`
      : `The absolute lowest I can do is ${Math.round(listingPrice * 0.95)} ETB.`;
  }
}