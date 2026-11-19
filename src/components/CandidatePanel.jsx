import { useEffect, useState } from "react";
import { gatherCandidates } from "../lib/gatherCandidates";

// ==================================================
// 1. STUN SERVER CONFIGURATIONS (outside the component
//    so each array keeps the same identity between renders)
// ==================================================
const CONFIGS = {
  none: [],
  stun: [{ urls: "stun:stun.l.google.com:19302" }],
  wrong: [{ urls: "stun:stun.invalid.example:3478" }],
};

// ==================================================
// 2. ROW COLOURS BY CANDIDATE TYPE
// ==================================================
const COLORS = {
  host: "#d5f0ec",
  srflx: "#fdecc8",
  relay: "#fbd9cf",
};

// ==================================================
// 3. REACT COMPONENT
// ==================================================
export default function CandidatePanel() {
  const [configName, setConfigName] = useState("stun");
  const [candidates, setCandidates] = useState([]);
  const [elapsed, setElapsed] = useState(null);
  const [gatherState, setGatherState] = useState("new"); // new | gathering | complete

  const iceServers = CONFIGS[configName];

  // ==================================================
  // 4. START GATHERING (restarts when the server list changes)
  // ==================================================
  useEffect(() => {
    let active = true;

    // clear the old run
    setCandidates([]);
    setElapsed(null);
    setGatherState("new");

    const start = performance.now();

    const stop = gatherCandidates({
      iceServers,

      onCandidate: (candidate) => {
        if (!active) return;
        setCandidates((prev) => [...prev, candidate]); // new array, no push
      },

      onDone: () => {
        if (!active) return;
        setElapsed(Math.round(performance.now() - start));
      },

      onStateChange: (s) => {
        if (!active) return;
        setGatherState(s);
      },
    });

    // cleanup: close the previous connection
    return () => {
      active = false;
      stop();
    };
  }, [iceServers]);

  // ==================================================
  // 5. SORT BY PRIORITY (copy first, highest first)
  // ==================================================
  const sorted = [...candidates].sort((a, b) => b.priority - a.priority);

  // ==================================================
  // 6. UI
  // ==================================================
  return (
    <div style={{ padding: "24px" }}>
      <h1>ICE Candidate Panel</h1>

      <select
        value={configName}
        onChange={(e) => setConfigName(e.target.value)}
      >
        <option value="none">No STUN</option>
        <option value="stun">Google STUN</option>
        <option value="wrong">Unreachable STUN</option>
      </select>

      <p>
        Gathering State: <strong>{gatherState}</strong>
      </p>
      <p>
        Gathering Time:{" "}
        {elapsed !== null ? `${elapsed} ms` : "Gathering..."}
      </p>

      <table
        style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}
      >
        <thead>
          <tr>
            <th>Type</th>
            <th>Protocol</th>
            <th>Address : Port</th>
            <th>Priority</th>
            <th>Foundation</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => (
            <tr key={c.candidate} style={{ background: COLORS[c.type] ?? "white" }}>
              <td>{c.type}</td>
              <td>{c.protocol}</td>
              <td>
                {c.address}:{c.port}
              </td>
              <td>{c.priority}</td>
              <td>{c.foundation}</td>
            </tr>
          ))}

          {sorted.length === 0 && (
            <tr>
              <td colSpan={5}>Waiting for candidates...</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
