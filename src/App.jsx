import { useEffect, useMemo, useState } from "react";
import Tabs from "./components/Tabs";
import RangeButtons from "./components/RangeButtons";
import SeriesPicker from "./components/SeriesPicker";
import LineChartView from "./components/LineChartView";
import DataTable from "./components/DataTable";
import { TABS, RANGES } from "./config";
import { applyRange } from "./utils/timeRanges";

export default function App() {
  const [activeTab, setActiveTab] = useState(TABS[0].key);
  const [range, setRange] = useState("1Y");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [series, setSeries] = useState(null);

  const tab = TABS.find(t => t.key === activeTab);

  useEffect(() => {
  let alive = true;

  async function load() {
    setLoading(true);
    try {
      const currentTab = TABS.find(t => t.key === activeTab);
      if (!currentTab) return;

      // cache: "no-store" prevents stale data being reused
      const res = await fetch(currentTab.file, { cache: "no-store" });
      const data = await res.json();
      if (!alive) return;

      data.sort((a, b) => (a.date > b.date ? 1 : -1));
      setRows(data);

      const cols = Object.keys(data[0] || {}).filter(k => k !== "date");
      setSeries(prev => (prev && cols.includes(prev)) ? prev : (cols[0] || null));
    } finally {
      if (alive) setLoading(false);
    }
  }

  load();
  return () => { alive = false; };
  }, [activeTab]); // <-- key change: depend on activeTab


  const columns = useMemo(() => {
    if (!rows.length) return [];
    return Object.keys(rows[0]).filter(k => k !== "date");
  }, [rows]);

  const filtered = useMemo(() => applyRange(rows, range), [rows, range]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 18, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Jack Fan's Macro Dashboard</h1>
        <p style={{ margin: "6px 0 0", color: "#555" }}>
          Tabs by category. Select range and series to visualize.
        </p>
      </header>

      <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
        <Tabs tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Range</div>
            <RangeButtons ranges={RANGES} active={range} onChange={setRange} />
          </div>

          <div>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Series</div>
            <SeriesPicker columns={columns} active={series} onChange={setSeries} />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 20 }}>Loading…</div>
        ) : (
          <>
            <LineChartView data={filtered} yKey={series} />
            <DataTable rows={filtered} columns={columns} />
          </>
        )}
      </div>

      <footer style={{ marginTop: 18, fontSize: 12, color: "#777" }}>
        Data source: FRED. Frequencies differ (daily/weekly/monthly), so blanks are normal on some dates.
      </footer>
    </div>
  );
}
