// hold all user created models
//

//Connect to DB to access user created models and print them as polaroid canvas boxes
//
"use client"; 

import React, { useState, useEffect } from 'react';
import PolaroidCanvasBox from '@/components/3d-canvas/MyCreationComponent/PolaroidCanvasBox'; 
import ViewMode from '@/components/3d-canvas/MyCreationComponent/ViewMode'; 


export default function MyCreationsPage() { 
  const [isViewModeOpen, setIsViewModeOpen] = useState(false); 
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null // only render on client and when theme is loaded not to get hydration errors

  // Function to open ViewMode
  const openViewMode = () => 
    setIsViewModeOpen(true);

  // Function to close ViewMode (for ViewModes own close button)
  const closeViewMode = () => 
    setIsViewModeOpen(false);

  return (
    <>
      <h1>My Creation</h1>
      {/*componet that will display the 3d model in my creation as an image, When clicked it will call the openViewMode function*/}
      <PolaroidCanvasBox onCanvasClick={openViewMode} />

      {/* when double clicked it will open the view mode, show in 3d*/}
      {isViewModeOpen && (
        <div className="fixed inset-0 bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
          <ViewMode onClose={closeViewMode} /> 
        </div>
      )}

    </>
  );
}
