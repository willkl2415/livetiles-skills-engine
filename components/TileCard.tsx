import React from "react";

export default function TileCard({
  skill,
  detail,
  isOpen,
  onClick,
  type = "skill",
}: {
  skill: string;
  detail?: string;
  isOpen?: boolean;
  onClick?: () => void;
  type?: "skill" | "warning";
}) {
  return (
    <div
      className={`p-4 rounded-xl shadow-md border transition ${
        type === "warning"
          ? "bg-yellow-100 border-yellow-400 text-yellow-800"
          : "bg-white border-gray-200 hover:shadow-lg"
      }`}
      onClick={onClick}
    >
      <span className="font-semibold">{skill}</span>
      {isOpen && type === "skill" && detail && (
        <p className="mt-2 text-sm text-gray-600">{detail}</p>
      )}
    </div>
  );
}
