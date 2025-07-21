// app/my-creations/page.tsx (or whichever parent component renders both)
"use client"; // This component needs to be a Client Component to use useState

import React, { useState, useEffect } from 'react';
import PolaroidCanvasBox from '@/components/MyCreationComp/PolaroidCanvasBox'; // Your clickable component
import ViewMode from '@/components/MyCreationComp/ViewMode'; // Your ViewMode component

export default function MyCreationsPage() { // Or your specific page/component name
  const [isViewModeOpen, setIsViewModeOpen] = useState(false); // State to control ViewMode's visibility
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null // only render on client and when theme is loaded not to get hydration errors

  // Function to open ViewMode
  const openViewMode = () => 
    setIsViewModeOpen(true);

  // Function to close ViewMode (for ViewMode's own close button)
  const closeViewMode = () => 
    setIsViewModeOpen(false);

  return (
    <>
      <h1>My Creation</h1>
      {/*
        PolaroidCanvasBox: When clicked, it will call the 'openViewMode' function
        passed as a prop.
        Assuming PolaroidCanvasBox is used in a map, it still needs key and its own data props.
      */}
      <PolaroidCanvasBox onCanvasClick={openViewMode} />
      {/* Add more PolaroidCanvasBox components or map over data as needed */}

      {/*
        ViewMode: This component is conditionally rendered.
        It will only appear if 'isViewModeOpen' is true.
        The 'onClose' prop is passed so ViewMode can tell the parent to close it.
      */}
      {isViewModeOpen && (
        <div className="fixed inset-0 bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
          <ViewMode onClose={closeViewMode} />
        </div>
      )}

    </>
  );
}
