import { subMonths, subYears, startOfYear, parseISO, isAfter } from "date-fns";

export function applyRange(rows, rangeKey) {
  if (!rows?.length) return rows;

  // rows: [{date:"YYYY-MM-DD", ...}]
  const lastDate = parseISO(rows[rows.length - 1].date);

  let cutoff;
  switch (rangeKey) {
    case "1M":
      cutoff = subMonths(lastDate, 1);
      break;
    case "6M":
      cutoff = subMonths(lastDate, 6);
      break;
    case "1Y":
      cutoff = subYears(lastDate, 1);
      break;
    case "YTD":
      cutoff = startOfYear(lastDate);
      break;
    case "2Y":
      cutoff = subYears(lastDate, 2);
      break;
    case "5Y":
      cutoff = subYears(lastDate, 5);
      break;
    default:
      return rows;
  }

  return rows.filter(r => isAfter(parseISO(r.date), cutoff) || r.date === cutoff.toISOString().slice(0,10));
}
