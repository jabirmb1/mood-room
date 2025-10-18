'use client';

import React, { useEffect, useState } from "react";
import { GenerateEngine } from "../../data/GenerateEngine";

// short codes for objects
const shortCode = (name: string) => {
  const map: Record<string, string> = {
    BedBasic: "Bed",
    BedsideTableBasic: "BST",
    BookshelfBasic: "BS",
    BookStackBasic: "BK"
  };
  return map[name] || name.slice(0, 3);
};

// colors per object
const objectColor = (name: string) => {
  const map: Record<string, string> = {
    BedBasic: "#FFCDD2",
    BedsideTableBasic: "#BBDEFB",
    BookshelfBasic: "#C8E6C9",
    BookStackBasic: "#FFE0B2"
  };
  return map[name] || "#DDD";
};

export default function Page() {
  const [placed, setPlaced] = useState<any[]>([]);
  const [failures, setFailures] = useState<any[]>([]);
  const roomWidth = 10;  
  const roomDepth = 10;

  useEffect(() => {
    async function runTest() {
      try {
        const engine = new GenerateEngine();
        const { placed: p, failures: f } = await engine.placeObjects([
          { name: "BedBasic" },
          { name: "BedsideTableBasic" },
          { name: "BookshelfBasic" },
          { name: "ChairBasicBroken" },
          { name: "DeskBasicNormal" },
          { name: "DrawerBasicBroken" },
          { name: "WaterBottle" },
          { name: "BookStackBasic" },

        ]);

        setPlaced(p);
        setFailures(f);
      } catch (err: any) {
        console.error(err);
      }
    }
    runTest();
  }, []);

  // Build grid
  const grid: (string | null)[][] = Array.from({ length: roomDepth }, () =>
    Array.from({ length: roomWidth }, () => null)
  );

  placed.forEach(obj => {
    obj.occupiedCells?.forEach((cell: any) => {
      const x = Math.floor(cell.x);
      const y = Math.floor(cell.y);
      if (grid[y] && grid[y][x] === null) {
        grid[y][x] = obj.name;
      }
    });
  });

  return (
    <div style={{ padding: 20 }}>
      <h1>GenerateEngine Grid View</h1>
      <div style={{
        display: "inline-grid",
        gridTemplateColumns: `repeat(${roomWidth}, 40px)`,
        gridTemplateRows: `repeat(${roomDepth}, 40px)`,
        gap: "1px",
        border: "1px solid #000"
      }}>
        {grid.flatMap((row, y) =>
          row.map((cell, x) => (
            <div key={`${x}-${y}`} style={{
              width: 40,
              height: 40,
              backgroundColor: cell ? objectColor(cell) : "#eee",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: "bold",
              border: "1px solid #ccc",
              overflow: "hidden",
              textAlign: "center",
              whiteSpace: "nowrap"
            }} title={cell || ""}>
              {cell ? shortCode(cell) : ""}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <h2>Placed Objects</h2>
        <pre>{JSON.stringify(placed, null, 2)}</pre>
        <h2>Failures</h2>
        <pre>{JSON.stringify(failures, null, 2)}</pre>
      </div>
    </div>
  );
}


// 'use client';

// // temp page to get all the dimensions of assets using assetsManifest.json


// import DimensionDumper from "../../components/DimensionDumper";

// // export default function Page() {
// //   return (
// //     <main>
// //       <h1>Asset Dimension Logger</h1>
// //       <DimensionDumper />
// //     </main>
// //   );
// // }


// // src/pages/TestGenerate.tsx
// import React, { useEffect, useState } from "react";
// import { GenerateEngine } from "../../data/GenerateEngine";

// export default function Page  () {
//   const [log, setLog] = useState<string[]>([]);

//   useEffect(() => {
//     async function runTest() {
//       try {
//         const engine = new GenerateEngine();
//         const { placed, failures } = await engine.placeObjects([
//           { name: "BookStackBasic" },
//           { name: "BedBasic" },
//           { name: "BedsideTableBasic" },
//           { name: "BookshelfBasic" }
//         ]);

//         const results: string[] = [];

//         placed.forEach(p =>
//           results.push(
//             `✅ Placed: ${p.name} at (x=${p.position.x}, y=${p.position.y}), rotation=${p.rotation}, occupiedCells=${JSON.stringify(p.occupiedCells)}`
//           )
//         );

//         failures.forEach((f) =>
//           results.push(`❌ Failed: ${f.obj.name} → ${f.reason}`)
//         );

//         setLog(results);
//       } catch (err: any) {
//         setLog([`Error: ${err.message}`]);
//       }
//     }

//     runTest();
//   }, []);

//   return (
//     <div style={{ padding: 20 }}>
//       <h1>GenerateEngine Test</h1>
//       <pre>{log.join("\n")}</pre>
//     </div>
//   );
// }
