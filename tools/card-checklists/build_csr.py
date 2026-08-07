#!/usr/bin/env python3
"""DEPRECATED shim. The generator is now split into:
  - build_companion.py   the generic renderer (layout/draw code)
  - cards/<card>.py      per-card data (cards/csr.py = Chase Sapphire Reserve)

Kept so `python build_csr.py` still produces the CSR checklist. New work goes
to build_companion.py (`python build_companion.py --card <name>`). See README.md.
"""
import os, sys, subprocess
sys.exit(subprocess.call(
    [sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)),
     "build_companion.py"), "--card", "csr"]))
