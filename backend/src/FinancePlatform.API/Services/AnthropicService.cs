using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FinancePlatform.API.Services
{
    public class AnthropicService : IAIAgentService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly ILogger<AnthropicService> _logger;
        private const string ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

        public AnthropicService(HttpClient httpClient, IConfiguration configuration, ILogger<AnthropicService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _apiKey = configuration["AI:AnthropicApiKey"];

            if (string.IsNullOrEmpty(_apiKey))
            {
                _logger.LogWarning("Anthropic API Key is missing in configuration.");
            }
        }

        public async Task<string> GetResponseAsync(string userMessage, string marketContext = null)
        {
            var systemPrompt = @"
            You are a friendly, wise, and patient Trading Teacher for a 9-year-old child.
            Your name is 'Grandmaster Owl'.

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

            [Myanmar Answer]";

            if (!string.IsNullOrEmpty(marketContext))
            {
                systemPrompt += $"\n\nCURRENT MARKET CONTEXT:\n{marketContext}\nUse this real-time data to inform your answer.";
            }

            var requestBody = new
            {
                model = "claude-sonnet-4-5-20250929",
                max_tokens = 1024,
                system = systemPrompt,
                messages = new[]
                {
                    new { role = "user", content = userMessage }
                }
            };

            var requestMessage = new HttpRequestMessage(HttpMethod.Post, ANTHROPIC_API_URL);
            requestMessage.Headers.Add("x-api-key", _apiKey);
            requestMessage.Headers.Add("anthropic-version", "2023-06-01");
            requestMessage.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            try
            {
                var response = await _httpClient.SendAsync(requestMessage);
                response.EnsureSuccessStatusCode();

                var jsonResponse = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(jsonResponse);
                var content = doc.RootElement.GetProperty("content");
                
                foreach (var block in content.EnumerateArray())
                {
                    if (block.GetProperty("type").GetString() == "text")
                    {
                        return block.GetProperty("text").GetString();
                    }
                }
                
                return "Hoot! I couldn't find any words to say.";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error communicating with Anthropic API");
                return "Hoot! I'm having trouble flying to the library right now. Please check my API key!";
            }
        }

        public async Task<string> AnalyzeMarketAsync(string symbol)
        {
            // Placeholder: Logic to get specific analysis
            return await GetResponseAsync($"Tell me about {symbol} based on the current context.");
        }
    }
}
