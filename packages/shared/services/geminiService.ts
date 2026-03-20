import { GoogleGenAI, Type } from "@google/genai";
import { MatchState, MatchFixture } from "../types";

// --- COACHING ---

export const getCoachInsights = async (matchState: MatchState, battingTeamName: string, bowlingTeamName: string) => {
  // Use API key exclusively from environment variable as per GenAI guidelines.
  // This also fixes type errors where 'gemini_api_key' was missing from wpApiSettings.
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return {
      analysis: "AI Coaching is disabled. Please configure process.env.API_KEY.",
      tactics: ["Ensure API Key is set in environment", "Stick to line and length", "Rotate the strike"],
      winProbability: 50
    };
  }

  // Create a new GoogleGenAI instance right before making an API call
  const ai = new GoogleGenAI({ apiKey });

  try {
    const currentOver = Math.floor(matchState.totalBalls / 6);
    const runRate = (matchState.score / (Math.max(1, matchState.totalBalls) / 6)).toFixed(2);
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: `
        You are an elite T20 Cricket Strategy Coach. Analyze this live situation:
        Match: ${battingTeamName} vs ${bowlingTeamName}
        Innings: ${matchState.innings}
        Score: ${matchState.score}/${matchState.wickets}
        Overs: ${currentOver}.${matchState.totalBalls % 6}
        Run Rate: ${runRate}
        
        Provide 3 specific, short, tactical instructions for the BOWLING captain to break the partnership or stem the run flow.
        Keep it punchy, aggressive, and data-driven.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            tactics: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }
            },
            winProbability: { type: Type.NUMBER }
          }
        }
      }
    });
    
    const data = JSON.parse(response.text || "{}");
    return data;
  } catch (error) {
    console.error("Coach AI Error:", error);
    return {
      analysis: "Unable to connect to strategy mainframe.",
      tactics: ["Stick to line and length", "Protect the boundaries", "Rotate the strike"],
      winProbability: 50
    };
  }
};

// --- MEDIA ---

export const generatePressKit = async (fixture: MatchFixture, matchState: MatchState) => {
  // Use API key exclusively from environment variable as per GenAI guidelines
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;

  // Create a new GoogleGenAI instance right before making an API call
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Write a press kit for this cricket match:
        ${fixture.teamAName} vs ${fixture.teamBName}
        Result: ${fixture.result || 'Match in progress'}
        Scores: ${fixture.teamAScore} vs ${fixture.teamBScore}
        Venue: ${fixture.venue}
        
        Generate:
        1. A catchy headline.
        2. A 100-word dramatic match summary.
        3. 3 viral style social media posts (Twitter/Instagram) with hashtags.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            summary: { type: Type.STRING },
            socialPosts: { 
              type: Type.ARRAY,
              items: { type: Type.STRING } 
            }
          }
        }
      }
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Press Kit AI Error:", error);
    return null;
  }
};

// --- DLS ---
export const getDLSAnalysis = async (score: number, overs: number, wickets: number, target: number, weather: string) => {
    return null;
};