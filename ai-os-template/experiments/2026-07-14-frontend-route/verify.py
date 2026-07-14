#!/usr/bin/env python3
"""Deterministic checks shared by every frontend route experiment arm."""

from __future__ import annotations

import argparse
import re
from html.parser import HTMLParser
from pathlib import Path


STATES = {"available", "limited", "unavailable"}


class Inspector(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.selects: dict[str, set[str]] = {}
        self.label_fors: set[str] = set()
        self.live_regions: list[dict[str, str]] = []
        self.external_assets: list[str] = []
        self._select_id: str | None = None
        self.ordered_lists = 0

    def handle_starttag(self, tag: str, attrs) -> None:
        values = dict(attrs)
        if values.get("aria-live"):
            self.live_regions.append(values)
        if tag == "select":
            select_id = values.get("id")
            self._select_id = select_id
            if select_id:
                self.selects.setdefault(select_id, set())
        elif tag == "option" and self._select_id and values.get("value"):
            self.selects[self._select_id].add(values["value"])
        elif tag == "label" and values.get("for"):
            self.label_fors.add(values["for"])
        elif tag == "ol":
            self.ordered_lists += 1
        if tag == "script" and values.get("src"):
            self.external_assets.append(values["src"])
        if tag == "link" and values.get("href"):
            self.external_assets.append(values["href"])

    def handle_endtag(self, tag: str) -> None:
        if tag == "select":
            self._select_id = None


def check(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    lowered = text.lower()
    inspector = Inspector()
    inspector.feed(text)
    failures: list[str] = []

    if len(inspector.selects) != 3:
        failures.append("expected exactly three identified provider selects")
    for select_id, states in inspector.selects.items():
        if states != STATES:
            failures.append(f"{select_id} must expose available, limited, unavailable")
        if select_id not in inspector.label_fors:
            failures.append(f"{select_id} is missing an associated label")
    if inspector.ordered_lists < 1:
        failures.append("fallback routes must use an ordered list")
    if not any(region.get("aria-live") == "polite" for region in inspector.live_regions):
        failures.append("missing aria-live=polite region")
    if inspector.external_assets:
        failures.append("external assets are forbidden")

    required_literals = ["GLM-5.2", "Terra", "Composer", "Sol High"]
    for literal in required_literals:
        if literal not in text:
            failures.append(f"missing route literal: {literal}")
    for visible_label in ("Codex", "Z.ai", "Cursor", "Latest event", "Fallback"):
        if visible_label not in text:
            failures.append(f"missing visible label: {visible_label}")
    for required in ("addEventListener", "textContent", "change"):
        if required not in text:
            failures.append(f"missing safe interaction primitive: {required}")
    initial_call = re.search(
        r"\b(?:update|render|recalculate)\w*\((?:[^;]*\b(?:initial|null)\b[^;]*)?\);",
        text,
        re.IGNORECASE,
    )
    if "DOMContentLoaded" not in text and not initial_call:
        failures.append("route must calculate on initial load")

    if "@media" not in lowered or "max-width" not in lowered:
        failures.append("missing structural mobile breakpoint")
    if "prefers-reduced-motion" not in lowered:
        failures.append("missing reduced-motion handling")
    if ":focus-visible" not in lowered:
        failures.append("missing visible keyboard focus rule")
    if "oklch(" not in lowered:
        failures.append("expected OKLCH color tokens")

    forbidden = {
        "gradient(": "gradients",
        "background-clip: text": "gradient text",
        "backdrop-filter": "glassmorphism",
        "innerhtml": "innerHTML",
        "document.write": "document.write",
        "eval(": "eval",
        "—": "em dash",
    }
    for needle, label in forbidden.items():
        if needle in lowered:
            failures.append(f"forbidden pattern: {label}")
    if re.search(r"border-(left|right)\s*:\s*([2-9]|\d{2,})px", lowered):
        failures.append("forbidden side-stripe border")
    return failures


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("html", type=Path)
    args = parser.parse_args()
    failures = check(args.html)
    if failures:
        for failure in failures:
            print(f"FAIL: {failure}")
        return 1
    print("PASS: all deterministic frontend-route checks")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
