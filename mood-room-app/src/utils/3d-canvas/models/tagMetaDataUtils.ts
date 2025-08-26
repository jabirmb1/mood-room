// Tag and metadata utilities for models
import * as THREE from "three";
import { fetchModelMeta } from "@/services/modelServices";
import { ModelTags } from "./types";

// This function will get category tags from the url; it will also replace some default tag via a json depending
// if the url has a sub folder or not (for extra tags, or to remove tags)
export async function getCategoryTagsFromURL(url: string): Promise<string[]> {
    const tags = new Set<string>();
    const lowerUrl = url.toLowerCase();

    // Infer base tags from folder
    if (lowerUrl.includes('lights')) {
        tags.add('light');
        tags.add('decor');
    } else if (lowerUrl.includes('furniture')) {
        tags.add('furniture');
    } else if (lowerUrl.includes('decor')) {
        tags.add('decor');
    } else if (lowerUrl.includes('wall-art')) {
        tags.add('wall-art');
    }

    const jsonUrl = url.replace(/\.glb$/i, '.meta.json');
    const metaData = await fetchModelMeta(jsonUrl); // grab the metadata from the server

    if (metaData) {
        // add/ subtract tags as necessary depending on the meta data
        if (Array.isArray(metaData.addTags)) {
            for (const tag of metaData.addTags) tags.add(tag);
        }
        if (Array.isArray(metaData.removeTags)) {
            for (const tag of metaData.removeTags) tags.delete(tag);
        }
    }
    return Array.from(tags); // return the tags as an array
}

// This function will get a model url and then return its collider url
// This is because the collider url is standardised and each collider json is named colliders.json and is inside each model's sub folder
export async function getModelColliderDataUrl(url: string): Promise<string> {
    // Replace the model file name (e.g., NormTable.glb) with 'colliders.json'
    const colliderUrl = url.replace(/[^/]+\.glb$/i, 'colliders.json');
    return colliderUrl;
}

// Applies tags to object.userData.tags safely (deduplicates)
export function applyTagsToObject(object: THREE.Object3D, tags: string[]) {
    const current = new Set(object.userData.tags || []);
    for (const tag of tags) current.add(tag);
    object.userData.tags = Array.from(current);
}

// A wrapper function which is used to apply tags to the passed in object
export async function applyCategoryTags(url: string, object: THREE.Object3D) {
    const tags = await getCategoryTagsFromURL(url);
    applyTagsToObject(object, tags);
}