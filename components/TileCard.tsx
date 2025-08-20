"use client";

import React, { useMemo } from "react";

const COLORS = [
  "#2563EB", "#16A34A", "#EA580C", "#DC2626", "#7C3AED",
  "#DB2777", "#0D9488", "#4338CA", "#65A30D", "#BE123C",
];

export default function TileCard({
  skill,
  detail,
  onClick,
}: {
  skill: string;
  detail?: string;
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
      {detail && <p className="skill-detail">{detail}</p>}
    </div>
  );
}
