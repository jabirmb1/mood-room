/******* page where user can choose to either make a room from scratch or to use an LLM to start from a 
 * template based on their mood
 */
'use client'
import { useRouter } from "next/navigation";
import { Card } from "@/components/general-UI/Card";

export default function RoomCreationOption(){
    const router= useRouter();




    return(<>
        <section className="flex flex-col mb-4 mt-2">
            <h1 className="text-center text-xl">
                Choose how you want to create your room:</h1>

            <div className="flex gap-4 justify-center mt-4">{/* button container */}
                {/* buttons next to each other, images + test underneath/ over button */}
                <Card imageUrl={null} text="Create from scratch" href="/Editor" width={400} height={250}
                    textSize={'xl'}
                />
                <Card imageUrl={null} text="Start from a base template via AI" href="/generation" 
                width={400} height={250} textSize={'xl'}/>
            </div>
        </section>


        
    </>)
}