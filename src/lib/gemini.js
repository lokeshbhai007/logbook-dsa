
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function getLeetCodeTitle(questionNumber) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `What is the exact title of LeetCode problem number ${questionNumber}? Please respond with only the problem title, nothing else.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const title = response.text().trim();
    
    return title;
  } catch (error) {
    console.error('Error fetching from Gemini:', error);
    throw new Error('Failed to fetch problem title');
  }
}