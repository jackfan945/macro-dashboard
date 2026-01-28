import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function LineChartView({ data, seriesKey }) {
  // Wider chart when more points -> allows horizontal scroll
  const minWidth = 700;
  const pxPerPoint = 20; // smaller = less wide, bigger = more scroll
  const chartWidth = Math.max(minWidth, data.length * pxPerPoint);

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        overflowY: "hidden",
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-x",
        border: "1px solid #eee",
        borderRadius: 14,
      }}
    >
      {/* This inner div makes the chart actually wider than the screen */}
      <div style={{ width: chartWidth, height: 380, padding: 12, boxSizing: "border-box" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" minTickGap={28} />
            <YAxis width={60} />
            <Tooltip />
            <Line type="monotone" dataKey={seriesKey} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
