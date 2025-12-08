import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.API_KEY || ''; // Injected by environment

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey });

// Comprehensive Schema for Unified Intent Understanding
const intentSchema = {
  type: Type.OBJECT,
  properties: {
    intent: { 
      type: Type.STRING, 
      enum: ["SCHEDULE", "RESCHEDULE", "DELETE", "CHAT"],
      description: "Classify the user's intent. SCHEDULE for new tasks, RESCHEDULE to move/change existing ones, DELETE to remove, CHAT for general conversation."
    },
    taskDetails: {
      type: Type.OBJECT,
      description: "Details for SCHEDULE or RESCHEDULE intents.",
      properties: {
        title: { type: Type.STRING, description: "Title for new task. For RESCHEDULE/DELETE, this is the mapped full task name from context." },
        totalMinutes: { type: Type.INTEGER, description: "Total duration in minutes." },
        sessions: { type: Type.INTEGER, description: "Number of sessions." },
        deadline: { type: Type.STRING, description: "ISO 8601 date string for the deadline." },
        startDate: { type: Type.STRING, description: "ISO 8601 date string for when to START the task. Important for 'Move' or 'Reschedule' requests." },
        priority: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
        reasoning: { type: Type.STRING, description: "Short explanation of the plan." }
      }
    },
    chatResponse: { 
      type: Type.STRING, 
      description: "A friendly, natural language response to the user. Use this for CHAT intent or to explain actions." 
    }
  },
  required: ["intent", "chatResponse"]
};

export const processUserRequest = async (
  userMessage: string, 
  history: {role: string, parts: {text: string}[]}[],
  tasksContext: string, // "Task: Biology..."
  currentDate: string
) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Current Date/Time: ${currentDate}.
        User Request: "${userMessage}".
        
        CONTEXT - Existing Tasks & Schedule:
        ${tasksContext}

        INSTRUCTIONS:
        1. Analyze the user's request using the Current Date/Time as reference.
        2. Map abbreviations (e.g., "bio" -> "Biology", "calc" -> "Calculus") to the Existing Tasks.
        3. Determine the intent:
           - **SCHEDULE**: Create a NEW task.
           - **RESCHEDULE**: "Move", "Push", "Delay", or "Change" an EXISTING task. 
             - Put the EXACT full task name from Context in 'taskDetails.title'.
             - CALCULATE the new 'startDate' based on the request (e.g., "Move bio to Friday at 2pm" -> Calculate ISO string for next Friday 14:00 relative to Current Date).
             - If they say "Push back 2 hours", check the task's "Next Session" time in context and add 2 hours.
           - **DELETE**: Remove a task. Map to full task name.
           - **CHAT**: General questions.
        4. Return JSON fitting the schema.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: intentSchema,
        temperature: 0.1
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback for network or parsing errors
    return {
       intent: "CHAT",
       chatResponse: "I'm having trouble processing that request right now. Could you try rephrasing?"
    };
  }
};

// Kept for backward compatibility
export const getChatResponse = async (history: {role: string, parts: {text: string}[]}[], message: string) => {
     const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: history
     });
     const result = await chat.sendMessage({ message });
     return result.text;
}