"use client";

import React, { useMemo } from "react";

const COLORS = [
  "#2563EB", "#16A34A", "#EA580C", "#DC2626", "#7C3AED",
  "#DB2777", "#0D9488", "#4338CA", "#65A30D", "#BE123C",
];

interface TileCardProps {
  skill: string;
  detail?: string;
  isOpen: boolean;
  onClick?: () => void;
}

export default function TileCard({ skill, detail, isOpen, onClick }: TileCardProps) {
  const bgColor = useMemo(() => {
    const index =
      skill.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      COLORS.length;
    return COLORS[index];
  }, [skill]);

  return (
    <div
      className={`skill-card cursor-pointer transition ${
        isOpen ? "ring-2 ring-purple-500" : "hover:opacity-90"
      }`}
      style={{ backgroundColor: bgColor }}
      onClick={onClick}
    >
      <span className="skill-text">{skill}</span>

      {/* 🔑 Only show detail if open */}
      {isOpen && detail && (
        <p className="skill-detail mt-2 text-sm">{detail}</p>
      )}
    </div>
  );
}
