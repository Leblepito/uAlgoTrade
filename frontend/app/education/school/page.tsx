"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

/* ------------------------------------------------------------------ */
/*  Full curriculum data                                                */
/* ------------------------------------------------------------------ */

const CURRICULUM = [
  {
    module: "Module 1",
    title: "Market Foundations",
    icon: "🏛️",
    duration: "45 min",
    xp: 150,
    color: "from-cyan-500/20 to-blue-500/20",
    border: "border-cyan-500/30",
    accent: "text-cyan-400",
    lessons: [
      {
        title: "What Are Financial Markets?",
        content: `Financial markets are places (physical or virtual) where buyers and sellers exchange financial instruments — stocks, bonds, crypto, forex, and commodities.

**Key participants:**
• **Retail traders** — individuals like you, trading from personal accounts
• **Institutional traders** — banks, hedge funds, pension funds with billions
• **Market makers** — firms that provide liquidity by always being willing to buy or sell
• **Central banks** — control monetary policy and affect currency markets

The key insight: institutional money (Smart Money) moves markets. Retail traders must learn to READ what institutions are doing — not fight them.

**Example:** When the Fed raises interest rates, USD typically strengthens because it offers better returns. Global capital flows toward USD assets.`,
        duration: "8 min",
      },
      {
        title: "How Price Is Formed",
        content: `Price is simply the agreement between a buyer and a seller at a specific moment.

**The Order Book:**
Every exchange maintains an order book — a list of all buy orders (bids) and sell orders (asks). When a buy order matches a sell order, a trade executes and price is set.

**Supply & Demand Zones:**
• **Demand zone** — area where many buy orders cluster → price tends to bounce UP
• **Supply zone** — area where many sell orders cluster → price tends to bounce DOWN

**Liquidity** is the ease with which an asset can be bought or sold. High liquidity = tight spreads, small price impact. Low liquidity = wide spreads, price can move dramatically on small orders.

**Why price moves:**
1. News/events change fundamental value
2. Large orders absorb available liquidity
3. Stop-loss orders cascade (stop hunts)
4. Algorithmic triggers activate`,
        duration: "10 min",
      },
      {
        title: "Reading a Candlestick Chart",
        content: `A candlestick represents price action over one time period (e.g., 1 hour, 1 day).

**Anatomy of a candle:**
• **Body** — range between open and close price
• **Upper wick** — highest price reached in the period
• **Lower wick** — lowest price reached in the period
• **Green/White candle** — closed HIGHER than it opened (bullish)
• **Red/Black candle** — closed LOWER than it opened (bearish)

**Key patterns to recognise:**
| Pattern | Signal | Description |
|---------|--------|-------------|
| Doji | Indecision | Open ≈ Close, wicks both sides |
| Hammer | Bullish reversal | Long lower wick, small body at top |
| Shooting Star | Bearish reversal | Long upper wick, small body at bottom |
| Engulfing | Strong reversal | One candle body engulfs previous candle |
| Morning Star | Bullish reversal | 3-candle pattern: red, tiny, green |

**Pro tip:** Never trade a single candle in isolation — always look at context (trend, support/resistance, volume).`,
        duration: "12 min",
      },
      {
        title: "Timeframes & Trading Styles",
        content: `The timeframe you choose determines your trading style and how long you hold positions.

**Common timeframes:**
| Timeframe | Style | Hold Duration | Signals/Day |
|-----------|-------|---------------|-------------|
| 1m - 5m | Scalping | Seconds-minutes | 20-100+ |
| 15m - 1h | Day Trading | Minutes-hours | 3-10 |
| 4h - 1D | Swing Trading | Days-weeks | 1-3 |
| 1W - 1M | Position Trading | Weeks-months | 1-4/month |

**Multi-timeframe analysis (MTF):**
Always zoom out to see the bigger picture. Trade in the direction of the higher timeframe trend.

Example for a swing trade entry:
1. **Weekly** — Identify overall trend direction
2. **Daily** — Find key S/R levels and structure
3. **4H** — Look for entry trigger
4. **1H** — Fine-tune entry & stop placement`,
        duration: "7 min",
      },
    ],
    quiz: [
      { q: "What are 'institutional traders'?", opts: ["Retail traders with large accounts", "Banks and hedge funds with billions", "Government regulators", "Exchange operators"], a: 1 },
      { q: "A green candlestick means:", opts: ["Price closed lower than it opened", "Price closed higher than it opened", "Price didn't move", "Volume was high"], a: 1 },
      { q: "What is a 'demand zone'?", opts: ["Area where sell orders cluster", "Area where buy orders cluster", "A cryptocurrency exchange", "A type of stop-loss"], a: 1 },
      { q: "Which trading style holds positions for days to weeks?", opts: ["Scalping", "Day trading", "Swing trading", "Arbitrage"], a: 2 },
      { q: "What does 'multi-timeframe analysis' mean?", opts: ["Trading on multiple exchanges", "Using charts from different time periods together", "Having multiple accounts", "Trading multiple assets at once"], a: 1 },
    ],
  },
  {
    module: "Module 2",
    title: "Technical Analysis Core",
    icon: "📊",
    duration: "60 min",
    xp: 200,
    color: "from-blue-500/20 to-violet-500/20",
    border: "border-blue-500/30",
    accent: "text-blue-400",
    lessons: [
      {
        title: "Support & Resistance",
        content: `Support and Resistance are the most fundamental concepts in technical analysis.

**Support** — A price level where buying pressure is strong enough to stop a decline. Price "bounces" off support.

**Resistance** — A price level where selling pressure is strong enough to stop an advance. Price "bounces" off resistance.

**Why they form:**
• **Previous highs/lows** — traders remember key price levels
• **Round numbers** — psychological levels ($50,000 BTC, $3,000 ETH)
• **High-volume nodes** — where lots of trading has occurred
• **Moving averages** — dynamic support/resistance

**Role reversal:** Old support often becomes new resistance after a break, and vice versa. This is one of the most powerful concepts in trading.

**Strength factors:**
1. Number of times price has tested the level
2. How cleanly price bounced
3. Volume at the level
4. Time since the level was formed`,
        duration: "12 min",
      },
      {
        title: "Trend Lines & Channels",
        content: `A trend is your best friend — trade with it, not against it.

**Drawing trend lines:**
• **Uptrend line** — connect at least 2 higher lows. Price respects this as support.
• **Downtrend line** — connect at least 2 lower highs. Price respects this as resistance.
• A valid trend line needs at least 3 touches to be considered reliable.

**Channels:**
Draw a parallel line to your trend line on the opposite side to form a channel. Price tends to oscillate between channel boundaries.
• **Ascending channel** — bullish, but watch for breakdown
• **Descending channel** — bearish, but watch for breakout
• **Horizontal channel** — consolidation / ranging market

**Structure breaks:**
When price breaks a significant trend line or key structure level:
1. Look for a retest of the broken level (former support → new resistance)
2. Wait for confirmation (e.g., a rejection candle at the retest)
3. Enter in the direction of the break with stop above/below the retest level`,
        duration: "10 min",
      },
      {
        title: "Moving Averages: SMA, EMA, WMA",
        content: `Moving averages smooth out price data to identify trends and potential support/resistance.

**Simple Moving Average (SMA)**
Average closing price over N periods. Equal weight to all periods.
Best for: identifying overall trend direction.

**Exponential Moving Average (EMA)**
Gives MORE weight to recent prices. Reacts faster to price changes.
Best for: active trading, capturing momentum.

**Weighted Moving Average (WMA)**
Linear weighting — most recent candle gets highest weight.
Best for: very responsive trend following.

**Popular combinations:**
| MA | Use |
|----|-----|
| EMA 9 + EMA 21 | Short-term trend |
| EMA 50 | Medium-term trend |
| SMA 100 + SMA 200 | Long-term trend |

**Golden Cross:** 50 MA crosses ABOVE 200 MA → bullish long-term signal
**Death Cross:** 50 MA crosses BELOW 200 MA → bearish long-term signal

**MA as dynamic S/R:** Price often bounces off the 21 EMA (in trends) or the 200 SMA (long-term) just like a static support/resistance level.`,
        duration: "14 min",
      },
      {
        title: "RSI & MACD Explained",
        content: `**Relative Strength Index (RSI)**
RSI measures momentum on a scale of 0-100.
• **RSI > 70** → Overbought (price may be due for a pullback)
• **RSI < 30** → Oversold (price may be due for a bounce)
• **RSI 40-60** → Neutral zone

**Pro tip:** In strong trends, RSI can stay overbought/oversold for extended periods. Don't just sell because RSI is 75!

**RSI Divergence (powerful signal):**
• **Bullish divergence:** Price makes a lower low, but RSI makes a higher low → potential reversal UP
• **Bearish divergence:** Price makes a higher high, but RSI makes a lower high → potential reversal DOWN

---

**MACD (Moving Average Convergence Divergence)**
MACD = EMA12 - EMA26 (the "MACD line")
Signal line = EMA9 of MACD
Histogram = MACD line - Signal line

**Signals:**
• **Bullish crossover:** MACD line crosses ABOVE signal line → buy signal
• **Bearish crossover:** MACD line crosses BELOW signal line → sell signal
• **Zero line cross:** MACD crossing 0 from below = bullish trend beginning
• **Histogram expanding:** Increasing momentum in current direction`,
        duration: "16 min",
      },
    ],
    quiz: [
      { q: "What happens at a support level?", opts: ["Selling pressure stops price rising", "Buying pressure stops price falling", "Volume increases dramatically", "Price always reverses"], a: 1 },
      { q: "What is a 'Golden Cross'?", opts: ["Price touching a round number", "50 MA crossing above the 200 MA", "RSI reaching 70", "A bullish candlestick pattern"], a: 1 },
      { q: "EMA reacts faster than SMA because:", opts: ["It uses more data", "It gives more weight to recent prices", "It ignores older prices completely", "It's calculated differently on weekends"], a: 1 },
      { q: "RSI below 30 typically indicates:", opts: ["Overbought conditions", "Oversold conditions", "Neutral conditions", "No information"], a: 1 },
      { q: "A valid trend line requires at least:", opts: ["1 touch", "2 touches", "3 touches", "5 touches"], a: 2 },
    ],
  },
  {
    module: "Module 3",
    title: "Market Structure & Smart Money",
    icon: "🧠",
    duration: "75 min",
    xp: 300,
    color: "from-violet-500/20 to-purple-500/20",
    border: "border-violet-500/30",
    accent: "text-violet-400",
    lessons: [
      {
        title: "Higher Highs & Higher Lows",
        content: `Market structure is the framework for understanding whether a market is trending, ranging, or reversing.

**Uptrend structure:**
Higher High (HH) → Higher Low (HL) → Higher High → Higher Low...
Each pullback creates a Higher Low, meaning buyers are stepping in at progressively higher prices.

**Downtrend structure:**
Lower High (LH) → Lower Low (LL) → Lower High → Lower Low...
Each rally creates a Lower High, meaning sellers are stepping in at progressively lower prices.

**Change of Character (ChoCH):**
When an uptrend creates a LOWER HIGH for the first time → potential trend change.
When price breaks a previous Higher Low → confirmed trend change.

**Ranging/Consolidation:**
Price oscillates between equal highs and lows. Institutions are typically accumulating or distributing during ranges.

**Trading rule:** Only take trades in the direction of market structure. Don't fight the trend.`,
        duration: "12 min",
      },
      {
        title: "Order Blocks & Breaker Blocks",
        content: `Order blocks are the footprints of institutional traders — areas where banks and funds placed large orders.

**Bullish Order Block (OB):**
The LAST bearish candle before a strong upward move. Price later returns to this level to "fill" unfilled orders.

Characteristics:
• Strong price departure from the OB area (impulsive move)
• Clear imbalance/gap left behind
• Price hasn't returned to the OB yet

**Bearish Order Block:**
The LAST bullish candle before a strong downward move.

**How to trade Order Blocks:**
1. Identify an impulsive move (strong, fast price movement)
2. Find the last opposing candle before the move
3. Mark the high and low of that candle
4. Wait for price to return to the OB zone
5. Look for a confirmation entry signal (rejection candle, RSI divergence)
6. Stop-loss: beyond the OB boundary

**Breaker Blocks:**
An OB that price HAS broken through. The breaker block now acts as resistance (if it was a bullish OB that failed).`,
        duration: "16 min",
      },
      {
        title: "Fair Value Gaps (FVG) & Imbalance",
        content: `A Fair Value Gap is a 3-candle pattern where the middle candle moves so aggressively that it leaves a gap between candle 1's wick and candle 3's wick.

**Bullish FVG:**
• Candle 1: bearish
• Candle 2: large bullish (gap forms — candle 1 high doesn't overlap candle 3 low)
• Candle 3: bullish continuation

The gap represents an IMBALANCE — price moved too fast, leaving unfilled orders. Price tends to return to "fill" this gap before continuing.

**Bearish FVG:** Opposite pattern — price shoots down leaving a gap above.

**Trading FVGs:**
• Wait for price to retrace into the FVG zone (typically 50-75% of the gap)
• Look for a reaction (rejection candle) within the gap
• Enter with stop just outside the gap
• Target: the origin of the impulsive move

**FVG + OB confluence:**
When an FVG overlaps with an Order Block, you have a high-probability trade setup. Both concepts confirm the same zone.`,
        duration: "16 min",
      },
      {
        title: "Liquidity & Stop Hunts",
        content: `Smart money needs liquidity to fill large orders. They create liquidity by hunting retail stop-losses.

**Types of liquidity:**
• **Buy-side liquidity** — stop-losses from short sellers sit ABOVE resistance → institutions push price up to grab them
• **Sell-side liquidity** — stop-losses from long buyers sit BELOW support → institutions push price down to grab them
• **Equal highs/lows** — obvious targets that retail traders watch → institutions use them as liquidity pools

**The stop hunt sequence:**
1. Range forms with obvious equal highs
2. Price breaks above equal highs (triggering buy-stops and breakout traders)
3. Price IMMEDIATELY reverses back into the range
4. Retail traders are "trapped" in bad positions
5. Price moves aggressively in the opposite direction (with institutions now fully positioned)

**How to avoid being hunted:**
• Don't place stops at obvious levels (just below round numbers or previous swing lows)
• Wait for confirmation AFTER a level is broken before entering
• Use structure-based stops (below the last HH that held)`,
        duration: "16 min",
      },
    ],
    quiz: [
      { q: "What defines an uptrend in market structure?", opts: ["Lower highs and lower lows", "Equal highs and equal lows", "Higher highs and higher lows", "Random price movement"], a: 2 },
      { q: "What is a Bullish Order Block?", opts: ["The last bullish candle before a down move", "The last bearish candle before a strong up move", "A range of equal candles", "A gap in the chart"], a: 1 },
      { q: "What is a Fair Value Gap?", opts: ["A price gap between open and close", "An imbalance left by a fast-moving candle", "The difference between bid and ask", "A gap caused by news"], a: 1 },
      { q: "Buy-side liquidity is typically found:", opts: ["Below support levels", "Above resistance levels", "At moving average crossovers", "At round numbers only"], a: 1 },
      { q: "What is a 'Change of Character' (ChoCH)?", opts: ["A candle changing colour", "The first sign that a trend may be reversing", "RSI changing direction", "A MACD crossover"], a: 1 },
      { q: "A Breaker Block is:", opts: ["A new Order Block forming", "An OB that price has broken through", "The same as a Fair Value Gap", "A type of support level"], a: 1 },
    ],
  },
  {
    module: "Module 4",
    title: "Elliott Wave Theory",
    icon: "🌊",
    duration: "90 min",
    xp: 400,
    color: "from-teal-500/20 to-cyan-500/20",
    border: "border-teal-500/30",
    accent: "text-teal-400",
    lessons: [
      {
        title: "The 5-Wave Impulse",
        content: `Ralph Nelson Elliott discovered in the 1930s that market prices move in repetitive wave patterns, reflecting mass psychology.

**The 5-Wave Impulse (Motive Phase):**
• **Wave 1** — First move up. Weak, few notice it. Often misidentified as a correction.
• **Wave 2** — Retracement of Wave 1. Can retrace up to 99% of Wave 1. Does NOT break below Wave 1's start.
• **Wave 3** — The strongest wave. Usually the longest and most powerful. Never the shortest.
• **Wave 4** — Correction of Wave 3. More complex than Wave 2. Does NOT overlap with Wave 1 territory.
• **Wave 5** — Final push. Often shows RSI divergence. Not always as strong as Wave 3.

**Iron Rules:**
1. Wave 2 never retraces more than 100% of Wave 1
2. Wave 3 is never the shortest impulse wave
3. Wave 4 never enters Wave 1's territory (in non-leveraged markets)

Violating any rule means your wave count is WRONG.`,
        duration: "20 min",
      },
      {
        title: "ABC Corrective Patterns",
        content: `After a 5-wave impulse, price corrects in a 3-wave ABC pattern before the next impulse begins.

**Simple Zigzag (5-3-5):**
• Wave A — sharp move against the trend
• Wave B — partial retracement (typically 50-61.8% of A)
• Wave C — sharp move extending beyond A's end

**Flat (3-3-5):**
• Wave A — 3-wave move
• Wave B — retraces back near the start of A (88-100%+)
• Wave C — 5 waves, ending near or beyond A's end

**Triangle (3-3-3-3-3):**
• 5 sub-waves: A-B-C-D-E
• Converging trend lines
• Usually the final correction before a final impulse (Wave 5)
• The "thrust" out of the triangle equals the widest part of the triangle

**Complex Corrections (WXY):**
Three corrections connected by "X" waves. Very common in crypto markets.

**Key principle:** Corrective patterns are typically 3-wave moves. If you see a clear 3 waves, expect the trend to resume.`,
        duration: "20 min",
      },
      {
        title: "Fibonacci Ratios in Waves",
        content: `Fibonacci ratios are the mathematical backbone of Elliott Wave Theory. Elliott waves tend to end at Fibonacci levels.

**Key retracement levels:**
• **23.6%** — shallow retracement (often Wave 2 in strong trends)
• **38.2%** — common Wave 2 retracement
• **50%** — psychological halfway point
• **61.8%** — "Golden Ratio" — most common Wave 2 retracement
• **78.6%** — deep Wave 2 retracement (still valid)

**Key extension levels (for Wave 3 and C):**
• **127.2%** — minimum Wave 3 extension
• **161.8%** — Golden Ratio extension — most common for Wave 3
• **261.8%** — extended Wave 3 (strong markets)
• **423.6%** — very extended Wave 3 (crypto bull markets)

**Practical application:**
1. Measure Wave 1 (start to end)
2. Apply Fibonacci retracements to find Wave 2 target
3. Measure from Wave 2 bottom, apply 161.8% extension → Wave 3 target
4. Measure Wave 1 height, apply from Wave 4 bottom → Wave 5 target

**Fibonacci confluence:** When multiple Fibonacci levels from different waves cluster at the same price — that's a high-probability target or reversal zone.`,
        duration: "20 min",
      },
      {
        title: "Counting Waves on Real Charts",
        content: `Wave counting is both an art and a science. Here's a practical framework.

**Step 1: Identify the highest degree waves first**
Start with the weekly or monthly chart. Find the major trend. Are we in an overall uptrend or downtrend?

**Step 2: Subdivide down**
Each wave on a higher timeframe subdivides into smaller waves on lower timeframes.
Major Wave 3 on the weekly = its own 5-wave impulse on the 4H chart.

**Step 3: Apply the rules as filters**
For every wave count you propose, verify:
• Rule 1 respected? (Wave 2 doesn't break Wave 1's start)
• Rule 2 respected? (Wave 3 isn't shortest)
• Rule 3 respected? (Wave 4 doesn't enter Wave 1)

If any rule breaks → adjust your count.

**Step 4: Use U2Algo's Elliott Wave analyzer**
U2Algo automatically identifies wave structures using AI. Use it as a second opinion or to validate your manual counts.

**Common beginner mistakes:**
• Forcing a count that doesn't fit the rules
• Ignoring degree (confusing a sub-wave for a major wave)
• Not having an alternative count ready
• Waiting for "perfect" waves — markets are messy`,
        duration: "20 min",
      },
    ],
    quiz: [
      { q: "Which wave is typically the longest and strongest?", opts: ["Wave 1", "Wave 2", "Wave 3", "Wave 5"], a: 2 },
      { q: "Wave 2 can retrace a maximum of:", opts: ["50% of Wave 1", "61.8% of Wave 1", "99% of Wave 1", "100% of Wave 1"], a: 2 },
      { q: "After a 5-wave impulse, price corrects in:", opts: ["Another 5-wave structure", "A 3-wave ABC correction", "A 7-wave structure", "A sideways range only"], a: 1 },
      { q: "The most common Wave 3 Fibonacci extension is:", opts: ["127.2%", "161.8%", "50%", "38.2%"], a: 1 },
      { q: "What does RSI divergence in Wave 5 typically signal?", opts: ["Wave 3 is beginning", "The impulse is ending", "Wave 2 is occurring", "Strong momentum continues"], a: 1 },
      { q: "Wave 4 cannot:", opts: ["Be a zigzag", "Retrace 38.2% of Wave 3", "Enter Wave 1's price territory", "Last longer than Wave 2"], a: 2 },
    ],
  },
  {
    module: "Module 5",
    title: "Risk & Trade Management",
    icon: "⚖️",
    duration: "60 min",
    xp: 250,
    color: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30",
    accent: "text-amber-400",
    lessons: [
      {
        title: "Position Sizing Formula",
        content: `Position sizing is the single most important factor in your long-term survival as a trader.

**The 1-2% Rule:**
Never risk more than 1-2% of your total trading capital on a single trade.

**Formula:**
\`\`\`
Risk Amount ($) = Account Balance × Risk Percentage
Position Size = Risk Amount ÷ (Entry Price - Stop Loss Price)
\`\`\`

**Example:**
• Account: $10,000
• Risk: 1% = $100
• Entry: BTC at $40,000
• Stop: $39,000 (difference = $1,000)
• Position Size = $100 ÷ $1,000 = 0.1 BTC

**Why this matters:**
Even with a 50% win rate and 2:1 R:R, if you risk 1% per trade and win 50 out of 100 trades:
• 50 wins × 2% = +100%
• 50 losses × 1% = -50%
• Net result: +50% on your account

Increase risk to 10% per trade and a 10-trade losing streak destroys 65% of your account.

**Compounding:** As your account grows, your position size grows proportionally. Don't risk a fixed dollar amount — use percentage.`,
        duration: "14 min",
      },
      {
        title: "Stop-Loss Placement Strategies",
        content: `A stop-loss is not optional — it's the most important part of any trade.

**Structure-based stops (recommended):**
Place stops BEYOND a significant market structure level that would INVALIDATE your trade setup.

• For a long: Stop below the previous Higher Low or below the Order Block
• For a short: Stop above the previous Lower High or above the Order Block

**ATR-based stops:**
Average True Range (ATR) measures average daily price movement.
Stop = Entry ± (1.5 × ATR)
Pros: accounts for market volatility automatically
Cons: may not align with market structure

**Common stop-loss mistakes:**
1. **Too tight** — gets triggered by normal price noise before your idea plays out
2. **Too wide** — requires too large a risk % to have meaningful position size
3. **Moving stops** — moving a stop further away from entry "because price is near" is adding risk, not managing it
4. **No stop at all** — a guaranteed way to blow your account

**Stop-loss types:**
• Hard stop: automatic order on exchange
• Mental stop: manually close when price reaches level (NOT recommended for beginners — emotion interferes)
• Trailing stop: moves with price to lock in profits`,
        duration: "14 min",
      },
      {
        title: "Risk:Reward Ratios & Expectancy",
        content: `Knowing your Risk:Reward (R:R) ratio determines whether a strategy is profitable long-term, regardless of win rate.

**Risk:Reward Ratio:**
How much you stand to gain vs how much you risk.
• 1:2 R:R = risk $100 to make $200
• 1:3 R:R = risk $100 to make $300

**Minimum acceptable R:R: 1:2**
Anything below 1:2 requires a very high win rate to be profitable.

**Expectancy formula:**
\`\`\`
Expectancy = (Win Rate × Average Win) - (Loss Rate × Average Loss)
\`\`\`

**Example (50% win rate, 1:2 R:R):**
• Expectancy = (0.5 × 2R) - (0.5 × 1R) = 1R - 0.5R = +0.5R per trade
• On 100 trades risking $100 each = +$5,000 expected

**Example (35% win rate, 1:3 R:R):**
• Expectancy = (0.35 × 3R) - (0.65 × 1R) = 1.05R - 0.65R = +0.4R
• Still profitable! You can lose 65% of your trades and still make money.

**Key insight:** A high win rate doesn't mean profitability. Many traders with 70% win rates lose money because their average loss is 3x their average win.`,
        duration: "14 min",
      },
      {
        title: "Trade Journaling",
        content: `A trade journal is the most powerful tool for improvement. Every professional trader keeps one.

**What to record for every trade:**
• Date & time
• Asset (BTC/USDT, EUR/USD, etc.)
• Direction (Long/Short)
• Entry price, stop-loss, take-profit
• Position size & amount risked ($, %)
• Reason for entry (setup type, indicator signals, confluence)
• Chart screenshot at entry
• Result (win/loss, actual P&L)
• Post-trade review: What went right? What went wrong? Would you take this trade again?

**Weekly review questions:**
1. What was my win rate this week?
2. What was my average R:R?
3. Did I follow my trading plan? If not, why?
4. What setup performed best? Worst?
5. How was my emotional state? Did I overtrade?

**The power of journaling:**
After 50+ trades, patterns emerge. You might find you're profitable in trending markets but lose money in ranges. Or that your 4H setups outperform your 1H setups. You can't discover these patterns without data.

**Digital tools:** Notion, Excel/Google Sheets, or dedicated apps like TraderVue or Edgewonk.`,
        duration: "10 min",
      },
    ],
    quiz: [
      { q: "If your account is $10,000 and you risk 1%, your maximum loss per trade is:", opts: ["$100", "$500", "$1,000", "$200"], a: 0 },
      { q: "What is the minimum recommended Risk:Reward ratio?", opts: ["1:1", "1:2", "1:5", "2:1"], a: 1 },
      { q: "Structure-based stop-loss means:", opts: ["Using ATR to calculate stop distance", "Placing stop beyond a market structure level", "Always using 50 pips stop", "Using the previous day's low"], a: 1 },
      { q: "With a 35% win rate, a 1:3 R:R strategy is:", opts: ["Losing", "Profitable", "Break-even", "Too risky"], a: 1 },
      { q: "What does a trade journal help you discover?", opts: ["The next price direction", "Patterns in your trading performance", "Which exchange has best fees", "The best assets to trade"], a: 1 },
    ],
  },
  {
    module: "Module 6",
    title: "Algorithmic Strategy & U2Algo",
    icon: "🤖",
    duration: "90 min",
    xp: 500,
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/30",
    accent: "text-emerald-400",
    lessons: [
      {
        title: "What Is a Trading Algorithm?",
        content: `A trading algorithm is a set of rules that automatically executes trades when specific conditions are met — without human emotion or hesitation.

**Why algorithms outperform humans:**
• No fear or greed — executes rules mechanically
• Can monitor 100+ assets simultaneously
• Never misses a setup due to sleep or distraction
• Backtestable — you can verify how it would have performed historically

**Types of algorithmic strategies:**
1. **Trend following** — enter when MA crosses, ride the trend
2. **Mean reversion** — buy when price is "too far" below average, sell when too far above
3. **Breakout** — enter when price breaks key levels with volume
4. **Arbitrage** — exploit price differences between exchanges
5. **Signal-based (like U2Algo)** — AI analyses multiple indicators and generates confluence-based signals

**The backtest trap:**
Backtesting on historical data is essential but can be misleading. Pitfalls:
• Over-optimization ("curve fitting") — rules that fit past data perfectly but fail going forward
• Look-ahead bias — accidentally using future data in calculations
• Ignoring slippage and fees

**U2Algo's approach:** Combines Elliott Wave analysis, market structure, and AI to generate signals — no single indicator dependency.`,
        duration: "20 min",
      },
      {
        title: "How U2Algo AI Swarm Works",
        content: `U2Algo uses a "swarm intelligence" architecture — multiple specialized AI agents working together, each analyzing a different aspect of the market.

**The Swarm Agents:**
• 🌊 **Wave Agent** — Counts Elliott Wave structure on multiple timeframes
• 🧱 **Structure Agent** — Identifies market structure, Order Blocks, FVGs
• 📊 **Indicator Agent** — Analyzes RSI, MACD, Moving Averages
• 🎯 **Signal Agent** — Combines all inputs and generates trade signals
• ⚖️ **Risk Agent** — Calculates optimal position sizing and R:R

**Signal Generation Process:**
1. Wave Agent identifies current wave count and expected next move
2. Structure Agent confirms OB/FVG zones align with wave targets
3. Indicator Agent checks for RSI divergence and MA alignment
4. Signal Agent votes: minimum 3/5 agents must agree for a signal
5. Risk Agent calculates entry, stop, and multiple take-profit targets

**Signal output includes:**
• Direction (Long/Short)
• Entry zone
• Stop-loss level
• TP1 (50% position close), TP2 (30%), TP3 (20%)
• Confidence level (%)
• Wave count summary
• Key invalidation level`,
        duration: "20 min",
      },
      {
        title: "Backtesting: Reading the Results",
        content: `U2Algo's backtest engine lets you test how a strategy would have performed on historical data.

**Key backtest metrics:**

| Metric | Description | Good Value |
|--------|-------------|------------|
| Win Rate | % of profitable trades | >40% (with 1:2+ R:R) |
| Profit Factor | Gross profit / Gross loss | >1.5 |
| Max Drawdown | Largest peak-to-trough decline | <20% |
| Sharpe Ratio | Risk-adjusted return | >1.0 |
| Total Trades | Sample size | >50 |
| Expectancy | Average $ per trade | Positive |

**Running a backtest on U2Algo:**
1. Navigate to the Backtest page
2. Select asset (BTC/USDT, ETH/USDT, etc.)
3. Choose timeframe and date range
4. Select indicator combination (SMA, RSI, Elliott Wave)
5. Set risk parameters (stop-loss %, position size)
6. Click Run — results appear within seconds

**Interpreting equity curve:**
• Smooth upward slope = consistent strategy
• Large drawdowns = too much risk or poor timing
• Flat periods = strategy not suited for ranging markets

**Paper trading vs Live:**
Always validate a backtest strategy with paper trading (real conditions, fake money) for at least 2-3 months before going live.`,
        duration: "20 min",
      },
      {
        title: "Live Trading: Signal to Execution",
        content: `You've learned the theory. Now let's walk through a complete trade from U2Algo signal to execution.

**Step 1: Receive Signal**
U2Algo generates a Long signal on BTC/USDT:
• Entry zone: $42,000 - $42,500
• Stop-loss: $40,800
• TP1: $45,000 | TP2: $48,000 | TP3: $52,000

**Step 2: Personal Validation**
Before entering, check:
□ Does this align with my higher timeframe view?
□ Is my daily risk budget available? (not already at max risk)
□ Is there a major news event in the next few hours?
□ Do I see the OB/FVG zone myself on the chart?

**Step 3: Calculate Position Size**
Account: $5,000 | Risk: 1% = $50
Entry: $42,000 | Stop: $40,800 | Difference: $1,200
Position = $50 ÷ $1,200 = 0.0417 BTC

**Step 4: Place Orders**
• Limit buy order at $42,250 (middle of entry zone)
• Stop-loss order at $40,750 (slightly below signal level for spread)
• TP1 sell order: 50% position at $45,000
• TP2 sell order: 30% position at $48,000
• Remaining 20%: trail stop

**Step 5: Manage & Journal**
• Don't watch every tick — trust the plan
• Record the trade in your journal
• Review outcome against signal within 1 week

**The golden rule:** If price hits your stop, it's not a failure — it's the cost of doing business. Review, learn, move forward.

🎓 **Congratulations! You've completed Trading School.**`,
        duration: "18 min",
      },
    ],
    quiz: [
      { q: "What advantage do trading algorithms have over humans?", opts: ["They guarantee profit", "They execute without emotion", "They never need updating", "They can predict the future"], a: 1 },
      { q: "U2Algo generates a signal when:", opts: ["Any one indicator shows a signal", "At least 3/5 agents agree", "Price hits a round number", "RSI is overbought"], a: 1 },
      { q: "What is the 'Profit Factor' metric?", opts: ["Total profit in dollars", "Gross profit divided by gross loss", "Win rate percentage", "Maximum drawdown"], a: 1 },
      { q: "Before going live, you should paper trade for:", opts: ["1 day", "1 week", "2-3 months", "1 year minimum"], a: 2 },
      { q: "If your stop-loss is hit, you should:", opts: ["Double down to recover", "Quit trading for the day", "Record it in your journal and move on", "Widen your stop next time"], a: 2 },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Quiz component                                                      */
/* ------------------------------------------------------------------ */

function ModuleQuiz({ quiz, onPass }: { quiz: typeof CURRICULUM[0]["quiz"]; onPass: () => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = quiz.filter((q, i) => answers[i] === q.a).length;
  const passed = score >= Math.ceil(quiz.length * 0.6);

  const submit = () => {
    setSubmitted(true);
    if (passed) setTimeout(onPass, 1000);
  };

  return (
    <div className="mt-6 space-y-5">
      <h3 className="text-base font-bold text-white">📝 Module Quiz</h3>
      {quiz.map((q, qi) => (
        <div key={qi} className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
          <p className="text-sm font-medium text-slate-200 mb-3">{qi + 1}. {q.q}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {q.opts.map((opt, oi) => {
              let cls = "px-3 py-2 rounded-lg text-xs font-medium border transition-all text-left ";
              if (!submitted) {
                cls += answers[qi] === oi
                  ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-300"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10";
              } else {
                if (oi === q.a) cls += "border-emerald-500 bg-emerald-500/20 text-emerald-300";
                else if (oi === answers[qi] && oi !== q.a) cls += "border-rose-500 bg-rose-500/20 text-rose-300";
                else cls += "border-white/5 bg-white/5 text-slate-500";
              }
              return (
                <button key={oi} disabled={submitted} onClick={() => setAnswers({ ...answers, [qi]: oi })} className={cls}>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!submitted ? (
        <button
          onClick={submit}
          disabled={Object.keys(answers).length < quiz.length}
          className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Quiz
        </button>
      ) : (
        <div className={`rounded-xl p-4 text-center border ${passed ? "border-emerald-500/30 bg-emerald-500/10" : "border-rose-500/30 bg-rose-500/10"}`}>
          <p className={`font-bold text-lg ${passed ? "text-emerald-400" : "text-rose-400"}`}>
            {passed ? "🎉 Passed!" : "Try Again"}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {score}/{quiz.length} correct {passed ? "— Module Complete!" : "— Need 60% to pass"}
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Lesson viewer                                                       */
/* ------------------------------------------------------------------ */

function LessonView({ lesson, onBack }: { lesson: typeof CURRICULUM[0]["lessons"][0]; onBack: () => void }) {
  return (
    <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-6 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-white">{lesson.title}</h4>
        <button onClick={onBack} className="text-xs text-slate-400 hover:text-white border border-white/10 rounded-lg px-3 py-1 transition-colors">
          ← Back
        </button>
      </div>
      <div className="prose prose-invert prose-sm max-w-none">
        {lesson.content.split("\n\n").map((para, i) => (
          <p key={i} className="text-slate-300 text-sm leading-relaxed mb-4 whitespace-pre-line">
            {para}
          </p>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-4">🕐 {lesson.duration} read</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Module card                                                         */
/* ------------------------------------------------------------------ */

function ModuleCard({ mod, index }: { mod: typeof CURRICULUM[0]; index: number }) {
  const [open, setOpen] = useState(false);
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [completed, setCompleted] = useState(false);

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${mod.border} bg-slate-900/60`}>
      {/* Module header — always visible */}
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setActiveLesson(null); setShowQuiz(false); }}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/3 transition-colors"
      >
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mod.color} border ${mod.border} flex items-center justify-center text-xl shrink-0`}>
          {mod.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold uppercase tracking-wider ${mod.accent}`}>{mod.module}</p>
          <h3 className="text-base font-bold text-white leading-tight mt-0.5">{mod.title}</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-slate-500">🕐 {mod.duration}</span>
            <span className="text-xs text-slate-500">⚡ +{mod.xp} XP</span>
            <span className="text-xs text-slate-500">{mod.lessons.length} lessons</span>
            {completed && <span className="text-xs text-emerald-400 font-semibold">✅ Complete</span>}
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-white/5 p-5">
          {activeLesson !== null ? (
            <LessonView lesson={mod.lessons[activeLesson]} onBack={() => setActiveLesson(null)} />
          ) : showQuiz ? (
            <ModuleQuiz quiz={mod.quiz} onPass={() => { setCompleted(true); setShowQuiz(false); }} />
          ) : (
            <div className="space-y-2">
              {mod.lessons.map((lesson, li) => (
                <button
                  key={li}
                  onClick={() => setActiveLesson(li)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/8 hover:border-white/10 transition-all text-left"
                >
                  <div className={`w-6 h-6 rounded-full border ${mod.border} flex items-center justify-center text-xs font-bold ${mod.accent} shrink-0`}>
                    {li + 1}
                  </div>
                  <span className="flex-1 text-sm text-slate-300">{lesson.title}</span>
                  <span className="text-xs text-slate-500">{lesson.duration}</span>
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}

              <button
                onClick={() => setShowQuiz(true)}
                className={`w-full mt-3 py-3 rounded-xl border font-semibold text-sm transition-all ${
                  completed
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : `border ${mod.border} bg-gradient-to-br ${mod.color} ${mod.accent} hover:opacity-90`
                }`}
              >
                {completed ? "✅ Module Completed" : "Take Module Quiz →"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                           */
/* ------------------------------------------------------------------ */

export default function SchoolPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      {/* Header */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-slate-950 to-blue-900/20 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 py-16">
          <Link
            href="/education"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Education Hub
          </Link>
          <div className="flex items-start gap-5 mb-6">
            <span className="text-5xl">🏫</span>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Trading School</h1>
              <p className="text-slate-400 mt-2 max-w-xl">
                A structured, self-paced curriculum covering everything from chart basics to AI-powered algorithmic strategy.
                Six modules, 22 lessons, quizzes, and a certificate.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { label: "Modules", value: "6" },
              { label: "Lessons", value: "22" },
              { label: "Total Time", value: "~7 hrs" },
              { label: "Price", value: "Free" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm">
                <span className="text-cyan-400 font-bold">{stat.value}</span>
                <span className="text-slate-400">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="space-y-4">
          {CURRICULUM.map((mod, i) => (
            <ModuleCard key={mod.module} mod={mod} index={i} />
          ))}
        </div>
      </section>

      {/* Certificate CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/20 border border-cyan-500/20 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">🎓</div>
          <h2 className="text-xl font-bold text-white mb-2">Earn Your Certificate</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            Complete all six modules and pass each quiz to receive your U2Algo Trading School
            certificate — shareable on LinkedIn.
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Create Free Account →
          </Link>
        </div>
      </section>
    </div>
  );
}
