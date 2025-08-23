import React from "react";

export default function TileCard({
  skill,
  detail,
  isOpen,
  onClick,
}: {
  skill: string;
  detail?: string;
  isOpen?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className="p-4 rounded-xl shadow-md bg-white border hover:shadow-lg transition"
      onClick={onClick}
    >
      <span className="font-semibold text-gray-800">{skill}</span>
      {isOpen && detail && (
        <p className="mt-2 text-sm text-gray-600">{detail}</p>
      )}
    </div>
  );
}
