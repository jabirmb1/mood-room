//User will input a sentence about how they feel or how their day went and will pass to AI and random genration code
//

'use client';
import { Courier_Prime } from 'next/font/google';
import { useRef, useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { ProgressBar } from '@/components/UI/ProgressBar';
import { ErrorMessage } from '@/components/UI/ErrorMessage';


const courierNewFont = Courier_Prime({  //font for the object name
    subsets: ['latin'],
    weight: ['400', '700'],
    variable: '--font-courierNew',
})


//TO DO: SAVE LLM IN SESSION STORAGE SO IT DOESN'T HAVE TO RELOAD EVERYTIME. (actually we will
// have to swap into using indexedDB and e.g. remove model from it after session ends)
// TO DO: when model has failed to load; give user option to retry loading it. (they can also refresh page to do this currently).

export default function GenerationPage() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mounted, setMounted] = useState(false)
  const [userInput, setUserInput] = useState<string>("");// default to empty string
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [modelLoaded, setModelLoaded] = useState<boolean>(false);// initial loading state of model.
  const [isProcessing, setIsProcessing] = useState<boolean>(false);// if the model is currently processing input
  const [errorMessage, setErrorMessage] = useState<string | null>(null);// error message to show user if model or worker fails.
  // add in a result state later so we can block input after result is done and swap to another page.

  useEffect(() => {
    setMounted(true)
    try{
      setWorker(new Worker(new URL("../../web-workers/llm.worker.ts", import.meta.url), { type: 'module' }));
    } 
    // in case web worker fails
    catch (error) {
      console.error('Failed to create web worker:', error);
      setErrorMessage('could not create web wokrer which is needed for this page, please refresh page or fix issue');
    }


    return () => {
      if (!worker) return;
      worker.terminate(); // clean up on unmount
    }
  }, [])


  // on mount load the LLM (initialises it), as well as setting up the web worker message handler
  useEffect(()=>{
    if (mounted && worker){
     worker.onmessage= handleWebWorkerMessage;
     worker.postMessage({ type: 'LOAD_MODEL'});

    }}, [mounted, worker])

    /******* functions ********/
    
    //function to habdle the different messages and states of web worker:
    //
  function handleWebWorkerMessage(event: MessageEvent){
    const {type, payload} = event.data;
    if (type === 'MODEL_LOADED'){
      setModelLoaded(true);// model has finished loading.
    }
    else if (type === 'LOADING_PROGRESS'){
      if (typeof payload === 'number' && !isNaN(payload))// only accept number payloads
      setLoadingProgress(payload);
    }
    else if (type === 'MODEL_RESULT'){
      setIsProcessing(false);// model has finished processing
      console.log('model result is:', payload);
      // we will pass down result to other parts of the app later
    }
    else if (type === 'ERROR'){
      console.error('error from web worker:', payload);
      setModelLoaded(false);// model failed to load.
      setLoadingProgress(0);
      setErrorMessage(payload);// show user the error message
    }
    else{
      console.warn('unknown message type from web worker:', type);
    }
  }

   // auto adjust textarea height for clean look
   function handleInput(){
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto"; // Reset height
      textarea.style.height = `${textarea.scrollHeight}px`; // Set to scrollHeight
      setUserInput(textarea.value)
    }
   }

   async function handleRunModel() {
    if (!userInput.trim() || !modelLoaded) {
      return;
    }

    setIsProcessing(true);
    worker?.postMessage({ type: 'RUN_MODEL', payload: userInput });
  }

  if (!mounted) return null 

  return (
    <div className="flex items-center justify-center your-element w-full h-[90vh] p-4">
      <section className="flex flex-col items-center w-full max-w-2xl ">
        <div className="text-center text-white">
          <h1 className={`${courierNewFont.className} md:text-4xl text-2xl`}>
            How do you feel today?
          </h1>
        </div>

        <div className="w-full max-w-2xl mt-10 flex flex-col items-center">

          {modelLoaded ? (<>
            <p className="text-base text-center font-bold text-white">
              Write a sentence about how you feel or how your day went?
            </p>

            <div className="flex items-end p-2 mt-3 border border-gray-200 rounded-lg shadow-sm w-full">
              <textarea
                id="input-user"
                ref={textareaRef}
                placeholder="Enter your message..."
                className="flex-1 resize-none overflow-hidden min-h-[2.5rem] max-h-[10rem] text-white p-2 placeholder-gray-600 focus:outline-none border-transparent rounded-md"
                rows={1}
                onInput={handleInput}
              ></textarea>
              <button className="ml-2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-70"
              type='button' onClick={handleRunModel}
              disabled={!userInput.trim() || isProcessing || errorMessage !== null}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>) : (
            <>
              <ProgressBar progress={loadingProgress} label='Loading...' labelFontSize='text-2xl'/>

              <div className='mt-6'> {/* spacer */}
                <p className="text-sm text-center font-bold text-white">
                  Please wait whilst the model is loading...
                </p>
                <p className="text-xs text-center font-bold text-white">
                  (This may take from a few seconds to a few minutes on first load)
                </p>
              </div>
            </>
          )}

          {/* our error messages will go here later */}
          {errorMessage && (
            <ErrorMessage>{errorMessage}</ErrorMessage>
          )}
        </div>
      </section>
    </div>

  );
}