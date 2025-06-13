import * as THREE from 'three';

declare module '*.glb' {
    const value: string;
    export default value;
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            group: React.ThreeElements['group'];
            mesh: React.ThreeElements['mesh'];
            // Add other Three.js elements as needed
        }
    }
}
