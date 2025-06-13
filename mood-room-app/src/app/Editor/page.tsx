// Editor after AI generates room
// will have options to edit room
// will have options to save room
// will have options to share room


// for now holds the room canvas for testing purposes 


'use client';  //client component

import dynamic from 'next/dynamic';

const RoomCanvas = dynamic(() => import('@/components/RoomCanvas'), { ssr: false });

export default function EditorPage() {
  return (
    <div style={{ width: '70vw', height: '100vh', marginTop: '3rem', marginLeft: 'auto', marginRight: 'auto' }}>
      <RoomCanvas/>
    </div>
  );
}



