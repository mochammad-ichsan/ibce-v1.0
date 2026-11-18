#!/usr/bin/env python3
"""Offline structural checks, not a complete security or scientific audit."""
from pathlib import Path
from urllib.parse import unquote, urlsplit
import hashlib
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []
files = [
    p for p in ROOT.rglob("*")
    if p.is_file() and not {".git", "node_modules", "__pycache__"}.intersection(p.relative_to(ROOT).parts)
]
paths = {p.relative_to(ROOT).as_posix() for p in files}


def fail(message):
    errors.append(message)


def anchor(heading):
    return re.sub(r"[^a-z0-9_\-\s]", "", heading.lower()).replace(" ", "-")


for path in [p for p in files if p.suffix == ".md"]:
    text = path.read_text()
    rel = path.relative_to(ROOT)
    targets = re.findall(r"!?\[[^\]]*\]\(([^)\s]+)\)", text)
    targets += re.findall(r'<(?:img|a)\b[^>]*\b(?:src|href)="([^"]+)"', text)
    for target in targets:
        if urlsplit(target).scheme or target.startswith("//"):
            continue
        parts = urlsplit(unquote(target))
        resolved = (path.parent / parts.path).resolve() if parts.path else path
        if not resolved.is_relative_to(ROOT):
            fail(f"{rel}: link escapes candidate")
        elif not resolved.exists():
            fail(f"{rel}: missing relative target {target}")
        elif parts.fragment and resolved.suffix == ".md":
            headings = re.findall(r"^#{1,6}\s+(.+?)\s*#*\s*$", resolved.read_text(), re.M)
            if parts.fragment not in {anchor(h) for h in headings}:
                fail(f"{rel}: missing anchor {target}")
    if chr(0x2014) in text:
        fail(f"{rel}: prohibited punctuation")
    if text.count("```") % 2:
        fail(f"{rel}: unclosed fenced block")

manifest = ROOT / "SOURCE_MANIFEST.sha256"
source_count = 0
for line in manifest.read_text().splitlines():
    expected, relative = line.split(maxsplit=1)
    path = ROOT / relative.strip()
    if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
        fail(f"Source integrity mismatch: {relative}")
    source_count += 1

# Git blob IDs observed directly in the baseline public GitHub tree.
controls = {
    "LICENSE.md": "fe70743c8b6452b97eb1368d73d36f56f754d1fe",
    "SOURCE_ATTRIBUTION.md": "2f516d0de160e663a6a123751715a53f913e4333",
    "SOURCE_MANIFEST.sha256": "21d6a0738ac88deb1c465a78d5182166efaf4ae1",
    ".gitignore": "a39d441b089f77b0be52b93481c0147fb3464496",
}
for name, expected in controls.items():
    data = (ROOT / name).read_bytes()
    blob = hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()
    if blob != expected:
        fail(f"Baseline control changed: {name}")

cff = (ROOT / "CITATION.cff").read_text()
for field in ("cff-version", "message", "type", "title", "authors", "repository-code", "url", "license"):
    if not re.search(rf"^{field}:", cff, re.M):
        fail(f"Citation missing field: {field}")
if "cff-version: 1.2.0" not in cff or "type: software" not in cff:
    fail("Unexpected citation format/type")
if "PolyForm-Noncommercial-1.0.0" not in cff:
    fail("Citation license mismatch")
if re.search(r"^(doi|orcid|date-released|version):", cff, re.M):
    fail("Unverified release/identity metadata requires review")

secret_patterns = [
    re.compile(r"\b(?:sk_live_|sk_test_|ghp_|github_pat_|AKIA)[A-Za-z0-9_]{12,}"),
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"postgres(?:ql)?://[^\s/'\"]+:[^\s'\"@]+@", re.I),
]
for path in files:
    if path.suffix.lower() in {".png", ".jpg", ".jpeg"}:
        continue
    text = path.read_text(errors="replace")
    if any(pattern.search(text) for pattern in secret_patterns):
        # Never print matching content, values or an exception with a secret.
        fail(f"Potential sensitive literal: {path.relative_to(ROOT)}")
    if path.name in {".env", ".env.local"} or path.suffix.lower() in {".csv", ".tsv", ".sql", ".dump", ".pem"}:
        fail(f"Unexpected data/credential file: {path.relative_to(ROOT)}")

required = [
    "docs/portfolio-audit/QUALITY_ASSURANCE.md",
    "docs/portfolio-audit/NUMERICAL_REFERENCE.md",
    "docs/portfolio-audit/evidence/runtime-execution.json",
    "examples/synthetic-survival-demo.mjs",
    "examples/verify-numerical-reference.py",
    "examples/numerical-reference-fixtures.json",
]
required += [f"docs/portfolio/{x}.md" for x in (
    "PROJECT_OVERVIEW", "SCIENTIFIC_WORKFLOW", "CONTRIBUTIONS", "VALIDATION_EVIDENCE",
    "LIMITATIONS", "RESEARCH_ROADMAP", "AI_ASSISTED_DEVELOPMENT",
)]
required += [f"docs/ibios-portfolio-standard/{x}.md" for x in (
    "README", "PORTFOLIO_TEMPLATE", "SCIENTIFIC_EVIDENCE_MATRIX",
    "AI_DISCLOSURE_TEMPLATE", "PUBLICATION_CHECKLIST",
    "REPOSITORY_SETTINGS_CHECKLIST", "ADOPTION_GUIDE",
)]
for name in required:
    if name not in paths:
        fail(f"Required document missing: {name}")

for message in errors:
    print("FAIL:", message)
print(f"{'FAIL' if errors else 'PASS'}: {len(files)} candidate files; {source_count} source hashes; links, controls, citation fields and limited disclosure patterns.")
print("CFF schema, Mermaid grammar, scientific validity and exhaustive secret detection are not established by this script.")
sys.exit(bool(errors))
