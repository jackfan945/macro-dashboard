export default function RangeButtons({ ranges, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {ranges.map(r => {
        const isActive = r.key === active;
        return (
          <button
            key={r.key}
            onClick={() => onChange(r.key)}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: isActive ? "#111" : "#fff",
              color: isActive ? "#fff" : "#111",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
