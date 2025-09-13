"use client";

import React from "react";
import { useRouter } from "next/navigation";

type RedirectButtonProps = {
  title: string;       // Button text
  target: string;      // Path to navigate to
};

const RedirectButton: React.FC<RedirectButtonProps> = ({ title, target }) => {
  const router = useRouter();

  const handleRedirect = () => {
    router.push(target);
  };

  return (
    <button
      onClick={handleRedirect}
      style={{
        padding: "0.5rem 1rem",
        backgroundColor: "#0070f3",
        color: "white",
        border: "none",
        margin: 10,
        borderRadius: "4px",
        cursor: "pointer",
      }}
    >
      {title}
    </button>
  );
};

export default RedirectButton;
