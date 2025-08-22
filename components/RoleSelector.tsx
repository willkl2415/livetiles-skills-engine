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
  const [structured, setStructured] = useState<any>(null);
  const [details, setDetails] = useState<Record<string, string>>({});
  const [cache, setCache] = useState<Record<string, string[]>>({});
  const [query, setQuery] = useState<string>("");
  const [searchMode, setSearchMode] = useState<"domain" | "general">("domain");
  const [expanded, setExpanded] = useState<boolean>(false);
  const [openTile, setOpenTile] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>("");

  // Load cache
  useEffect(() => {
    const savedCache = localStorage.getItem("skillsCache");
    if (savedCache) setCache(JSON.parse(savedCache));
  }, []);
  useEffect(() => {
    localStorage.setItem("skillsCache", JSON.stringify(cache));
  }, [cache]);

  const fetchSkills = async (selectedRole?: string, searchQuery?: string) => {
    setNotice(""); setSkills([]); setStructured(null);

    let url = "/api/getSkills?";
    if (searchMode === "domain") {
      if (selectedRole) url += `role=${encodeURIComponent(selectedRole)}&`;
      if (industry) url += `industry=${encodeURIComponent(industry)}&`;
      if (func) url += `func=${encodeURIComponent(func)}&`;
    }
    if (searchQuery) url += `query=${encodeURIComponent(searchQuery)}&`;
    url += `mode=${searchMode}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.type === "warning") {
        setNotice(data.title);
        return;
      }
      if (data.type === "skills" && data.skills) {
        setSkills(data.skills);
        return;
      }
      setStructured(data);
    } catch {
      setNotice("❌ Failed to fetch data");
    }
  };

  const handleTileClick = async (skill: string) => {
    setOpenTile(openTile === skill ? null : skill);
    if (details[skill]) return;
    try {
      const res = await fetch(`/api/getSkillDetail?skill=${encodeURIComponent(skill)}`);
      const data = await res.json();
      setDetails((prev) => ({ ...prev, [skill]: data.detail || "No detail available." }));
    } catch {
      setDetails((prev) => ({ ...prev, [skill]: "❌ Failed to load detail" }));
    }
  };

  const handleClear = () => {
    setIndustry(""); setFunc(""); setRole(""); setQuery("");
    setSkills([]); setStructured(null); setDetails({});
    setExpanded(false); setOpenTile(null); setNotice("");
  };

  const functions = industry ? Object.keys((ROLES as any)[industry] || {}) : [];
  const roles = industry && func ? (ROLES as any)[industry]?.[func] || [] : [];

  const handleSearch = () => {
    if (!query) return;
    fetchSkills(searchMode === "domain" ? role : undefined, query);
  };

  return (
    <div className="phone-frame">
      <div className="role-selector">
        <h1 className="app-title">
          Welcome to Skills Forge™ <br />
          <span className="subtitle">Knowledge at warp speed 🌌</span>
        </h1>

        {/* Industry / Function / Role dropdowns (unchanged) */}

        <p className="dropdown-label">🔍 Search Skills</p>
        <div className="toggle-container">
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

        <div className="search-row">
          <input
            type="text"
            value={query}
            placeholder="Type your question here"
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={handleSearch} disabled={!query} className="search-btn">Search</button>
        </div>

        {notice && <div className="notice-banner">⚠️ {notice}</div>}

        {structured && (
          <div className="response-card">
            <h3>📌 {structured.title}</h3>
            {structured.steps && (
              <ul>{structured.steps.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
            )}
            {structured.pro_tip && <p>💡 {structured.pro_tip}</p>}
          </div>
        )}

        <div className="skills-grid">
          {(expanded ? skills : skills.slice(0, 3)).map((skill, idx) => (
            <TileCard
              key={idx}
              skill={skill}
              detail={details[skill]}
              isOpen={openTile === skill}
              onClick={() => handleTileClick(skill)}
            />
          ))}
        </div>

        {(skills.length > 0 || structured) && (
          <div className="button-row">
            {skills.length > 3 && (
              <button onClick={() => setExpanded(!expanded)} className="expand-btn">
                {expanded ? "Collapse" : "Expand"}
              </button>
            )}
            <button onClick={handleClear} className="clear-btn">Clear</button>
          </div>
        )}
      </div>
    </div>
  );
}
