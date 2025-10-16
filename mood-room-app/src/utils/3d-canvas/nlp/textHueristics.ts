import { MoodType } from '@/types/types';
import nlp from 'compromise';
/** This file will be used alongside our LLM to help figure out what emotion the user is conveying
 *  before LLM is used (used to catch emotions that LLM can't handle well e.g. grief/depressed, lonely/empty)
 */



//Checks if the text contains a self-referential emotional expression.
// Example: "I feel depressed", "I'm lonely", etc.
//
export function isSelfEmotionalExpression(text: string, targetWords: string[]): boolean {
    // replace colons, semicolons, em-dashes with periods to force proper sentence splitting
    const cleanedText = text.replace(/[:;—]/g, '.');

    const doc = nlp(cleanedText).normalize() as any;
    const sentences = doc.sentences().out('array') as string[];
    console.log('sentences are:', sentences);
  
    for (const sentence of sentences) {
      const sent = nlp(sentence);
  
      // Check for self-reference
      const hasSelf = sent.has('(i|me|myself)');
      // Check for target emotion keywords
      const hasEmotion = targetWords.some(word => sent.has(word));
      // Check for negation
      const hasNegation = sent.has('(not|no|never|isn\'t|wasn\'t)');
  
      if (hasSelf && hasEmotion && !hasNegation) return true;
    }
  
    return false;
  }



/********** Preprocessing **********/


//Preprocesses user input to detect special emotion cases before sending to LLM.
// Returns a MoodType if detected, otherwise null (fallback to LLM).
//TO DO: handle typos.
//TO DO: get synonyms of our target words using some APIs e.g. thesauraus API
//
export function preProcessInput(userInput: string): MoodType | null {
    const input = userInput.trim().toLowerCase();
  
    // handles gibberish.
    if (/^[^a-zA-Z]+$/.test(input)) return 'confusion';
  
    // Keywords for special cases
    const depressedWords = ['depressed', 'hopeless', 'empty', 'worthless'];
    const lonelyWords = ['lonely', 'alone', 'isolated', 'abandoned'];
    const boredWords = ['bored', 'boredom', 'nothing to do', 'restless', 'tired of this'];
    // Depressed context
    if (isSelfEmotionalExpression(input, depressedWords)) return 'depressed';
  
    // Lonely context
    if (isSelfEmotionalExpression(input, lonelyWords)) return 'lonely';
  
    // Bored context
    if (isSelfEmotionalExpression(input, boredWords)) return 'bored';
  
    return null; // fallback to LLM
}