/*********This file is a service layer for any logic relating to the gltf models themselves. *********/

import { ColliderJsonData } from "@/types/types";
import { ModelTags } from "@/utils/3d-canvas/object3D";

//This function will fetch the model's meta.json data from the server:
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
//
export async function getModelColliderData(jsonUrl: string | null): Promise<ColliderJsonData[] | null> {
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
