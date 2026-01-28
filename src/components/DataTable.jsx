import { useMemo, useState } from "react";

export default function DataTable({ rows, columns }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // newest first
  const ordered = useMemo(() => rows.slice().reverse(), [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ordered;

    return ordered.filter((r) => {
      // match date
      if (String(r.date).toLowerCase().includes(q)) return true;

      // match any value
      for (const c of columns) {
        const v = r[c];
        if (v === null || v === undefined) continue;
        if (String(v).toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }, [ordered, columns, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const pageRows = useMemo(() => {
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize, totalPages]);

  // reset to page 1 when filters change
  useMemo(() => {
    setPage(1);
  }, [query, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: 12, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 12, color: "#666" }}>Search (date / value)</div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. 2024-10 or 4.13"
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #ddd",
              minWidth: 240,
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 12, color: "#666" }}>Rows per page</div>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #ddd" }}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
          </select>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={btn(page <= 1)}
          >
            Prev
          </button>
          <div style={{ fontSize: 13, color: "#333" }}>
            Page <b>{Math.min(page, totalPages)}</b> / {totalPages} &nbsp;•&nbsp; {filtered.length} rows
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={btn(page >= totalPages)}
          >
            Next
          </button>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#fafafa" }}>
            <tr>
              <th style={th}>date</th>
              {columns.map((c) => (
                <th key={c} style={th}>{c}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {pageRows.map((r, idx) => (
              <tr key={idx}>
                <td style={td}>{r.date}</td>
                {columns.map((c) => (
                  <td key={c} style={td}>
                    {r[c] === null || r[c] === undefined ? "" : r[c]}
                  </td>
                ))}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td style={{ padding: 12, color: "#666" }} colSpan={columns.length + 1}>
                  No rows match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #eee", fontSize: 13, whiteSpace: "nowrap" };
const td = { padding: "10px 12px", borderBottom: "1px solid #f2f2f2", fontSize: 13, whiteSpace: "nowrap" };

function btn(disabled) {
  return {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #ddd",
    background: disabled ? "#f5f5f5" : "#fff",
    color: disabled ? "#999" : "#111",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 600,
  };
}
