import axios from "axios";

const API_URL = "http://localhost:8080/api/stories";
export const getNewsStories = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const generateNewsVideo = async (topic) => {
  const response = await axios.post(`${API_URL}/generate`, { topic });
  return response.data;
};
