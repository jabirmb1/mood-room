// file which is where our LLM is housed; has low level functions to interact with our LLM of choice
import { pipeline, TextClassificationPipeline} from '@huggingface/transformers';
import { MoodType} from "@/types/types";
// Allocate pipeline


/********** types */
// return type for text classification models (if we choose to use e.g. a text generator;
// then use another type for casting).
type TextClassificationOutput = {
    label: string;
    score: number;
};

// the different labels that our go emotions can actually output (not including null)
export const goEmotionLabels = [
    'admiration', 'amusement', 'anger', 'annoyance', 'approval', 'caring',
    'confusion', 'curiosity', 'desire', 'disappointment', 'disapproval',
    'disgust', 'embarrassment', 'excitement', 'fear', 'gratitude', 'grief',
    'joy', 'love', 'nervousness', 'optimism', 'pride', 'realization',
    'relief', 'remorse', 'sadness', 'surprise', 'neutral'
  ] as const;
  
  export type GoEmotionLabel = typeof goEmotionLabels[number];

// abstracted generator type for higher level files; please swap out the typing if we swap to other types
// e.g. text-generator
export type generatorType = TextClassificationPipeline;

//abstracted generator output:
export type generatorOutputType = TextClassificationOutput;

/***********functions */

// we have a predefined model for this project; but we can extend this function later to 
// get passed in model types etc etc.
//
export async function createLLMGenerator(onProgress?: (percent: number) => void): Promise<generatorType> {
    console.log('attempting to get a LLM');

    // we will use a text classification since it's light weight and works with most of our moods
    // (need to do adapt and map to other models however).
    const generator = await pipeline('text-classification', 'MicahB/roberta-base-go_emotions',
        {progress_callback: (progressEvent : any) => {//TO DO: FIX TYPING
            // progressEvent.progress is already a numbe between 0 and 100
            // we want to show users how long until model is loaded.
           const percent = Math.round(progressEvent.progress)

           // if the user wants the progres of the model loading; then give it to them
              if (onProgress) onProgress(percent)
        }},)

    return generator
}

// function to get an output from our LLM
//
export async function generateText(generator: generatorType,userPrompt: string) : Promise<string | null>{
        console.log('I have been run');    
        const output  = await generator(userPrompt) as generatorOutputType[]
        console.log('output is', output[0]);
        return output[0].label as string;
}

// function to map the output of our LLM to one of our moods
// MUST CHANGE IMPLEMENTATION IF WE CHANGE MODELS.
//
export function mapLLMOutputToMood(output: GoEmotionLabel | null): MoodType | null {
    if (output === null) return null;
    // LLM CAN'T handle emotions like grief/depressed, lonley/empty well, so we will use another technique for them.

    // We are trying to map emotions to emotions. If a perfect match does not appear then
    // we will try to map the LLM output to a colour palette associated with the room.
    // Final output: room conveying user emotions
    const emotionMap: Record<GoEmotionLabel, MoodType> = {
        // Positive emotions
        'admiration': 'inspired',
        'amusement': 'happy',
        'approval': 'content',
        'caring': 'love',           // Changed from 'calm' - caring is closer to love
        'desire': 'excited',        // Changed from array - desire has energy/anticipation
        'excitement': 'excited',
        'gratitude': 'content',     // Changed from array - gratitude is peaceful satisfaction
        'joy': 'happy',
        'love': 'love',
        'optimism': 'inspired',     // Changed from array - optimism is forward-looking
        'pride': 'pride',
        'relief': 'calm',
        
        // Negative emotions
        'anger': 'angry',
        'annoyance': 'stressed',    // Changed from array - annoyance is low-level stress
        'disappointment': 'sad',
        'disapproval': 'disgusted', // Changed from 'angry' - disapproval has disgust element
        'disgust': 'disgusted',
        'embarrassment': 'embarrassed',
        'fear': 'fearful',
        'grief': 'depressed',       // Changed from 'sad' - grief is deeper than sadness
        'nervousness': 'anxious',
        'remorse': 'guilt',
        'sadness': 'sad',
        
        // Ambiguous/Neutral emotions
        'confusion': 'confusion',    
        'curiosity': 'curious',
        'realization': 'inspired',  // Changed from array - realizations are inspiring moments
        'surprise': 'excited',      // Changed from array - surprise is high-energy
        'neutral': 'content'
    };

    // some original emotions were not mapped directly to moods:
    // jealousy, boredom, adventurous, lonely, nostalgic.

    // we are still missing some of our original emotions, need to assign them to something.
    
    return emotionMap[output] ?? null;
}