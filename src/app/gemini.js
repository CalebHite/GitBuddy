import { GoogleGenerativeAI } from "@google/generative-ai";
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY; 

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ 
	model: "gemini-1.5-flash",
   systemInstruction: "Summarize the code, focus on succinctness and the impact of the code.",
   temperature: 2,
 });

 async function generateSummary(data){
    prompt = JSON.stringify(data);
    const response = await model.generateContent(prompt);
    const result = response.response.text();
    return result;
  }

  export { generateSummary };