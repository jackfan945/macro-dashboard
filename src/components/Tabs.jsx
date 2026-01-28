export default function Tabs({ tabs, activeKey, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {tabs.map(t => {
        const active = t.key === activeKey;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: active ? "#111" : "#fff",
              color: active ? "#fff" : "#111",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
