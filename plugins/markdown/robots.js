function generateRobots() {
  return `User-agent: Google-Extended
Allow: /

User-agent: Googlebot-Image
Disallow: /

User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /`
}

export default generateRobots
