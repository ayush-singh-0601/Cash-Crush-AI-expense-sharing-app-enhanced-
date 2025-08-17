"use client";
import React from "react";
import dynamic from "next/dynamic";

// Dynamically import react-confetti for client-side only
const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

const ConfettiEffect = ({ run = true }) => {
  if (!run) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 9999 }}>
      <Confetti numberOfPieces={200} recycle={false} />
    </div>
  );
};

export default ConfettiEffect; 