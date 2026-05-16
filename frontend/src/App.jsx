import { useState, useEffect } from "react";
import { getNewsStories, generateNewsVideo } from "./api/axios";
import NewsCard from "./components/NewsCard";
import VideoPlayer from "./components/VideoPlayer";
import "./App.css";

const App = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStoryId, setActiveStoryId] = useState(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState(
    "https://app.heygen.com/embedded-player/dea35a42ff7f4220afdfdd53f5967239"
  );
  
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await getNewsStories();
        setStories(data);
      } catch (err) {
        setError("Failed to load news feed. Check API connection.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const handlePlay = (story) => {
    setActiveStoryId(story.id);
    setActiveVideoUrl(story.gcs_video_url || story.url || null); // fallback if heygen response isn't directly a url
  };

  const handleGenerateNews = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    try {
      const newStory = await generateNewsVideo(topic);
      setStories([newStory, ...stories]);
      handlePlay(newStory);
      setTopic("");
    } catch (err) {
      setError("Failed to generate dynamic news. " + (err.response?.data?.error || err.message));
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return <div className="loading">Loading news...</div>;

  return (
    <div className="dashboard">
      <header className="header">
        <h1>AI Newsreader & Journalist Platform</h1>
        <p>Top stories of the day — click 🔊 Play to listen.</p>
        
        <form onSubmit={handleGenerateNews} className="search-form" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <input 
            type="text" 
            placeholder="E.g., Space Exploration" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: '300px' }}
          />
          <button type="submit" disabled={isGenerating} style={{ padding: '10px 20px', borderRadius: '5px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
            {isGenerating ? "Generating..." : "Generate Custom News"}
          </button>
        </form>
        {error && <div className="error" style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
      </header>

      {/* Main Video Player */}
      <div className="video-player-wrapper">
        <VideoPlayer videoUrl={activeVideoUrl} />
      </div>

      <div className="video-thumbnails">
        {stories.map((story) => (
          <NewsCard
            key={story.id}
            story={story}
            isActive={story.id === activeStoryId}
            onPlay={() => handlePlay(story)}
          />
        ))}
      </div>
    </div>
  );
};

export default App;
