"use client";

import { useState, useEffect } from "react";
import { ROLES } from "../app/data/roles.js";
import { SKILLS } from "../app/data/skills.ts";
import "../app/styles/skills.css";

export default function RoleSelector() {
  const [industry, setIndustry] = useState<string>("");
  const [func, setFunc] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    setSkills([]);
  }, [industry, func, role]);

  const fetchSkills = async (selectedRole: string) => {
    try {
      const res = await fetch(`/api/getSkills?role=${encodeURIComponent(selectedRole)}`);
      const data = await res.json();
      if (data.skills) {
        setSkills(data.skills);
        return;
      }
    } catch (err) {
      console.error("❌ API fetch failed, trying fallback");
    }

    if (SKILLS[selectedRole]) {
      setSkills(SKILLS[selectedRole]);
    } else {
      setSkills(["No skills available for this role"]);
    }
  };

  const functions = industry ? Object.keys(ROLES[industry] || {}) : [];
  const roles = industry && func ? ROLES[industry][func] || [] : [];

  return (
    <div className="p-6 bg-blue-50 rounded-lg shadow-md max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4">
        Welcome to Skills Forge™ <br />
        <span className="text-purple-600">Knowledge at warp speed 🚀</span>
      </h1>

      <label className="block mb-2">🌐 Select Industry</label>
      <select
        className="w-full p-2 border rounded mb-4"
        value={industry}
        onChange={(e) => {
          setIndustry(e.target.value);
          setFunc("");
          setRole("");
          setSkills([]);
        }}
      >
        <option value="">Select Industry</option>
        {Object.keys(ROLES).map((ind) => (
          <option key={ind} value={ind}>
            {ind}
          </option>
        ))}
      </select>

      <label className="block mb-2">⚡ Select Function</label>
      <select
        className="w-full p-2 border rounded mb-4"
        value={func}
        onChange={(e) => {
          setFunc(e.target.value);
          setRole("");
          setSkills([]);
        }}
        disabled={!industry}
      >
        <option value="">Select Function</option>
        {functions.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>

      <label className="block mb-2">🎯 Select Role</label>
      <select
        className="w-full p-2 border rounded mb-4"
        value={role}
        onChange={(e) => {
          const selectedRole = e.target.value;
          setRole(selectedRole);
          fetchSkills(selectedRole);
        }}
        disabled={!func}
      >
        <option value="">Select Role</option>
        {roles.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      {skills.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {skills.map((skill, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl shadow-md bg-white border hover:shadow-lg transition"
            >
              <span className="font-semibold text-gray-800">{skill}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
