import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function LineChartView({ data, seriesKey }) {
  // Make chart wider when there are more points
  const chartWidth = Math.max(700, data.length * 45); // tweak 45 if you want more/less density
  const chartHeight = 360;

  return (
    <div
      style={{
        width: "100%",
        overflowX: "auto",
        overflowY: "hidden",
        WebkitOverflowScrolling: "touch", // smooth iOS scrolling
        touchAction: "pan-x",             // allow horizontal swipe
        border: "1px solid #eee",
        borderRadius: 14,
      }}
    >
      <div style={{ width: chartWidth }}>
        <LineChart width={chartWidth} height={chartHeight} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" minTickGap={24} />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey={seriesKey}
            dot={false}
          />
        </LineChart>
      </div>
    </div>
  );
}
