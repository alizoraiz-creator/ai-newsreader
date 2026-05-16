const Parser = require("rss-parser");
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const parser = new Parser();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const DB_PATH = path.join(__dirname, "../news_db.json");

const NEWS_SOURCES = [
  "http://feeds.bbci.co.uk/news/world/rss.xml",
  "http://feeds.bbci.co.uk/news/technology/rss.xml"
];

// Generate embedding for a given text
async function generateEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// Fetch and index news
async function ingestNews() {
  console.log("Starting news ingestion...");
  try {
    const database = [];

    for (const url of NEWS_SOURCES) {
      console.log(`Fetching RSS feed: ${url}`);
      const feed = await parser.parseURL(url);

      const items = feed.items.slice(0, 15);

      for (const item of items) {
        const textContent = `${item.title}. ${item.contentSnippet || item.content || ""}`;
        if (!textContent.trim()) continue;

        const embedding = await generateEmbedding(textContent);

        database.push({
          id: item.guid || item.link,
          title: item.title,
          link: item.link,
          content: textContent,
          embedding: embedding
        });
      }
    }
    
    // Save to local JSON file
    fs.writeFileSync(DB_PATH, JSON.stringify(database, null, 2));
    console.log(`News ingestion completed successfully! Saved ${database.length} articles to database.`);
  } catch (error) {
    console.error("Error during news ingestion:", error);
  }
}

module.exports = { ingestNews, generateEmbedding };
