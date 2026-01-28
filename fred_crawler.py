import os
import json
import math
from datetime import date
from dateutil.relativedelta import relativedelta

import pandas as pd
import requests
from pathlib import Path

# ---------- config ----------
FRED_API_KEY = os.getenv("FRED_API_KEY", "")
BASE = "https://api.stlouisfed.org/fred/series/observations"

OUT_XLSX = Path("data/FRED_macro_last10y.xlsx")
OUT_JSON_DIR = Path("macro-dashboard/public/data")  # website reads from here

YEARS_BACK = 10

# Map: "friendly_column_name": "FRED_SERIES_ID"
SERIES = {
    # Inflation
    "CPI_headline": "CPIAUCSL",
    "CPI_core": "CPILFESL",
    "PCE_headline": "PCEPI",
    "PCE_core": "PCEPILFE",
    "PPI_headline": "PPIACO",

    # Labor
    "NFP_payrolls": "PAYEMS",
    "Unemployment_rate": "UNRATE",

    # Rates
    "Treasury_10Y": "DGS10",
    "Treasury_2Y": "DGS2",


    # Policy (Fed Funds separated)
    "Fed_funds_rate": "DFF",  # Effective Federal Funds Rate (daily)

    # Financial Conditions
    "FCI_NFCI": "NFCI",
    "FCI_ANFCI": "ANFCI",
}

# Which columns belong to which sheet/tab
SHEETS = {
    "Inflation": ["CPI_headline", "CPI_core", "PCE_headline", "PCE_core", "PPI_headline"],
    "Labor": ["NFP_payrolls", "Unemployment_rate"],
    "Rates": ["Treasury_2Y", "Treasury_10Y"],
    "Policy": ["Fed_funds_rate"],  # <-- separated sheet for fed funds
    "Financial_Conditions": ["FCI_NFCI", "FCI_ANFCI"],
}

# Resampling: make everything monthly for consistent charts/tables
# "M" => month start frequency
MONTHLY_FREQ = "MS"

# For daily series like Fed funds / DGS10, choose monthly aggregation
DAILY_TO_MONTHLY_METHOD = {
    "Fed_funds_rate": "mean",
    "Treasury_10Y": "mean",
    "Treasury_2Y": "mean",
    "FCI_NFCI": "mean",
    "FCI_ANFCI": "mean",
}


# For already-monthly series, we keep as-is (just align to month start)
# --------------------------------


def fred_fetch(series_id: str, start_date: str) -> pd.DataFrame:
    if not FRED_API_KEY:
        raise RuntimeError("Missing FRED_API_KEY env var. Set it in PowerShell:  $env:FRED_API_KEY='YOUR_KEY'")

    params = {
        "series_id": series_id,
        "api_key": FRED_API_KEY,
        "file_type": "json",
    }

    if series_id not in ("NAPM", "NAPMPI"):
        params["observation_start"] = start_date

    r = requests.get(BASE, params=params, timeout=30)
    print("REQUESTED URL:", r.url)   # <-- add this line
    r.raise_for_status()

    obs = r.json().get("observations", [])

    # Build dataframe: date + value
    rows = []
    for o in obs:
        d = o.get("date")
        v = o.get("value")
        # FRED uses "." for missing
        if v == ".":
            rows.append((d, None))
        else:
            try:
                rows.append((d, float(v)))
            except ValueError:
                rows.append((d, None))

    df = pd.DataFrame(rows, columns=["date", series_id])
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date")
    return df


def to_month_start(df: pd.DataFrame) -> pd.DataFrame:
    # Convert any date to month-start timestamps for clean joins
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"]).dt.to_period("M").dt.to_timestamp(how="start")
    return df


def resample_monthly(df: pd.DataFrame, col: str, method: str) -> pd.DataFrame:
    # df has columns: date, col
    d = df.copy()
    d = d.set_index("date").sort_index()
    if method == "mean":
        m = d[col].resample(MONTHLY_FREQ).mean()
    elif method == "last":
        m = d[col].resample(MONTHLY_FREQ).last()
    else:
        raise ValueError(f"Unknown method: {method}")
    out = m.reset_index()
    return out


def json_safe_records(df: pd.DataFrame) -> list[dict]:
    # Convert NaN -> None so json is valid
    df2 = df.copy()
    for c in df2.columns:
        if c == "date":
            continue
        df2[c] = df2[c].apply(lambda x: None if (isinstance(x, float) and math.isnan(x)) else x)
    return df2.to_dict(orient="records")


def main():
    start = (date.today() - relativedelta(years=YEARS_BACK)).strftime("%Y-%m-%d")
    print("Fetching from:", start)

    # Fetch and normalize each series to a monthly date index
    series_frames = {}

    for friendly, fred_id in SERIES.items():
        print(f"Downloading {friendly} ({fred_id})...")
        raw = fred_fetch(fred_id, start)

        # rename value column to friendly name
        raw = raw.rename(columns={fred_id: friendly})

        # Decide if we should resample monthly
        if friendly in DAILY_TO_MONTHLY_METHOD:
            method = DAILY_TO_MONTHLY_METHOD[friendly]
            monthly = resample_monthly(raw, friendly, method=method)
        else:
            monthly = to_month_start(raw)  # keep monthly as month-start dates

        series_frames[friendly] = monthly

    # Build each sheet dataframe by merging on date
    OUT_XLSX.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON_DIR.mkdir(parents=True, exist_ok=True)

    with pd.ExcelWriter(OUT_XLSX, engine="openpyxl") as writer:
        for sheet, cols in SHEETS.items():
            # Start from first col, then merge others
            df = None
            for c in cols:
                d = series_frames[c]
                if df is None:
                    df = d
                else:
                    df = df.merge(d, on="date", how="outer")

            df = df.sort_values("date")
            # format date to yyyy-mm-dd for output consistency
            df_excel = df.copy()
            df_excel["date"] = df_excel["date"].dt.strftime("%Y-%m-%d")

            # Write Excel sheet
            df_excel.to_excel(writer, sheet_name=sheet, index=False)

            # Write JSON for website
            out_json = OUT_JSON_DIR / f"{sheet}.json"
            df_json = df.copy()
            df_json["date"] = pd.to_datetime(df_json["date"]).dt.strftime("%Y-%m-%d")

            # IMPORTANT: force object dtype so None can exist (otherwise floats turn None back to NaN)
            df_json = df_json.astype(object).where(pd.notnull(df_json), None)

            records = df_json.to_dict(orient="records")

            out_json.write_text(
                json.dumps(records, ensure_ascii=False, allow_nan=False),
                encoding="utf-8"
            )

            print(f"✔ {sheet}: {len(df_excel)} rows -> {out_json}")

    print("\nDONE")
    print("Excel:", OUT_XLSX.resolve())
    print("JSON dir:", OUT_JSON_DIR.resolve())


if __name__ == "__main__":
    main()
