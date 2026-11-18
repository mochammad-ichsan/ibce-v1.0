#!/usr/bin/env python3
"""Synthetic cross-implementation check, not cohort or biological validation.

Requires existing SciPy >= 1.12 providing scipy.stats.logrank, NumPy, Python
and Node.js 24. No installation, network, credentials or application services.
"""
import json
from pathlib import Path
import platform
import subprocess

import numpy
import scipy
from scipy.stats import CensoredData, logrank

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = json.loads((ROOT / "examples/numerical-reference-fixtures.json").read_text())
TOLERANCE = 2e-7

node_program = """
import fs from 'node:fs';
const {computeLogRank} = await import(process.argv[1]);
const fixtures = JSON.parse(fs.readFileSync(0, 'utf8'));
console.log(JSON.stringify(fixtures.map(f => computeLogRank(f.high, f.low))));
"""
node_run = subprocess.run(
    ["node", "--input-type=module", "-e", node_program,
     (ROOT / "artifacts/api-server/src/ibce/survival-analysis.ts").as_uri()],
    input=json.dumps(FIXTURES), text=True, capture_output=True, check=True,
)
implementation = json.loads(node_run.stdout)


def censored_data(rows):
    return CensoredData(
        uncensored=[r["time"] for r in rows if r["event"] == 1],
        right=[r["time"] for r in rows if r["event"] == 0],
    )


rows = []
for fixture, actual in zip(FIXTURES, implementation, strict=True):
    reference = logrank(censored_data(fixture["high"]), censored_data(fixture["low"]))
    expected = float(reference.pvalue)
    delta = None if actual is None else abs(actual - expected)
    passed = delta is not None and delta <= TOLERANCE
    rows.append({
        "fixture": fixture["name"],
        "implementation_p": actual,
        "scipy_p": expected,
        "scipy_statistic": float(reference.statistic),
        "absolute_difference": delta,
        "absolute_tolerance": TOLERANCE,
        "result": "PASS" if passed else "FAIL",
    })

report = {
    "scope": "Three synthetic numerical comparisons only; historical ten-gene claim NOT_RUN",
    "python": platform.python_version(),
    "scipy": scipy.__version__,
    "numpy": numpy.__version__,
    "node": subprocess.check_output(["node", "--version"], text=True).strip(),
    "node_stderr": node_run.stderr,
    "fixtures": rows,
}
print(json.dumps(report, indent=2, allow_nan=False))
raise SystemExit(0 if all(r["result"] == "PASS" for r in rows) else 1)
