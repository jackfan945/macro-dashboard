export default function SeriesPicker({ columns, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {columns.map(c => {
        const isActive = c === active;
        return (
          <button
            key={c}
            onClick={() => onChange(c)}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: isActive ? "#111" : "#fff",
              color: isActive ? "#fff" : "#111",
              cursor: "pointer",
              fontWeight: 600
            }}
            title={c}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}
