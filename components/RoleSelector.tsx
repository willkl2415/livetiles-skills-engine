"use client";

import { useState, useEffect } from "react";
import { ROLES } from "../app/data/roles.js";
import { SKILLS } from "../app/data/skills";
import "../app/styles/skills.css";
import TileCard from "./TileCard";

export default function RoleSelector() {
  const [industry, setIndustry] = useState<string>("");
  const [func, setFunc] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [skills, setSkills] = useState<string[]>([]);
  const [details, setDetails] = useState<Record<string, string>>({});
  const [cache, setCache] = useState<Record<string, string[]>>({});
  const [query, setQuery] = useState<string>("");
  const [searchMode, setSearchMode] = useState<"domain" | "general">("domain");
  const [expanded, setExpanded] = useState<boolean>(false);

  useEffect(() => {
    const savedCache = localStorage.getItem("skillsCache");
    if (savedCache) setCache(JSON.parse(savedCache));
  }, []);

  useEffect(() => {
    localStorage.setItem("skillsCache", JSON.stringify(cache));
  }, [cache]);

  const fetchSkills = async (selectedRole?: string, searchQuery?: string) => {
    let key = "";
    if (searchQuery && selectedRole) key = `${selectedRole}::${searchQuery}`;
    else if (searchQuery) key = `general::${searchQuery}`;
    else if (selectedRole) key = selectedRole;

    try {
      let url = "/api/getSkills?";
      if (selectedRole) url += `role=${encodeURIComponent(selectedRole)}&`;
      if (searchQuery) url += `query=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.skills && data.skills.length > 0) {
        setSkills(data.skills);
        if (key) setCache((prev) => ({ ...prev, [key]: data.skills }));
        setExpanded(false);
        return;
      }
    } catch {
      console.warn("API fetch failed, checking cache/local");
    }

    if (key && cache[key]) {
      setSkills(cache[key]);
      setExpanded(false);
      return;
    }

    if (
      selectedRole &&
      industry &&
      func &&
      (SKILLS as any)[industry]?.[func]?.[selectedRole]
    ) {
      const roleSkills = (SKILLS as any)[industry][func][selectedRole];
      setSkills(roleSkills);
      setCache((prev) => ({ ...prev, [selectedRole]: roleSkills }));
      setExpanded(false);
      return;
    }

    setSkills(["❌ No skills found"]);
  };

  const functions = industry ? Object.keys((ROLES as any)[industry] || {}) : [];
  const roles = industry && func ? (ROLES as any)[industry]?.[func] || [] : [];

  const handleTileClick = async (skill: string) => {
    if (details[skill]) return; // already loaded

    try {
      const res = await fetch(`/api/getSkillDetail?skill=${encodeURIComponent(skill)}`);
      const text = await res.text();
      // extract <p> content from HTML response
      const match = text.match(/<p>(.*?)<\/p>/s);
      const detail = match ? match[1] : "No detail available.";
      setDetails((prev) => ({ ...prev, [skill]: detail }));
    } catch (err) {
      console.error("Failed to fetch detail:", err);
      setDetails((prev) => ({ ...prev, [skill]: "❌ Failed to load detail" }));
    }
  };

  return (
    <div className="phone-frame">
      <div className="role-selector">
        <h1 className="app-title">
          Welcome to LiveTiles™ <br />
          <span className="subtitle">The Ultimate Skills Engine 🚀</span>
        </h1>

        <p className="dropdown-label">🌐 Select Industry</p>
        <select
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

        <p className="dropdown-label">⚡ Select Function</p>
        <select
          value={func}
          onChange={(e) => {
            setFunc(e.target.value);
            setRole("");
            setSkills([]);
          }}
          disabled={!industry}
        >
          <option value="">Select Function</option>
          {functions.map((f: string) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <p className="dropdown-label">🎯 Select Role</p>
        <select
          value={role}
          onChange={(e) => {
            const selectedRole = e.target.value;
            setRole(selectedRole);
            fetchSkills(selectedRole);
          }}
          disabled={!func}
        >
          <option value="">Select Role</option>
          {roles.map((r: string) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <p className="dropdown-label">🔍 Search Skills</p>
        <div className="flex items-center gap-4 mb-4 justify-center">
          <div
            onClick={() => setSearchMode("domain")}
            className={`toggle-pill ${searchMode === "domain" ? "active" : ""}`}
          >
            Domain <span className="toggle-indicator red"></span>
          </div>
          <div
            onClick={() => setSearchMode("general")}
            className={`toggle-pill ${searchMode === "general" ? "active" : ""}`}
          >
            General <span className="toggle-indicator green"></span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 justify-center">
          <input
            type="text"
            value={query}
            placeholder="Type your question here"
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={() =>
              fetchSkills(searchMode === "domain" ? role : undefined, query)
            }
            disabled={!query}
            className="search-btn"
          >
            Search
          </button>
        </div>

        <div className="skills-grid">
          {(expanded ? skills : skills.slice(0, 3)).map((skill, idx) => (
            <TileCard
              key={idx}
              skill={skill}
              detail={details[skill]}
              onClick={() => handleTileClick(skill)}
            />
          ))}
        </div>

        {skills.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="expand-btn"
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
        )}
      </div>
    </div>
  );
}
