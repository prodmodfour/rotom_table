#!/usr/bin/env python3
"""
Generate a graph index for Obsidian vault directories.

Parses [[wikilinks]] from .md files, builds adjacency lists,
and writes a GRAPH-INDEX.md alongside the vault's CLAUDE.md.

Usage:
    python3 scripts/generate-graph-index.py vaults/documentation
    python3 scripts/generate-graph-index.py vaults/ptr/rules
    python3 scripts/generate-graph-index.py --all
"""

import sys
import re
from pathlib import Path
from collections import defaultdict
from datetime import date

WIKILINK_RE = re.compile(r'\[\[([^\]]+)\]\]')

REPO_ROOT = Path(__file__).resolve().parent.parent
VAULTS_ROOT = REPO_ROOT / 'vaults'

# Directories to index with --all
ALL_DIRS = [
    'vaults/documentation',
    'vaults/documentation/software-engineering',
    'vaults/ptr/rules',
    'vaults/ptr/ptr_traits',
]

# Files to skip (not vault notes)
SKIP_FILES = {'CLAUDE.md', 'GRAPH-INDEX.md'}


def extract_target(wikilink_content: str) -> str:
    """Extract target note name from [[target|display]] or [[target#header]]."""
    target = wikilink_content.split('|')[0]
    target = target.split('#')[0]
    return target.strip()


def resolve_location(target: str, local_notes: set[str]) -> str:
    """Determine where a link target lives."""
    if target in local_notes:
        return 'local'
    # Search full vaults tree
    matches = list(VAULTS_ROOT.rglob(f'{target}.md'))
    if matches:
        rel = matches[0].relative_to(VAULTS_ROOT)
        return str(rel.parent)
    return 'unresolved'


def parse_directory(directory: Path) -> tuple[dict, dict, set]:
    """Parse wikilinks from all .md files in directory (non-recursive).

    Returns (outgoing, incoming, all_notes).
    outgoing[note] = [unique targets in order of first appearance]
    incoming[note] = [unique sources in order of first appearance]
    """
    outgoing: dict[str, list[str]] = {}
    incoming: dict[str, list[str]] = defaultdict(list)
    all_notes: set[str] = set()

    for md_file in sorted(directory.glob('*.md')):
        if md_file.name in SKIP_FILES:
            continue

        note = md_file.stem
        all_notes.add(note)

        content = md_file.read_text(encoding='utf-8', errors='replace')
        raw_links = WIKILINK_RE.findall(content)

        seen = set()
        targets = []
        for link in raw_links:
            t = extract_target(link)
            if t and t != note and t not in seen:
                seen.add(t)
                targets.append(t)
        outgoing[note] = targets

    # Build incoming from outgoing
    for source, targets in outgoing.items():
        for t in targets:
            if source not in incoming[t]:
                incoming[t].append(source)

    return outgoing, incoming, all_notes


def generate_index(directory: Path) -> str:
    outgoing, incoming, all_notes = parse_directory(directory)

    # Degrees
    degrees = {}
    for note in all_notes:
        o = len(outgoing.get(note, []))
        i = len(incoming.get(note, []))
        degrees[note] = (o, i, o + i)

    sorted_notes = sorted(all_notes, key=lambda n: degrees[n][2], reverse=True)

    # Stats
    total_links = sum(len(v) for v in outgoing.values())
    avg_out = total_links / len(all_notes) if all_notes else 0

    # Resolution stats
    all_targets = set()
    for targets in outgoing.values():
        all_targets.update(targets)

    resolution = defaultdict(int)
    for t in all_targets:
        resolution[resolve_location(t, all_notes)] += 1

    # Build output
    rel_dir = directory.relative_to(REPO_ROOT)
    lines = [
        f'# Graph Index: {rel_dir}',
        f'# Generated: {date.today()}',
        f'# Notes: {len(all_notes)} | Links: {total_links} | Avg out-degree: {avg_out:.1f}',
        '#',
        '# Link resolution (unique targets):',
    ]
    for loc, count in sorted(resolution.items(), key=lambda x: -x[1]):
        lines.append(f'#   {loc}: {count}')
    lines.append('#')
    lines.append('# Format: note-name [out:N in:N]')
    lines.append('#   -> outgoing (this note links to)')
    lines.append('#   <- incoming (links to this note)')
    lines.append('')

    for note in sorted_notes:
        o, i, _ = degrees[note]
        lines.append(f'{note} [out:{o} in:{i}]')

        if outgoing.get(note):
            lines.append(f'  -> {", ".join(outgoing[note])}')

        if incoming.get(note):
            lines.append(f'  <- {", ".join(incoming[note])}')

        lines.append('')

    return '\n'.join(lines)


def main():
    if len(sys.argv) < 2:
        print(f'Usage: {sys.argv[0]} <vault-directory> | --all')
        sys.exit(1)

    if sys.argv[1] == '--all':
        dirs = [REPO_ROOT / d for d in ALL_DIRS]
    else:
        dirs = [Path(sys.argv[1]).resolve()]

    for directory in dirs:
        if not directory.is_dir():
            print(f'Skipping {directory}: not a directory', file=sys.stderr)
            continue

        index = generate_index(directory)
        output = directory / 'GRAPH-INDEX.md'
        output.write_text(index, encoding='utf-8')
        print(f'  {output.relative_to(REPO_ROOT)}')

    print('Done. Indexes are current.')


if __name__ == '__main__':
    main()
