const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';

export async function generateInterviewAnswer(question: string, context: string = "general") {
  try {
    console.log('Groq key prefix:', process.env.GROQ_API_KEY?.substring(0,20));
    console.log('Calling Groq with question:', question.substring(0,50) + '...');
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert interview coach. Provide a clear, concise, and professional answer to the following interview question. 
The answer should be structured for a candidate to speak naturally. 
Use bullet points for key points if helpful. 
Keep it under 150 words.
Context: ${context}`
          },
          {
            role: 'user',
            content: question
          }
        ],
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.log('Groq status:', response.status, 'error:', errText);
      throw new Error(`Groq API error: ${response.status} - ${errText.substring(0,100)}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "I'm sorry, I couldn't generate an answer at this moment.";
  } catch (error) {
    console.error("Full error:", error);
    return "Error: Failed to generate AI response. Please check your connection or API key.";
  }
}
