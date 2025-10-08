/* A simple web worker wrapper around our LLM services (contains actua logic of how to run and load LLM) ***/

import { loadLLM, runModel } from '@/services/LLMServices';

let isInitialised = false;// if Model is initalised or not.
const TIMEOUT = 120000; // default timeout for operations (in ms)


// function to report loading progress back to main thread
function getProgress(percent: number) {
  self.postMessage({ type: 'LOADING_PROGRESS', payload: percent });
}

// function to wrap a task with a timeout, (used for 'fast' tasks)
//
async function timeOutTask(taskFn: any, timeoutMs = TIMEOUT) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
  );

  try {
    return await Promise.race([taskFn(), timeout]);
  } catch (error) {
    console.error('[Worker] Error in timeOutTask function:', error);
    self.postMessage({
      type: 'ERROR',
      payload: error instanceof Error ? error.message : 'Unknown worker error',
    });
    return null;
  }
}


// loads model through our service layer
// has an extra onProgress callback to report loading progress
//
async function handleLoadModel() {
  if (isInitialised) {
    self.postMessage({ type: 'MODEL_LOADED' });// model should already be loaded
    return;
  }

  self.postMessage({ type: 'LOADING_PROGRESS', payload: 0 });

  const result = await loadLLM(getProgress)// can wrap in timeout later (much larger time out e.g. 5 mins)
  if (result)
  { 
    isInitialised = true;
    self.postMessage({ type: 'MODEL_LOADED' });
  }
  else{
    isInitialised = false;// reset initialisation flag on failure
    self.postMessage({
      type: 'ERROR',
      payload: 'Failed to initialise model when loading model',
    });
  }
}

/**
 * Run model via service layer
 */
async function handleRunModel(input: string) {
  if (!isInitialised) {
    self.postMessage({
      type: 'ERROR',
      payload: 'Model not initialised when running model',
    });
    return;
  }

  // running model can take a while; so we will wrap in timeout, (expected behaviour is fast output)
  const output = await timeOutTask(() => runModel(input));

  if (output) {
    self.postMessage({
      type: 'MODEL_RESULT',
      payload: output,
    });
  } else {
    self.postMessage({
      type: 'ERROR',
      payload: 'No output generated or operation timed out when running model',
    });
  }
}

/**
 * Message routing from main thread
 */
self.onmessage = async (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'LOAD_MODEL':
      await handleLoadModel();
      break;
    case 'RUN_MODEL':
      await handleRunModel(payload);
      break;
    default:
      console.warn('[Worker] Unknown message type:', type);
      self.postMessage({
        type: 'ERROR',
        payload: `Unknown message type: ${type}`,
      });
  }
};

/**
 * Catch any runtime worker errors
 */
self.addEventListener('error', (event: ErrorEvent) => {
  console.error('[Worker Internal Error]', event.message, event.filename, event.lineno, event.colno);
  self.postMessage({
    type: 'ERROR',
    payload: event.message || 'Unhandled worker error',
  });
});
