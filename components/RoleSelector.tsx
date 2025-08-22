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
  const [openTile, setOpenTile] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>("");
  const [resetKey, setResetKey] = useState<number>(0); // 🔑 force UI reset

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
      if (searchMode === "domain") {
        if (selectedRole) url += `role=${encodeURIComponent(selectedRole)}&`;
        if (industry) url += `industry=${encodeURIComponent(industry)}&`;
        if (func) url += `func=${encodeURIComponent(func)}&`;
      }
      if (searchQuery) url += `query=${encodeURIComponent(searchQuery)}&`;
      url += `mode=${searchMode}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.skills && data.skills.length > 0) {
        setSkills(data.skills);
        if (key) setCache((prev) => ({ ...prev, [key]: data.skills }));
        setExpanded(false);
        setOpenTile(null);
        return;
      }
    } catch {
      console.warn("❌ API fetch failed, trying cache/local");
    }

    if (key && cache[key]) {
      setSkills(cache[key]);
      setExpanded(false);
      setOpenTile(null);
      return;
    }

    if (selectedRole && industry && func && (SKILLS as any)[industry]?.[func]?.[selectedRole]) {
      const roleSkills = (SKILLS as any)[industry][func][selectedRole];
      setSkills(roleSkills);
      setCache((prev) => ({ ...prev, [selectedRole]: roleSkills }));
      setExpanded(false);
      setOpenTile(null);
      return;
    }

    setSkills(["❌ No skills found"]);
  };

  const handleTileClick = async (skill: string) => {
    setOpenTile(openTile === skill ? null : skill);

    if (details[skill]) return;

    try {
      const res = await fetch(`/api/getSkillDetail?skill=${encodeURIComponent(skill)}`);
      const data = await res.json();
      setDetails((prev) => ({
        ...prev,
        [skill]: data.detail || "No detail available.",
      }));
    } catch {
      setDetails((prev) => ({
        ...prev,
        [skill]: "❌ Failed to load detail",
      }));
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
    setNotice("");
    setResetKey((prev) => prev + 1); // 🔑 force dropdown reset
  };

  const functions = industry ? Object.keys((ROLES as any)[industry] || {}) : [];
  const roles = industry && func ? (ROLES as any)[industry]?.[func] || [] : [];

  const handleSearch = () => {
    if (!query) return;
    setNotice("");
    fetchSkills(searchMode === "domain" ? role : undefined, query);
  };

  return (
    <div key={resetKey} className="phone-frame">
      <div className="role-selector">
        <h1 className="app-title">
          Welcome to Skills Forge™ <br />
          <span className="subtitle">Knowledge at warp speed 🌌</span>
        </h1>

        {/* Industry */}
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

        {/* Function */}
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

        {/* Role */}
        <p className="dropdown-label">🎯 Select Role</p>
        <select
          value={role}
          onChange={(e) => {
            const selectedRole = e.target.value;
            setRole(selectedRole);
            if (searchMode === "domain") {
              fetchSkills(selectedRole);
            }
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

        {/* Search */}
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
          <button
            onClick={handleSearch}
            disabled={!query}
            className="search-btn"
          >
            Search
          </button>
        </div>

        {/* Notice */}
        {notice && (
          <div className="notice-banner">⚠️ {notice}</div>
        )}

        {/* Skills Grid */}
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

        {/* Expand / Clear */}
        {skills.length > 0 && (
          <div className="button-row">
            {skills.length > 3 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="expand-btn"
              >
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
