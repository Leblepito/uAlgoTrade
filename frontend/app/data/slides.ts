
export interface Slide {
    id: number;
    title_mm: string;
    title_en: string;
    content_mm: string[];
    content_en: string[];
    image_prompt: string; // GÃ¶rsel Ã¼retirken kullanacaÄŸÄ±n prompt
    image_src?: string;   // ÃœrettiÄŸin gÃ¶rselin yolu (Ã¶rn: '/assets/slide1.png')
}

export const slides: Slide[] = [
    {
        id: 0,
        title_mm: "á€™á€„á€ºá€¹á€‚á€œá€¬á€•á€«! á€€á€¯á€”á€ºá€á€½á€šá€ºá€›á€±á€¸ á€á€°á€›á€²á€€á€±á€¬á€„á€ºá€¸á€œá€±á€¸á€›á€±!",
        title_en: "Hello! Little Trading Hero!",
        content_mm: [
            "á€’á€®á€”á€±á€·á€™á€¾á€¬ á€á€¬á€¸/á€á€™á€®á€¸á€á€­á€¯á€·á€Ÿá€¬ 'á€ˆá€±á€¸á€€á€½á€€á€º' á€œá€­á€¯á€·á€á€±á€«á€ºá€á€²á€· á€™á€¾á€±á€¬á€ºá€†á€”á€ºá€á€²á€· á€€á€™á€¹á€˜á€¬á€€á€¼á€®á€¸á€€á€­á€¯ á€…á€°á€¸á€…á€™á€ºá€¸á€œá€±á€·á€œá€¬á€€á€¼á€™á€šá€ºá‹",
            "á€…á€Šá€ºá€¸á€€á€™á€ºá€¸ (áƒ) á€á€¯á€›á€¾á€­á€á€šá€ºá€”á€±á€¬á€º:",
            "á. á€˜á€šá€ºá€˜á€€á€ºá€™á€¾á€¬ á€™á€¼á€”á€ºá€™á€¬á€…á€¬á€€á€­á€¯ á€–á€á€ºá€™á€šá€ºá‹",
            "á‚. á€Šá€¬á€˜á€€á€ºá€™á€¾á€¬ á€¡á€„á€ºá€¹á€‚á€œá€­á€•á€ºá€…á€¬á€€á€­á€¯ á€€á€¼á€Šá€·á€ºá€™á€šá€ºá‹",
            "áƒ. á€”á€¬á€¸á€™á€œá€Šá€ºá€á€¬á€›á€¾á€­á€›á€„á€º 'á€™á€±á€¸á€á€½á€”á€ºá€¸á€…á€¬á€¡á€¯á€•á€º' á€™á€¾á€¬ á€™á€±á€¸á€™á€šá€ºá‹"
        ],
        content_en: [
            "Today, we will explore a magical world called the 'Market'.",
            "There are 3 rules on this journey:",
            "1. Read the Myanmar text on the left.",
            "2. Look at the English text on the right.",
            "3. If you don't understand, ask in the 'Question Notebook'."
        ],
        image_prompt: "A cute cartoon Myanmar boy and girl standing in front of a magical golden gate labeled 'Market'. Friendly style, vibrant colors."
    },
    {
        id: 1,
        title_mm: "á€€á€»á€½á€”á€ºá€á€±á€¬á€ºá€á€­á€¯á€·á€›á€²á€· á€á€›á€®á€¸á€…á€‰á€ºá€™á€¼á€±á€•á€¯á€¶",
        title_en: "Our Journey Map",
        content_mm: [
            "á. á€ˆá€±á€¸á€€á€½á€€á€ºá€†á€­á€¯á€á€¬ á€˜á€¬á€œá€²? (á€•á€”á€ºá€¸á€á€®á€¸á€”á€²á€· á€¡á€›á€¯á€•á€ºá€™á€»á€¬á€¸)",
            "á‚. á€’á€…á€ºá€‚á€»á€…á€ºá€á€šá€º á€•á€­á€¯á€€á€ºá€†á€¶ (á€€á€½á€”á€ºá€•á€»á€°á€á€¬á€‘á€²á€€ á€›á€½á€¾á€±á€’á€„á€ºá€¹á€‚á€«á€¸á€™á€»á€¬á€¸)",
            "áƒ. á€ˆá€±á€¸á€€á€½á€€á€ºá€œá€¾á€­á€¯á€„á€ºá€¸á€™á€»á€¬á€¸ (á€•á€„á€ºá€œá€šá€ºá€œá€¾á€­á€¯á€„á€ºá€¸á€á€½á€±á€œá€­á€¯á€•á€²)",
            "á„. á€˜á€®á€œá€°á€¸á€á€¼á€±á€›á€¬á€™á€»á€¬á€¸ (Order Blocks)",
            "á…. á€•á€»á€¬á€¸á€›á€Šá€ºá€¡á€­á€¯á€¸á€‘á€±á€¬á€„á€ºá€á€»á€±á€¬á€€á€º (Liquidity)"
        ],
        content_en: [
            "1. What is a Market? (Apples and Toys)",
            "2. Digital Money (Gold Coins inside the Computer)",
            "3. Market Waves (Just like Sea Waves)",
            "4. The Bilu's Footprints (Order Blocks)",
            "5. The Honey Pot Trap (Liquidity)"
        ],
        image_prompt: "A treasure map style illustration showing a path through a magical forest, a river, and a mountain. Cute icons for each stop."
    },
    {
        id: 2,
        title_mm: "á€ˆá€±á€¸á€€á€½á€€á€ºá€†á€­á€¯á€á€¬ á€˜á€¬á€œá€²?",
        title_en: "What is a Market?",
        content_mm: [
            "á€á€¬á€¸/á€á€™á€®á€¸á€á€­á€¯á€· á€¡á€™á€±á€”á€²á€·á€¡á€á€° á€ˆá€±á€¸á€á€½á€¬á€¸á€–á€°á€¸á€œá€¬á€¸?",
            "á€¡á€²á€’á€®á€™á€¾á€¬ á€œá€°á€á€½á€±á€€ á€Ÿá€„á€ºá€¸á€á€®á€¸á€Ÿá€„á€ºá€¸á€›á€½á€€á€ºá€á€½á€±áŠ á€™á€¯á€”á€·á€ºá€á€½á€± á€›á€±á€¬á€„á€ºá€¸á€€á€¼á€á€šá€ºáŠ á€á€á€»á€­á€¯á€·á€€ á€á€šá€ºá€€á€¼á€á€šá€ºá€œá€±á‹",
            "á€€á€¯á€”á€ºá€á€½á€šá€ºá€á€¼á€„á€ºá€¸ (Trading) á€†á€­á€¯á€á€¬á€œá€Šá€ºá€¸ á€¡á€á€°á€á€°á€•á€«á€•á€²á‹ á€’á€«á€•á€±á€™á€²á€· á€’á€®á€™á€¾á€¬á€á€±á€¬á€· á€•á€”á€ºá€¸á€á€®á€¸á€¡á€…á€¬á€¸ 'á€€á€¯á€™á€¹á€•á€á€® á€¡á€…á€­á€á€ºá€¡á€•á€­á€¯á€„á€ºá€¸á€œá€±á€¸á€á€½á€±' á€€á€­á€¯ á€á€šá€ºá€€á€¼á€á€¬á€•á€«á‹"
        ],
        content_en: [
            "Have you ever been to the market with your mom?",
            "There, people sell vegetables and snacks, and some people buy them.",
            "Trading is exactly the same. But here, instead of apples, people buy 'small parts of companies'."
        ],
        image_prompt: "A bustling traditional Myanmar market scene with cute animals buying and selling fruits. Bright and happy atmosphere."
    },
    {
        id: 3,
        title_mm: "á€á€¶á€…á€¬á€¸á€á€»á€€á€ºá€™á€®á€¸á€–á€­á€¯á€™á€»á€¬á€¸ (Candlesticks)",
        title_en: "Mood Candles (Candlesticks)",
        content_mm: [
            "á€€á€­á€”á€ºá€¸á€á€­á€¯á€„á€ºá€á€½á€±á€Ÿá€¬ 'á€á€¶á€…á€¬á€¸á€á€»á€€á€ºá€™á€®á€¸á€–á€­á€¯' á€œá€­á€¯á€™á€»á€­á€¯á€¸á€•á€«á‹",
            "á€¡á€…á€­á€™á€ºá€¸á€›á€±á€¬á€„á€ºá€™á€®á€¸á€–á€­á€¯ = á€•á€»á€±á€¬á€ºá€›á€½á€¾á€„á€ºá€™á€¾á€¯ (á€ˆá€±á€¸á€”á€¾á€¯á€”á€ºá€¸á€á€€á€ºá€”á€±á€á€šá€º)á‹ ğŸ˜Š",
            "á€¡á€”á€®á€›á€±á€¬á€„á€ºá€™á€®á€¸á€–á€­á€¯ = á€á€™á€ºá€¸á€”á€Šá€ºá€¸á€™á€¾á€¯ (á€ˆá€±á€¸á€”á€¾á€¯á€”á€ºá€¸á€€á€»á€”á€±á€á€šá€º)á‹ ğŸ˜¢"
        ],
        content_en: [
            "Candlesticks are like 'Mood Candles'.",
            "Green Candle = Happy (Prices are going up). ğŸ˜Š",
            "Red Candle = Sad (Prices are going down). ğŸ˜¢"
        ],
        image_prompt: "Two cute candles with faces: one Green and smiling (happy), one Red and frowning (sad). Simple background."
    },
    {
        id: 4,
        title_mm: "á€œá€™á€ºá€¸á€€á€¼á€±á€¬á€„á€ºá€¸á€™á€»á€¬á€¸ (Trends)",
        title_en: "The River Flow (Trends)",
        content_mm: [
            "á€œá€™á€ºá€¸á€€á€¼á€±á€¬á€„á€ºá€¸á€á€½á€±á€Ÿá€¬ á€§á€›á€¬á€á€á€®á€™á€¼á€…á€ºá€›á€²á€· á€…á€®á€¸á€†á€„á€ºá€¸á€™á€¾á€¯á€œá€­á€¯á€™á€»á€­á€¯á€¸á€•á€«á‹",
            "á€á€€á€ºá€œá€™á€ºá€¸á€€á€¼á€±á€¬á€„á€ºá€¸: á€™á€¼á€…á€ºá€›á€± á€á€€á€ºá€”á€±á€á€šá€ºá‹ (á€¡á€•á€±á€«á€ºá€€á€­á€¯ á€€á€°á€¸á€á€á€ºá€•á€«)",
            "á€€á€»á€œá€™á€ºá€¸á€€á€¼á€±á€¬á€„á€ºá€¸: á€™á€¼á€…á€ºá€›á€± á€†á€„á€ºá€¸á€”á€±á€á€šá€ºá‹ (á€¡á€±á€¬á€€á€ºá€€á€­á€¯ á€œá€­á€¯á€€á€ºá€•á€«)",
            "á€™á€¼á€…á€ºá€›á€±á€…á€®á€¸á€†á€„á€ºá€¸á€™á€¾á€¯á€€á€­á€¯ á€˜á€šá€ºá€á€±á€¬á€·á€™á€¾ á€™á€†á€”á€·á€ºá€€á€»á€„á€ºá€•á€«á€”á€²á€·!"
        ],
        content_en: [
            "Trends are like the flow of the Irrawaddy River.",
            "Uptrend: The river flows uphill. (Swim up)",
            "Downtrend: The river flows downhill. (Float down)",
            "Never swim against the river flow!"
        ],
        image_prompt: "A wide river (Irrawaddy) flowing through a landscape. Little boats floating with the current. Arrows showing direction."
    },
    {
        id: 5,
        title_mm: "á€á€«á€¸á€á€¼á€¶á€…á€Šá€ºá€¸á€›á€­á€¯á€¸ (Support & Resistance)",
        title_en: "Bamboo Fence (Support & Resistance)",
        content_mm: [
            "á€‘á€±á€¬á€€á€ºá€á€¶á€™á€¾á€¯ (Support) = á€€á€¼á€™á€ºá€¸á€•á€¼á€„á€ºá‹ á€•á€¼á€¯á€á€ºá€€á€»á€›á€„á€º á€á€¶á€•á€±á€¸á€á€šá€ºá‹",
            "á€†á€”á€·á€ºá€€á€»á€„á€ºá€™á€¾á€¯ (Resistance) = á€á€«á€¸á€á€¼á€¶á€…á€Šá€ºá€¸á€›á€­á€¯á€¸á‹ á€¡á€•á€±á€«á€ºá€á€€á€ºá€›á€„á€º á€á€±á€«á€„á€ºá€¸á€”á€²á€·á€á€­á€¯á€€á€ºá€™á€­á€á€šá€ºá‹",
            "á€á€«á€¸á€á€¼á€¶á€…á€Šá€ºá€¸á€›á€­á€¯á€¸á€€á€»á€­á€¯á€¸á€á€½á€¬á€¸á€›á€„á€ºáŠ á€”á€½á€¬á€¸á€œá€±á€¸á€á€½á€± á€œá€½á€á€ºá€œá€•á€ºá€…á€½á€¬ á€•á€¼á€±á€¸á€‘á€½á€€á€ºá€á€½á€¬á€¸á€”á€­á€¯á€„á€ºá€á€šá€º!"
        ],
        content_en: [
            "Support = The Floor. It catches you if you fall.",
            "Resistance = The Bamboo Fence. You hit your head if you jump.",
            "If the fence breaks, the little cows can run free!"
        ],
        image_prompt: "A cute cow trying to jump over a bamboo fence. Another cow standing safely on a wooden floor."
    },
    {
        id: 6,
        title_mm: "á€˜á€®á€œá€°á€¸á€á€¼á€±á€›á€¬ (Order Block)",
        title_en: "The Bilu's Footprint (Order Block)",
        content_mm: [
            "á€¡á€±á€¬á€ºá€’á€«á€˜á€œá€±á€¬á€·á€á€ºá€á€½á€±á€Ÿá€¬ á€˜á€®á€œá€°á€¸á€€á€¼á€®á€¸á€›á€²á€· á€á€¼á€±á€›á€¬á€œá€­á€¯á€™á€»á€­á€¯á€¸á€•á€«á‹",
            "á€˜á€®á€œá€°á€¸á€€ á€á€¼á€±á€á€»á€œá€­á€¯á€€á€ºá€›á€„á€º á€™á€¼á€±á€€á€¼á€®á€¸á€á€¯á€”á€ºá€á€½á€¬á€¸á€•á€¼á€®á€¸ á€á€¼á€±á€›á€¬á€€á€¼á€®á€¸ á€€á€»á€”á€ºá€á€²á€·á€á€šá€ºá‹",
            "á€ˆá€±á€¸á€”á€¾á€¯á€”á€ºá€¸á€€ á€¡á€²á€’á€®á€á€¼á€±á€›á€¬á€‘á€² á€•á€¼á€”á€ºá€›á€±á€¬á€€á€ºá€›á€„á€ºáŠ á€…á€•á€›á€­á€”á€ºá€œá€­á€¯á€™á€»á€­á€¯á€¸ á€•á€¼á€”á€ºá€€á€”á€ºá€á€€á€ºá€œá€­á€™á€·á€ºá€™á€šá€º!"
        ],
        content_en: [
            "Order Blocks are like the Giant's (Bilu) footprints.",
            "When the Giant steps, the ground shakes and leaves a mark.",
            "If price comes back to that footprint, it will bounce up like a spring!"
        ],
        image_prompt: "A friendly giant (Bilu) stepping on the ground, leaving a glowing magical footprint. Small traders looking at it in awe."
    },
    {
        id: 7,
        title_mm: "á€•á€»á€¬á€¸á€›á€Šá€ºá€¡á€­á€¯á€¸á€‘á€±á€¬á€„á€ºá€á€»á€±á€¬á€€á€º (Liquidity)",
        title_en: "The Honey Pot Trap (Liquidity)",
        content_mm: [
            "á€á€á€­á€‘á€¬á€¸! á€á€€á€ºá€á€¶á€€á€¼á€®á€¸á€á€½á€±á€€ á€•á€»á€¬á€¸á€›á€Šá€ºá€¡á€­á€¯á€¸ (á€•á€­á€¯á€€á€ºá€†á€¶) á€€á€­á€¯ á€á€…á€ºá€•á€„á€ºá€¡á€±á€¬á€€á€ºá€™á€¾á€¬ á€‘á€¬á€¸á€á€á€ºá€á€šá€ºá‹",
            "á€œá€±á€¬á€˜á€€á€¼á€®á€¸á€á€²á€· á€•á€»á€¬á€¸á€œá€±á€¸á€á€½á€±á€€ á€¡á€²á€’á€®á€€á€­á€¯ á€•á€¼á€±á€¸á€á€½á€¬á€¸á€›á€„á€º á€¡á€–á€™á€ºá€¸á€á€¶á€›á€™á€šá€ºá‹",
            "á€€á€»á€½á€”á€ºá€á€±á€¬á€ºá€á€­á€¯á€·á€€ á€á€€á€ºá€á€¶á€€á€¼á€®á€¸á€á€½á€± á€…á€¬á€¸á€•á€¼á€®á€¸á€™á€¾ á€€á€»á€”á€ºá€á€¬á€€á€­á€¯ á€šá€°á€€á€¼á€™á€šá€ºá‹"
        ],
        content_en: [
            "Watch out! The big bears put a Honey Pot (Money) under the tree.",
            "Greedy little bees run there and get caught.",
            "We will wait until the bears eat, then take what is left."
        ],
        image_prompt: "A honey pot glowing under a tree. A shadow of a bear waiting behind the tree. Cute bees flying around."
    },
    {
        id: 8,
        title_mm: "á€œá€¯á€¶á€á€¼á€¯á€¶á€›á€±á€¸á€¦á€¸á€‘á€¯á€•á€º (Stop Loss)",
        title_en: "The Safety Helmet (Stop Loss)",
        content_mm: [
            "Stop Loss á€Ÿá€¬ á€œá€¯á€¶á€á€¼á€¯á€¶á€›á€±á€¸á€¦á€¸á€‘á€¯á€•á€ºá€œá€­á€¯á€™á€»á€­á€¯á€¸á€•á€«á‹",
            "á€…á€€á€ºá€˜á€®á€¸á€…á€®á€¸á€›á€„á€º á€œá€²á€€á€»á€”á€­á€¯á€„á€ºá€á€šá€ºá‹ á€¦á€¸á€‘á€¯á€•á€ºá€™á€•á€«á€›á€„á€º á€á€±á€«á€„á€ºá€¸á€€á€½á€²á€™á€šá€ºá‹",
            "á€¦á€¸á€‘á€¯á€•á€ºá€•á€«á€›á€„á€ºá€á€±á€¬á€· á€–á€¯á€”á€ºá€á€«á€•á€¼á€®á€¸ á€•á€¼á€”á€ºá€‘á€”á€­á€¯á€„á€ºá€á€šá€º!",
            "á€¦á€¸á€‘á€¯á€•á€ºá€™á€•á€«á€˜á€² á€˜á€šá€ºá€á€±á€¬á€·á€™á€¾ á€™á€…á€®á€¸á€”á€²á€·!"
        ],
        content_en: [
            "Stop Loss is like a Safety Helmet.",
            "If you ride a bike, you might fall. No helmet = Big ouch.",
            "With a helmet = Dust off and ride again!",
            "Never ride without a helmet!"
        ],
        image_prompt: "A kid riding a bicycle with a cool safety helmet, giving a thumbs up. Background shows a safe path."
    }
];
