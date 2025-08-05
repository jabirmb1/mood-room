// used to type the gltf loader due to type error on modelThumbnail.tsx

declare module 'three/examples/jsm/loaders/GLTFLoader' {
    import { Loader } from 'three';
    export class GLTFLoader extends Loader {}
  }

