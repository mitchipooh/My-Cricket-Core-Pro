import { Router } from 'express';
import { GoogleGenAI, Type } from "@google/genai";

const router = Router();

router.post('/coach', async (req, res) => {
    const { matchState, battingTeamName, bowlingTeamName } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
        const currentOver = Math.floor(matchState.totalBalls / 6);
        const runRate = (matchState.score / (Math.max(1, matchState.totalBalls) / 6)).toFixed(2);
        
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash", 
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
        res.json(data);
    } catch (error) {
        console.error("Coach AI Error:", error);
        res.status(500).json({ error: 'AI Generation Failed' });
    }
});

router.post('/press-kit', async (req, res) => {
    const { fixture, matchState } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
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
        
        const data = JSON.parse(response.text || "{}");
        res.json(data);
    } catch (error) {
        console.error("Press Kit AI Error:", error);
        res.status(500).json({ error: 'AI Generation Failed' });
    }
});

export default router;
