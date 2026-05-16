const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { generateEmbedding } = require("./ingestionService");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const DB_PATH = path.join(__dirname, "../news_db.json");

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Retrieve relevant articles from local JSON DB
async function retrieveArticles(topic) {
  try {
    if (!fs.existsSync(DB_PATH)) {
      console.log("No database found. Run ingest first.");
      return [];
    }

    const database = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    if (database.length === 0) return [];

    const queryEmbedding = await generateEmbedding(topic);

    // Calculate similarity for all articles
    const scoredArticles = database.map(article => {
      const score = cosineSimilarity(queryEmbedding, article.embedding);
      return { ...article, score };
    });

    // Sort by descending score and take top 3
    scoredArticles.sort((a, b) => b.score - a.score);
    const topArticles = scoredArticles.slice(0, 3);

    return topArticles.map(a => a.content);
  } catch (error) {
    console.error("Error retrieving articles:", error);
    return [];
  }
}

// Generate broadcast script using Gemini
async function generateScript(topic, articlesTextList) {
  if (!articlesTextList || articlesTextList.length === 0) {
    return `Today in ${topic}, there is no new information to report. Stay tuned for more updates later.`;
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const combinedContext = articlesTextList.join("\n\n---\n\n");

  const prompt = `
    You are a professional news anchor reading the daily news.
    Given the following recent articles, write a concise, professional, and engaging 3-sentence broadcast script summarizing the latest news about "${topic}".
    Do not use any markdown, bullet points, or stage directions. Write it exactly as it should be read aloud by an avatar.
    
    Context articles:
    ${combinedContext}
  `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating script:", error);
    return "We are experiencing technical difficulties retrieving the news. Please check back later.";
  }
}

module.exports = { retrieveArticles, generateScript };
