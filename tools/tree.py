#!/usr/bin/env python3
"""
tree.py — portable directory tree for the GuitarApp repo.

Pure stdlib (no `tree` binary needed). Tuned for this repo's known build noise:
the 1.2GB gitignored 03-research/reference-repos vendor clones, .venv-kokoro,
.git, node_modules, dist/build output, and editor/OS cruft are excluded by
default so the build layout stays readable.

Usage:
  python tools/tree.py                       # tree the repo root (script's parent)
  python tools/tree.py 07-app                # tree a subdir
  python tools/tree.py -L 2                  # limit depth to 2
  python tools/tree.py -a                    # include hidden files
  python tools/tree.py -I 'godot|audio'      # extra ignore (regex on path parts)
  python tools/tree.py -d                    # directories only
  python tools/tree.py -s                    # show human-readable sizes
  python tools/tree.py -o tree.txt           # write to file

Flags combine:  python tools/tree.py 07-app -L 3 -s -I 'test'
"""

import argparse
import os
import re
import sys

# Default ignores: heavy / generated / secret / editor noise.
# `reference-repos` is also in .gitignore; listed here as a belt-and-braces guard.
DEFAULT_IGNORE = [
    r"\.git$", r"node_modules$", r"\.venv$", r"\.venv-kokoro$",
    r"dist$", r"build$", r"\.cache$", r"tmp$", r"temp$", r"__pycache__$",
    r"\.DS_Store$", r"Thumbs\.db$", r"\.idea$", r"\.vscode$",
    r"\.venv", r"reference-repos$", r"\.env",
]

# .gitignore-derived extra dirs (simple: lines that name a directory, no wildcards).
def load_gitignore_ignores(repo_root):
    extra = []
    gi = os.path.join(repo_root, ".gitignore")
    if not os.path.isfile(gi):
        return extra
    with open(gi, encoding="utf-8", errors="ignore") as f:
        for line in f:
            s = line.strip()
            if not s or s.startswith("#"):
                continue
            if "*" in s or "?" in s or s.startswith("/") or s.startswith("!"):
                continue  # skip patterns we don't parse
            name = s.rstrip("/")
            if name:
                extra.append(re.escape(name) + r"$")
    return extra


def human_size(n):
    # `n` is floored into the current unit's scale by the loop's n /= 1024.
    # NB: do NOT re-divide by 1024 here — that double-division was the old bug
    # that made every file >1KB report "0.0KB".
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if n < 1024 or unit == "TB":
            return f"{n:.0f}{unit}" if unit == "B" else f"{n:.1f}{unit}"
        n /= 1024
    return f"{n:.0f}B"


def build_ignore(repo_root, extra):
    pats = [re.compile(p) for p in DEFAULT_IGNORE]
    pats += [re.compile(p) for p in load_gitignore_ignores(repo_root)]
    if extra:
        for part in extra.split("|"):
            part = part.strip()
            if part:
                pats.append(re.compile(re.escape(part) + "$"))
    return pats


def is_ignored(name, pats):
    return any(p.search(name) for p in pats)


def walk(root, pats, depth, cur, max_depth, show_hidden, dirs_only, show_size):
    # collect entries
    try:
        names = os.listdir(root)
    except PermissionError:
        return
    if not show_hidden:
        names = [n for n in names if not n.startswith(".")]
    # exclude ignored
    names = [n for n in names if not is_ignored(n, pats)]
    dirs = sorted([n for n in names if os.path.isdir(os.path.join(root, n))])
    files = sorted([n for n in names if not os.path.isdir(os.path.join(root, n))])
    entries = dirs + files
    if dirs_only:
        entries = dirs

    for i, name in enumerate(entries):
        last = (i == len(entries) - 1)
        conn = "└── " if last else "├── "
        path = os.path.join(root, name)
        size = ""
        if show_size and os.path.isfile(path):
            try:
                size = f"  [{human_size(os.path.getsize(path))}]"
            except OSError:
                size = ""
        print(f"{cur}{conn}{name}{size}")
        if os.path.isdir(path):
            if max_depth is None or cur.count("│   ") + cur.count("    ") < max_depth - 1:
                if depth_ok(cur, max_depth):
                    walk(path, pats, depth + 1,
                         cur + ("    " if last else "│   "),
                         max_depth, show_hidden, dirs_only, show_size)


def depth_ok(cur, max_depth):
    if max_depth is None:
        return True
    # depth == number of ancestors already printed (count of connectors on cur)
    return cur.count("├── ") + cur.count("└── ") < max_depth


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(script_dir)  # tools/ -> repo root

    ap = argparse.ArgumentParser(description="Portable tree for GuitarApp")
    ap.add_argument("path", nargs="?", default=repo_root,
                    help="root to tree (default: repo root)")
    ap.add_argument("-L", "--max-depth", type=int, default=None,
                    help="max display depth")
    ap.add_argument("-a", "--all", action="store_true",
                    help="include hidden files")
    ap.add_argument("-I", "--ignore", default="",
                    help="extra ignore regex on path parts, '|'-separated")
    ap.add_argument("-d", "--dirs-only", action="store_true",
                    help="directories only")
    ap.add_argument("-s", "--size", action="store_true",
                    help="show human-readable file sizes")
    ap.add_argument("-o", "--output", default=None,
                    help="write tree to file instead of stdout")
    args = ap.parse_args()

    root = os.path.abspath(args.path)
    if not os.path.isdir(root):
        print(f"tree: {args.path}: Not a directory", file=sys.stderr)
        return 1

    pats = build_ignore(repo_root, args.ignore)

    # capture instead of print so we can also write to file
    import builtins
    old_print = builtins.print
    buffer = []
    def capture(s=""):
        buffer.append(str(s))
    builtins.print = capture

    try:
        print(root)
        walk(root, pats, 0, "", args.max_depth, args.all,
             args.dirs_only, args.size)
    finally:
        builtins.print = old_print

    text = "\n".join(buffer)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(text + "\n")
        print(f"tree: wrote {args.output}")
    else:
        print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
