/****** file which willl act as our service layer between UI and our actual LLM logic *****/
import { generatorType } from "@/utils/3d-canvas/procedural-generation/LLM/LLMRaw";

// constant variables (we only want one LLM running at one time; otherwise program may crash)
let generator: generatorType | null = null;
let generateTextFn: ((gen: generatorType,  input: string) => Promise<string | null>) | null = null;
let isInitialised = false;


//Initialises the generator and function from the LLM module.
//Should be called once in the UI lifecycle (e.g., useEffect).
// optional onProgress callback to report loading progress (0-100).
//
export async function loadLLM(onProgress?: (percent: number)=> void): Promise<boolean> {
    if (isInitialised) return isInitialised; // already initialised

    try {
        const { createLLMGenerator, generateText } = await import(
            "@/utils/3d-canvas/procedural-generation/LLM/LLMRaw"
        );

        generator = await createLLMGenerator(onProgress);
        generateTextFn = generateText;
        isInitialised = true;
        return isInitialised;
    } catch (err) {
        console.error("Error loading LLM:", err);
        isInitialised = false;
        return false;
    }
}


// Runs the LLM model.
//Returns output string or null if anything fails.
//
export async function runModel(userInput: string): Promise<string | null> {
    if (!generator || !generateTextFn) {
        console.warn("Generator not ready.");
        return null;
    }

    if (!userInput.trim()) return null;

    try {
        return await generateTextFn(generator, userInput);
    } catch (err) {
        console.error("Error running model:", err);
        return null;
    }
}
