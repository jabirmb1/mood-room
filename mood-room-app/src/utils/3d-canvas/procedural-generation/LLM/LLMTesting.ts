// file which is where our LLM is housed; has low level functions to interact with our LLM of choice
import { pipeline, TextClassificationPipeline} from '@huggingface/transformers';
// Allocate pipeline


/********** types */
// return type for text classification models (if we choose to use e.g. a text generator;
// then use another type for casting).
type TextClassificationOutput = {
    label: string;
    score: number;
};

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