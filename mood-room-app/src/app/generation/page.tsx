'use client'
import { Canvas } from "@react-three/fiber"
import { Object3D } from "@/components/3d/Object3D"
import { OrbitControls } from "@react-three/drei"

/**** This page is used to generate a modd room from user input, for now this is just a testing page to load models and
 * test out the movement logic.
 */
export default function GenerationPage() {
  return (
    <div className="flex flex-col items-center justify-center">
      <h1> generate/ edit room</h1>
      <p>Customize your room by selecting a 3D model and applying a color palette.</p>
      <div className = "bg-gray-500 h-[70vh] w-full">
        <Canvas className = "w-full h-full" camera={{ position: [0, 5, 5], fov: 50}}>
          <OrbitControls/>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} />
          <Object3D
            url="/assets/NormTable.glb"
            mode = "edit"
            colourPalette={{
              primary: "#0000ff",
              secondary: "#ff0000",
              tertiary: "#ff0000"
            }}/>

          <Object3D
            url="/assets/NormTable.glb"
            mode = "edit"
            colourPalette={{
              primary: "#ff0000",
              secondary: "#ff0000",
              tertiary: "#ff0000"}}
            position = {[120, 0, 0]}
            />

          <Object3D
            url="/assets/NormTable.glb"
            mode = "edit"
            position = {[240, 0, 0]}
            />
        </Canvas>        
      </div>
    </div>
  )
}

