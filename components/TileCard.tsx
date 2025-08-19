"use client";

import React, { useMemo } from "react";

// Stronger, vivid palette only
const COLORS = [
  "#2563EB", // Strong Blue
  "#16A34A", // Strong Green
  "#EA580C", // Strong Orange
  "#DC2626", // Strong Red
  "#7C3AED", // Strong Violet
  "#DB2777", // Strong Pink
  "#0D9488", // Strong Teal
  "#4338CA", // Strong Indigo
  "#65A30D", // Strong Lime
  "#BE123C", // Strong Rose
];

export default function TileCard({
  skill,
  onClick,
}: {
  skill: string;
  onClick?: () => void;
}) {
  const bgColor = useMemo(() => {
    const index =
      skill.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      COLORS.length;
    return COLORS[index];
  }, [skill]);

  return (
    <div
      className="skill-card"
      style={{ backgroundColor: bgColor }}
      onClick={onClick}
    >
      <span className="skill-text">{skill}</span>
    </div>
  );
}
