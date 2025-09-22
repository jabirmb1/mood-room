// GenerateEngine.ts
// AI passes selected objects into here using and array of objects
// objects dimensions and path collected from json and rules 
// constructs new grid and runs placement engine one object at a time
// if all objects placed successfully return placed objects position to be passed to editor
// else return failures
// 

// import { wallHeight } from "@/utils/3d-canvas/const";
import { GridManager } from "./GridManager";
import { PlacementEngine, WorldObject } from "./PlacementEngine";

// Room setup defaults
const roomWidth = 13;    // meters
const roomDepth = 13;    // meters
const cellSize = 0.25;  // finer precision
const wallHeight = 10;
 
// Types
interface ObjectToPlace {
  name: string; //recieves from AI filtering just object name, like "BedBasic"
}

export class GenerateEngine {
  grid: GridManager;            // ✅ single shared grid
  engine: PlacementEngine;

  constructor(
    private width: number = roomWidth,
    private depth: number = roomDepth
  ) {
    this.grid = new GridManager(this.width, this.depth, cellSize);

    // ✅ Pass the SAME grid into placement engine
    this.engine = new PlacementEngine({
      grid: this.grid,
      roomWidth: this.width,
      roomDepth: this.depth,
      wallHeight,
      cellSize
    });
  }


  /**
   * Load asset manifest (once per call)
   */
  private async loadManifest() {
    const res = await fetch("/assetsManifest.json");
    if (!res.ok) throw new Error("Failed to load assetManifest.json");
    return res.json();
  }
  

  /**
   * Build a WorldObject from manifest + meta ie add paths and dimensions
   */
  private async buildWorldObject(name: string, manifest: any[]): Promise<WorldObject> {
    const entry = manifest.find((m) => m.name === name);
    if (!entry) throw new Error(`Object ${name} not found in manifest`);

    // Load meta.json for dimensions + rules
    const metaRes = await fetch(entry.meta);
    if (!metaRes.ok) throw new Error(`Failed to load meta for ${name}`);
    const meta = await metaRes.json();

    return {
      name: entry.name,
      path: entry.path,
      dimensions: meta.dimensions,  
      rules: [],       
    };
  }

  /**
   * Place objects one by one
   */
  async placeObjects(objects: ObjectToPlace[]) {
    const manifest = await this.loadManifest();

    // create a array of objects to place
    const worldObjects: WorldObject[] = [];

    for (const obj of objects) {
      const built = await this.buildWorldObject(obj.name, manifest);
      worldObjects.push(built);
    }

    // Run placement
    const { placed, failures } = this.engine.placeSequential(worldObjects);
    failures.forEach((f) => {
      console.log(`❌ Failed: ${f.obj.name} → ${f.reason}`);
      if (f.details) {
        f.details.forEach((d) => console.log("   " + d));
      }
    });

    placed.forEach((p) => {
      // Get occupied cells from grid
      const occupiedCells = this.grid.getOccupiedCells({
        position: p.position,
        dimensions: { width: p.dimensions.width, depth: p.dimensions.depth }
      });
    
      const reason = (p as any).why || "floor-scan";
    
      console.log(
        `✅ Placed: ${p.name} at (x=${p.position.x}, y=${p.position.y}), rotation=${p.rotation}, reason=${reason}, occupiedCells=${JSON.stringify(occupiedCells)}`
      );
    });
    

    return { placed, failures };
   

  }

}