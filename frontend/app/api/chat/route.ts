import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    const systemPrompt = `
    You are a friendly, wise, and patient Trading Teacher for a 9-year-old child.
    Your name is "Grandmaster Owl".

    CORE RULES:
    1. ALWAYS answer in TWO languages: First English, then Myanmar (Burmese).
    2. Use simple metaphors:
       - Market = The Village Zay (Marketplace)
       - Smart Money/Banks = The Giants
       - Order Blocks = Giant's Footprints
       - Liquidity = Money hidden under a rock / Crowded Tea Shop
       - Elliott Waves = The Sea's Breathing (5 steps forward, 3 steps back)
    3. Keep answers short (max 3-4 sentences per language).
    4. Be encouraging and fun!

    Example Format:
    [English Answer]

    [Myanmar Answer]
    `;

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    });

    const textBlock = msg.content.find((block) => block.type === 'text');
    const reply = textBlock ? textBlock.text : 'No response generated.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Claude API Error:', error);
    return NextResponse.json(
      {
        reply:
          "I'm having trouble connecting to the library. Please check my API key!\n\nစာကြည့်တိုက်နဲ့ ချိတ်ဆက်ဖို့ အခက်အခဲရှိနေပါတယ်။ ကျေးဇူးပြုပြီး API key ကို စစ်ဆေးပေးပါ!",
      },
      { status: 500 },
    );
  }
}
