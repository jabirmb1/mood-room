'use client';

// temp page to get all the dimensions of assets using assetsManifest.json


import DimensionDumper from "../../components/DimensionDumper";

export default function Page() {
  return (
    <main>
      <h1>Asset Dimension Logger</h1>
      <DimensionDumper />
    </main>
  );
}