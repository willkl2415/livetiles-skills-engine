"use client";

import { useState, useEffect } from "react";
import { ROLES } from "../app/data/roles.js";
import "../app/styles/skills.css";
import TileCard from "./TileCard";

export default function RoleSelector() {
  const [industry, setIndustry] = useState<string>("");
  const [func, setFunc] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [skills, setSkills] = useState<{ text: string; type: "skill" | "warning" }[]>([]);
  const [details, setDetails] = useState<Record<string, string>>({});
  const [query, setQuery] = useState<string>("");
  const [searchMode, setSearchMode] = useState<"domain" | "general">("domain");
  const [expanded, setExpanded] = useState<boolean>(false);
  const [openTile, setOpenTile] = useState<string | null>(null);

  useEffect(() => {
    setDetails({});
    setExpanded(false);
    setOpenTile(null);
  }, [industry, func, role, searchMode]);

  const fetchSkills = async (selectedRole?: string, searchQuery?: string) => {
    try {
      let url = "";

      if (searchMode === "domain") {
        if (!selectedRole && !role) {
          setSkills([{ text: "⚠️ Domain search requires a role. Please select a role first.", type: "warning" }]);
          return;
        }
        url = "/api/getDomainSkills?";
        if (selectedRole) url += `role=${encodeURIComponent(selectedRole)}&`;
        if (industry) url += `industry=${encodeURIComponent(industry)}&`;
        if (func) url += `func=${encodeURIComponent(func)}&`;
        if (searchQuery) url += `query=${encodeURIComponent(searchQuery)}`;
      } else {
        if (industry || func || role) {
          setSkills([{ text: "⚠️ General search ignores industry, function, and role. Please clear them or switch to Domain search.", type: "warning" }]);
          return;
        }
        url = `/api/getGeneralSkills?query=${encodeURIComponent(searchQuery || "")}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        setSkills([{ text: `⚠️ ${data.error}`, type: "warning" }]);
        return;
      }

      if (data.skills && data.skills.length > 0) {
        setSkills(data.skills.map((s: string) => ({ text: s, type: "skill" })));
        setExpanded(false);
        setOpenTile(null);
        return;
      }

      setSkills([{ text: "❌ No skills found", type: "warning" }]);
    } catch {
      setSkills([{ text: "❌ Failed to fetch skills", type: "warning" }]);
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
    setIndustry("");
    setFunc("");
    setRole("");
    setQuery("");
    setSkills([]);
    setDetails({});
    setExpanded(false);
    setOpenTile(null);
    setSearchMode("domain");
  };

  const functions: string[] = industry ? Object.keys((ROLES as any)[industry] || {}) : [];
  const roles: string[] = industry && func ? (ROLES as any)[industry]?.[func] || [] : [];

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

        {/* Industry Dropdown */}
        <p className="dropdown-label">🌐 Select Industry</p>
        <select
          value={industry}
          onChange={(e) => {
            setIndustry(e.target.value);
            setFunc("");
            setRole("");
          }}
          disabled={searchMode === "general"}
        >
          <option value="">Select Industry</option>
          {Object.keys(ROLES).map((ind: string) => (
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>

        {/* Function Dropdown */}
        <p className="dropdown-label">⚡ Select Function</p>
        <select
          value={func}
          onChange={(e) => {
            setFunc(e.target.value);
            setRole("");
          }}
          disabled={!industry || searchMode === "general"}
        >
          <option value="">Select Function</option>
          {functions.map((f: string) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        {/* Role Dropdown */}
        <p className="dropdown-label">🎯 Select Role</p>
        <select
          value={role}
          onChange={(e) => {
            const selectedRole = e.target.value;
            setRole(selectedRole);
            if (searchMode === "domain") fetchSkills(selectedRole);
          }}
          disabled={!func || searchMode === "general"}
        >
          <option value="">Select Role</option>
          {roles.map((r: string) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {/* Toggle */}
        <p className="dropdown-label">🔍 Search Mode</p>
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

        {/* Search */}
        <div className="search-row">
          <input
            type="text"
            value={query}
            placeholder="Type your question here"
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={handleSearch} disabled={!query} className="search-btn">
            Search
          </button>
        </div>

        {/* Skills Grid */}
        <div className="skills-grid">
          {(expanded ? skills : skills.slice(0, 3)).map((s, idx: number) => (
            <TileCard
              key={idx}
              skill={s.text}
              type={s.type}
              detail={details[s.text]}
              isOpen={openTile === s.text}
              onClick={() => s.type === "skill" && handleTileClick(s.text)}
            />
          ))}
        </div>

        {/* Buttons */}
        {skills.length > 0 && (
          <div className="button-row">
            {skills.length > 3 && (
              <button onClick={() => setExpanded(!expanded)} className="expand-btn">
                {expanded ? "Collapse" : "Expand"}
              </button>
            )}
            <button onClick={handleClear} className="clear-btn">
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
