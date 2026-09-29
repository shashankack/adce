#!/usr/bin/env python3
"""stdin AnalyzeRequest JSON -> stdout {"suggestions": [...]}"""

from __future__ import annotations

import json, sys

from adce_ml.analyze import analyze_request


def main() -> None:
    req = json.load(sys.stdin)
    json.dump({"suggestions": analyze_request(req)}, sys.stdout)


if __name__ == "__main__":
    main()
