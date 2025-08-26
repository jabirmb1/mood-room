// This folder will habdle all the fetching logic that relates to the manifest.json (where a url of all model paths lives)

import { ModelItem } from "@/components/3d-canvas/UI/AddModelMenu/AddModelTab";


//This function will get and return the manifest data from the server.
//
export async function getManifestData(): Promise<ModelItem[] | null> {
    try {
      const res = await fetch('/assetsManifest.json');
      console.log('trying to fetch');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
  
      return data.map((item: any, idx: number) => ({
        id: `${item.category || 'asset'}-${item.name || idx}`,
        name: item.name,
        path: item.path,
        thumbnail: item.thumbnail,
        category: item.category || 'all',
        url: item.path || '',
      }));
    } catch (error) {
      console.error("Error fetching manifest data:", error);
      return null;
    }
  }
  

