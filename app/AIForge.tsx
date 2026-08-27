"use client";

import { useState } from "react";
import type { Quest, SkillPath } from "@/lib/types";

type Generated = {
  path: {
    name: string;
    glyph: string;
    capability: string;
    region: string;
    nodes: { title: string; xpRequired: number; boss: boolean }[];
  };
  firstQuest: { title: string; proof: string; xp: number };
  weeklyBoss: { title: string; proof: string; xp: number };
  rationale: string;
};

export default function AIForge({
  onAdd
}: {
  onAdd: (path: SkillPath, quests: Quest[]) => void;
}) {
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("beginner");
  const [capacity, setCapacity] = useState("steady");
  const [context, setContext] = useState("");
  const [result, setResult] = useState<Generated | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!goal.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, level, capacity, context })
      });

      const raw = await res.text();
      let data: any = null;

      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          throw new Error(`Server returned a non-JSON response (${res.status}). Check the Codespaces terminal for the underlying API error.`);
        }
      }

      if (!res.ok) {
        throw new Error(data?.error || `AI request failed with status ${res.status}.`);
      }

      if (!data) {
        throw new Error("The AI route returned an empty response. Check the Codespaces terminal for the underlying API error.");
      }

      if (!data.path || !Array.isArray(data.path.nodes) || !data.firstQuest || !data.weeklyBoss) {
        throw new Error("The AI returned an incomplete progression. Please try again.");
      }

      setResult(data as Generated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate progression.");
    } finally {
      setBusy(false);
    }
  }

  function commit() {
    if (!result) return;
    const id = result.path.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `path-${Date.now()}`;
    const path: SkillPath = {
      id,
      name: result.path.name,
      glyph: result.path.glyph || "✦",
      tone: "gold",
      region: result.path.region || "UNMAPPED / NEW PATH",
      capability: result.path.capability,
      nodes: result.path.nodes.map((n, i) => ({
        id: `${id}-${i + 1}`,
        title: n.title,
        order: i + 1,
        xpRequired: n.xpRequired,
        boss: n.boss
      }))
    };

    const quests: Quest[] = [
      {
        id: `q-${Date.now()}`,
        pathId: id,
        title: result.firstQuest.title,
        proof: result.firstQuest.proof,
        xp: result.firstQuest.xp,
        kind: "daily",
        nodeId: `${id}-1`
      },
      {
        id: `week-${Date.now()}`,
        pathId: id,
        title: result.weeklyBoss.title,
        proof: result.weeklyBoss.proof,
        xp: result.weeklyBoss.xp,
        kind: "weekly",
        nodeId: `${id}-2`
      }
    ];

    onAdd(path, quests);
    setResult(null);
    setGoal("");
    setContext("");
  }

  return (
    <section className="ai-forge">
      <div className="ai-forge-head">
        <div>
          <p className="kicker">PHASE 16 / AI FORGE</p>
          <h2>What do you want to become capable of?</h2>
          <p>BECOMR turns one goal into an ordered path, your first Proof Trial, and a Weekly Boss.</p>
        </div>
        <div className="ai-mark">✦</div>
      </div>

      <div className="ai-form">
        <label>
          GOAL
          <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="Become conversational in Spanish, learn portrait photography, build mobile apps..." />
        </label>
        <div className="ai-grid">
          <label>
            CURRENT LEVEL
            <select value={level} onChange={e => setLevel(e.target.value)}>
              <option value="beginner">Beginner</option>
              <option value="some experience">Some experience</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label>
            CAPACITY
            <select value={capacity} onChange={e => setCapacity(e.target.value)}>
              <option value="low">Low</option>
              <option value="steady">Steady</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>
        <label>
          CONTEXT <span>OPTIONAL</span>
          <textarea value={context} onChange={e => setContext(e.target.value)} placeholder="Tools I own, deadlines, what I've already tried, constraints..." />
        </label>
        {error && <div className="ai-error">{error}</div>}
        <button className="ai-generate" onClick={generate} disabled={busy || !goal.trim()}>{busy ? "FORGING PATH…" : "FORGE MY PATH"}</button>
      </div>

      {result && (
        <div className="ai-preview">
          <div className="ai-preview-title">
            <span>{result.path.glyph}</span>
            <div><small>PROPOSED PATH</small><h3>{result.path.name}</h3><p>{result.path.capability}</p></div>
          </div>

          <div className="ai-node-list">
            {result.path.nodes.map((n, i) => (
              <div key={`${n.title}-${i}`}><span>{String(i + 1).padStart(2, "0")}</span><strong>{n.title}</strong><small>{n.xpRequired} XP {n.boss ? "· BOSS" : ""}</small></div>
            ))}
          </div>

          <div className="ai-quests-preview">
            <article><small>FIRST TRIAL</small><h4>{result.firstQuest.title}</h4><p>{result.firstQuest.proof}</p><b>+{result.firstQuest.xp} XP</b></article>
            <article><small>WEEKLY BOSS</small><h4>{result.weeklyBoss.title}</h4><p>{result.weeklyBoss.proof}</p><b>+{result.weeklyBoss.xp} XP</b></article>
          </div>

          <div className="ai-rationale"><small>WHY THIS ORDER</small><p>{result.rationale}</p></div>
          <button className="ai-commit" onClick={commit}>INSCRIBE PATH INTO MY COMPASS</button>
        </div>
      )}
    </section>
  );
}
