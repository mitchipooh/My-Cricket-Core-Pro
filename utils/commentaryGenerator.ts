import { Player } from '../types';

interface CommentaryContext {
    runs: number;
    isWide?: boolean;
    isNoBall?: boolean;
    isBye?: boolean;
    isLegBye?: boolean;
    batter?: Player;
    bowler?: Player;
    wicketType?: string;
    outPlayer?: Player;
    fielder?: Player;
}

interface EndOfOverContext {
    overNumber: number;
    score: number;
    wickets: number;
    currentRunRate: string;
    innings: number;
    target?: number;
    requiredRate?: string;
    batterName?: string;
    batterScore?: number;
    projectedScore?: number;
    lead?: number;
}

// Varied phrases for different scenarios
const COMMENTARY_PHRASES = {
    dot: [
        "Dot ball",
        "{batter} defends solidly",
        "No run there",
        "{batter} plays it straight to the fielder",
        "Good defensive shot",
        "{bowler} beats the bat!",
        "Excellent bowling from {bowler}"
    ],
    single: [
        "{batter} takes a quick single",
        "{batter} pushes it for one",
        "They scamper through for a single",
        "{batter} works it away for one run",
        "Good running between the wickets",
        "{batter} places it nicely for a single"
    ],
    two: [
        "{batter} finds the gap for two",
        "They come back for the second!",
        "{batter} pushes it into the gap, two runs",
        "Good placement, two runs",
        "Excellent running, they get two"
    ],
    three: [
        "{batter} finds the gap, they run three!",
        "Superb running, three runs",
        "{batter} places it perfectly, three runs",
        "They push hard and get three!"
    ],
    four: [
        "FOUR! What a shot from {batter}!",
        "BOUNDARY! {batter} finds the rope!",
        "FOUR! Beautifully timed by {batter}!",
        "FOUR! {batter} sends it racing to the boundary!",
        "FOUR! Glorious stroke from {batter}!",
        "FOUR! {batter} pierces the field perfectly!"
    ],
    six: [
        "SIX! {batter} sends it into the stands!",
        "MAXIMUM! What a hit from {batter}!",
        "SIX! {batter} launches it over the boundary!",
        "SIX! Massive hit from {batter}!",
        "SIX! {batter} goes big!",
        "SIX! Out of the park from {batter}!"
    ],
    wide: [
        "Wide! {bowler}'s radar is off",
        "Wide ball, that's wayward from {bowler}",
        "Wide! {bowler} loses his line",
        "Wide! Poor delivery from {bowler}",
        "Wide ball, extra run"
    ],
    noBall: [
        "No ball! {bowler} has overstepped",
        "No ball! Free hit coming up!",
        "No ball from {bowler}",
        "No ball! {bowler} oversteps the crease"
    ],
    bye: [
        "Byes! The keeper misses it",
        "{runs} byes, extras mounting up",
        "Byes, the ball beats everyone"
    ],
    legBye: [
        "Leg bye! Off the pads",
        "{runs} leg byes",
        "Leg bye, off the body"
    ],
    wicket: {
        Bowled: [
            "BOWLED! {bowler} crashes through the defenses!",
            "TIMBER! {outPlayer} is bowled by {bowler}!",
            "BOWLED! What a delivery from {bowler}!",
            "BOWLED! {outPlayer}'s stumps are shattered!"
        ],
        Caught: [
            "OUT! {outPlayer} is caught by {fielder}!",
            "CAUGHT! {fielder} takes a brilliant catch!",
            "OUT! {outPlayer} holes out to {fielder}!",
            "CAUGHT! {fielder} makes no mistake!"
        ],
        "Caught Behind": [
            "OUT! Caught behind! {outPlayer} edges it to the keeper!",
            "CAUGHT BEHIND! {outPlayer} nicks it!",
            "OUT! The keeper takes a good catch!",
            "CAUGHT BEHIND! Thin edge and gone!"
        ],
        LBW: [
            "OUT! LBW! {outPlayer} is trapped in front!",
            "LBW! That looked plumb!",
            "OUT! {outPlayer} is given out LBW!",
            "LBW! {bowler} gets his man!"
        ],
        "Run Out": [
            "RUN OUT! {outPlayer} is short of the crease!",
            "OUT! Brilliant fielding, {outPlayer} is run out!",
            "RUN OUT! {outPlayer} sacrifices his wicket!",
            "OUT! Direct hit! {outPlayer} is gone!"
        ],
        Stumped: [
            "STUMPED! {outPlayer} is out of his crease!",
            "OUT! Lightning quick stumping!",
            "STUMPED! The keeper does the rest!",
            "OUT! {outPlayer} is stumped!"
        ]
    }
};

function getRandomPhrase(phrases: string[]): string {
    return phrases[Math.floor(Math.random() * phrases.length)];
}

function replacePlaceholders(phrase: string, context: CommentaryContext): string {
    return phrase
        .replace('{batter}', context.batter?.name || 'The batter')
        .replace('{bowler}', context.bowler?.name || 'The bowler')
        .replace('{outPlayer}', context.outPlayer?.name || 'The batter')
        .replace('{fielder}', context.fielder?.name || 'the fielder')
        .replace('{runs}', context.runs.toString());
}

/**
 * Adds natural pauses and emphasis to commentary for more realistic speech
 */
export function addSpeechEmphasis(text: string): string {
    // Add slight pauses after exclamations for dramatic effect
    let enhanced = text.replace(/!/g, '!,');

    // Add pause after player names for clarity
    enhanced = enhanced.replace(/([A-Z][a-z]+ [A-Z][a-z]+)/g, '$1,');

    // Remove double commas
    enhanced = enhanced.replace(/,,/g, ',');

    return enhanced;
}

export function generateCommentary(context: CommentaryContext): string {
    let commentary = '';

    // Handle extras first
    if (context.isWide) {
        commentary = replacePlaceholders(getRandomPhrase(COMMENTARY_PHRASES.wide), context);
    } else if (context.isNoBall) {
        commentary = replacePlaceholders(getRandomPhrase(COMMENTARY_PHRASES.noBall), context);
    } else if (context.isBye) {
        commentary = replacePlaceholders(getRandomPhrase(COMMENTARY_PHRASES.bye), context);
    } else if (context.isLegBye) {
        commentary = replacePlaceholders(getRandomPhrase(COMMENTARY_PHRASES.legBye), context);
    } else if (context.wicketType) {
        // Handle wickets
        const wicketPhrases = COMMENTARY_PHRASES.wicket[context.wicketType as keyof typeof COMMENTARY_PHRASES.wicket];
        if (wicketPhrases) {
            commentary = replacePlaceholders(getRandomPhrase(wicketPhrases), context);
        } else {
            commentary = `WICKET! ${context.wicketType}!`;
        }
    } else {
        // Handle runs
        switch (context.runs) {
            case 0:
                commentary = replacePlaceholders(getRandomPhrase(COMMENTARY_PHRASES.dot), context);
                break;
            case 1:
                commentary = replacePlaceholders(getRandomPhrase(COMMENTARY_PHRASES.single), context);
                break;
            case 2:
                commentary = replacePlaceholders(getRandomPhrase(COMMENTARY_PHRASES.two), context);
                break;
            case 3:
                commentary = replacePlaceholders(getRandomPhrase(COMMENTARY_PHRASES.three), context);
                break;
            case 4:
                commentary = replacePlaceholders(getRandomPhrase(COMMENTARY_PHRASES.four), context);
                break;
            case 6:
                commentary = replacePlaceholders(getRandomPhrase(COMMENTARY_PHRASES.six), context);
                break;
            default:
                commentary = `${context.runs} runs`;
        }
    }

    // Add natural speech emphasis
    return addSpeechEmphasis(commentary);
}

/**
 * Generates end-of-over commentary with game updates
 */
export function generateEndOfOverCommentary(context: EndOfOverContext): string {
    const { overNumber, score, wickets, currentRunRate, innings, target, requiredRate, batterName, batterScore, projectedScore, lead } = context;

    const templates = [];

    // First innings templates
    if (innings === 1) {
        templates.push(
            `End of over ${overNumber}. The score is ${score} for ${wickets}. Current run rate, ${currentRunRate}.`,
            `That's the end of over ${overNumber}. ${score} for ${wickets}. They're scoring at ${currentRunRate} runs per over.`,
            `Over ${overNumber} complete. ${score} for ${wickets}. Run rate ${currentRunRate}.`
        );

        if (batterName && batterScore !== undefined) {
            templates.push(
                `End of over ${overNumber}. ${score} for ${wickets}. ${batterName} on ${batterScore}.`,
                `That's over ${overNumber} done. ${batterName} has ${batterScore}. Team score ${score} for ${wickets}.`
            );
        }

        if (projectedScore) {
            templates.push(
                `Over ${overNumber} complete. ${score} for ${wickets}. At this rate, they're projected to reach ${projectedScore}.`,
                `End of over ${overNumber}. Current score ${score} for ${wickets}. Projected total, ${projectedScore}.`
            );
        }

        if (lead && lead > 0) {
            templates.push(
                `Over ${overNumber} done. ${score} for ${wickets}. They lead by ${lead} runs.`,
                `End of over ${overNumber}. ${score} for ${wickets}. Lead of ${lead} runs.`
            );
        } else if (lead && lead < 0) {
            templates.push(
                `Over ${overNumber} complete. ${score} for ${wickets}. They trail by ${Math.abs(lead)} runs.`,
                `End of over ${overNumber}. ${score} for ${wickets}. Still ${Math.abs(lead)} runs behind.`
            );
        }
    }

    // Second innings (chasing) templates
    if (innings === 2 && target) {
        const runsNeeded = target - score;

        if (runsNeeded > 0) {
            templates.push(
                `End of over ${overNumber}. ${score} for ${wickets}. They need ${runsNeeded} more runs to win.`,
                `Over ${overNumber} complete. ${runsNeeded} runs needed from here. Current score ${score} for ${wickets}.`,
                `That's over ${overNumber}. ${score} for ${wickets}. ${runsNeeded} runs required.`
            );

            if (requiredRate) {
                templates.push(
                    `End of over ${overNumber}. ${score} for ${wickets}. Need ${runsNeeded} runs. Required rate ${requiredRate}.`,
                    `Over ${overNumber} done. ${runsNeeded} to win. Required run rate, ${requiredRate}. Current rate, ${currentRunRate}.`,
                    `That's the end of over ${overNumber}. ${score} for ${wickets}. ${runsNeeded} needed at ${requiredRate} per over.`
                );
            }

            if (batterName && batterScore !== undefined) {
                templates.push(
                    `Over ${overNumber} complete. ${batterName} on ${batterScore}. Team needs ${runsNeeded} more runs.`,
                    `End of over ${overNumber}. ${score} for ${wickets}. ${batterName} has ${batterScore}. ${runsNeeded} runs to win.`
                );
            }
        }
    }

    // Pick a random template
    const template = templates[Math.floor(Math.random() * templates.length)];
    return addSpeechEmphasis(template);
}
