/**
 * Crawler groups an author can toggle from settings.md:
 *
 *   robots:
 *     ai: false          # every agent in the ai group: Disallow: /
 *     images: false
 *     search: true
 *     all: true          # the `*` agent
 *     GPTBot: true       # one agent, overriding its group
 *
 * The AI list is the catch-all Sam asked for: it is long and it grows,
 * and nobody wants to maintain it in every settings.md. Names are the
 * agents' own spellings (robots.txt matching is case-insensitive, but
 * the file reads better with the real ones). Free of node builtins so a
 * settings panel can import it.
 */
const groups = {
  ai: [
    "GPTBot",
    "ChatGPT-User",
    "OAI-SearchBot",
    "ClaudeBot",
    "Claude-Web",
    "anthropic-ai",
    "Google-Extended",
    "Applebot-Extended",
    "CCBot",
    "Bytespider",
    "PerplexityBot",
    "Perplexity-User",
    "Amazonbot",
    "FacebookBot",
    "Meta-ExternalAgent",
    "Meta-ExternalFetcher",
    "cohere-ai",
    "Diffbot",
    "omgili",
    "omgilibot",
    "YouBot",
    "ImagesiftBot",
    "Timpibot",
    "PetalBot",
    "Kangaroo Bot",
    "AI2Bot",
    "Ai2Bot-Dolma",
    "DuckAssistBot",
    "MistralAI-User",
    "iaskspider/2.0",
    "ICC-Crawler",
    "img2dataset",
    "Webzio-Extended",
    "Scrapy"
  ],
  images: [
    "Googlebot-Image",
    "msnbot-media",
    "Baiduspider-image",
    "YandexImages"
  ],
  search: [
    "Googlebot",
    "Bingbot",
    "DuckDuckBot",
    "Baiduspider",
    "YandexBot",
    "Applebot",
    "Slurp"
  ],
  all: ["*"]
}

/**
 * What a settings.md that says nothing gets: AI training and image
 * crawlers kept out, search left alone. This is the file vowel wrote
 * before the setting existed, with the AI list filled in.
 */
const defaults = { ai: false, images: false }

export { groups, defaults }
