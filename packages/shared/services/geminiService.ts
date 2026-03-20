import { MatchState, MatchFixture } from "../types";
import { API_BASE_URL } from "./api";

// --- COACHING ---

export const getCoachInsights = async (matchState: MatchState, battingTeamName: string, bowlingTeamName: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/coach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchState, battingTeamName, bowlingTeamName })
    });
    
    if (!response.ok) {
       throw new Error('Backend AI Error');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Coach AI Error:", error);
    return {
      analysis: "Unable to connect to strategy mainframe via backend.",
      tactics: ["Stick to line and length", "Protect the boundaries", "Rotate the strike"],
      winProbability: 50
    };
  }
};

// --- MEDIA ---

export const generatePressKit = async (fixture: MatchFixture, matchState: MatchState) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/press-kit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fixture, matchState })
    });
    
    if (!response.ok) {
        throw new Error('Backend AI Error');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Press Kit AI Error:", error);
    return null;
  }
};

// --- DLS ---
export const getDLSAnalysis = async (score: number, overs: number, wickets: number, target: number, weather: string) => {
    return null;
};