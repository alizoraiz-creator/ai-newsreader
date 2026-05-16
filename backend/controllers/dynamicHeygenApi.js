require("dotenv").config();
const { retrieveArticles, generateScript } = require("../services/aiService");

exports.generateDynamicNews = async (req, res) => {
  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }

  try {
    console.log(`Generating news for topic: ${topic}`);
    
    // 1. Retrieve articles from ChromaDB
    const articles = await retrieveArticles(topic);
    
    // 2. Generate a broadcast script using Gemini
    const script = await generateScript(topic, articles);
    console.log("Generated Script:", script);

    // 3. Call HeyGen API to generate the video
    console.log("Calling HeyGen API...");
    const response = await fetch("https://api.heygen.com/v2/video/generate", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.HEYGEN_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_inputs: [
          {
            character: {
              type: "avatar",
              avatar_id: "Albert_public_1",
              avatar_style: "normal",
            },
            voice: {
              type: "text",
              input_text: script,
              voice_id: "f38a635bee7a4d1f9b0a654a31d050d2",
            },
            background: {
              type: "color",
              value: "#FAFAFA",
            },
          },
        ],
        dimension: {
          width: 1280,
          height: 720,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HeyGen API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Construct the response matching the frontend expectations
    // Heygen returns a video_id, but the actual URL might need to be fetched via status endpoint.
    // For now, based on the previous structure, we'll return a mock URL or the ID.
    // Note: To get the final video URL from Heygen, you usually have to poll a status endpoint with the video_id.
    // Assuming the frontend handles `heygen_response` to poll or play.
    res.json({
      id: Date.now(),
      title: `Latest on ${topic}`,
      abstract: script,
      heygen_response: data,
      url: "#"
    });

  } catch (err) {
    console.error("Error generating dynamic news:", err);
    res.status(500).json({ error: "Failed to generate dynamic news" });
  }
};

// Keep existing getStories for fallback/homepage
exports.getStories = require("./storiesController").getStories;
