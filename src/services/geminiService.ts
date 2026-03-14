import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateInterviewAnswer(question: string, context: string = "general") {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert interview coach. Provide a clear, concise, and professional answer to the following interview question. 
      The answer should be structured for a candidate to speak naturally. 
      Use bullet points for key points if helpful. 
      Keep it under 150 words.
      Context: ${context}
      
      Question: ${question}`,
      config: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      },
    });

    return response.text || "I'm sorry, I couldn't generate an answer at this moment.";
  } catch (error) {
    console.error("Error generating answer:", error);
    return "Error: Failed to generate AI response. Please check your connection or API key.";
  }
}
