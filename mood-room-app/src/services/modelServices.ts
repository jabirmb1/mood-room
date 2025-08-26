/*********This file is a service layer for any logic relating to the gltf models themselves. *********/

import { ColliderJsonData, Model } from "@/types/types";
import { ModelTags } from "@/utils/3d-canvas/models";

//This function will fetch the model's meta.json data from the server:
// will get passed in a url of where the meta file lives in.
//
export async function fetchModelMeta(url: string): Promise<ModelTags | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null; // if the fetch fails, return null
    }
  }

//This function will fetch the collider data from the server and return it as a JSON object.
// it will get passed in a url of where the collider data is inside of.
//
export async function getModelColliderData(jsonUrl: Model['colliderDataUrl'] | null): Promise<ColliderJsonData[] | null> {
    if(!jsonUrl) return null; // if no url is provided, return null

    try {
    const response = await fetch(jsonUrl);
    if (!response.ok) throw new Error(`Failed to load: ${jsonUrl}`);

    const data: ColliderJsonData[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error loading collider JSON:", error);
    return null;
  }
}
