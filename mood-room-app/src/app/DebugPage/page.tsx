'use client';

// temp page to get all the dimensions of assets using assetsManifest.json


import DimensionDumper from "../../components/DimensionDumper";

// export default function Page() {
//   return (
//     <main>
//       <h1>Asset Dimension Logger</h1>
//       <DimensionDumper />
//     </main>
//   );
// }


// src/pages/TestGenerate.tsx
import React, { useEffect, useState } from "react";
import { GenerateEngine } from "../../data/GenerateEngine";

export default function Page  () {
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    async function runTest() {
      try {
        const engine = new GenerateEngine();
        const { placed, failures } = await engine.placeObjects([
          { name: "BookStackBasic" },
          { name: "BedBasic" },
          { name: "BedsideTableBasic" },
          { name: "BookshelfBasic" }
        ]);

        const results: string[] = [];

        placed.forEach(p =>
          results.push(
            `✅ Placed: ${p.name} at (x=${p.position.x}, y=${p.position.y}), rotation=${p.rotation}, reason=${p.placementReason}, occupiedCells=${JSON.stringify(p.occupiedCells)}`
          )
        );

        failures.forEach((f) =>
          results.push(`❌ Failed: ${f.obj.name} → ${f.reason}`)
        );

        setLog(results);
      } catch (err: any) {
        setLog([`Error: ${err.message}`]);
      }
    }

    runTest();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>GenerateEngine Test</h1>
      <pre>{log.join("\n")}</pre>
    </div>
  );
}
