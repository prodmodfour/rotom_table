# Obsidian CLI

Obsidian CLI (`obsidian`) controls the running Obsidian app from the terminal. Obsidian must be running for commands to work.

## Vault targeting

- If the terminal's cwd is inside a vault folder, that vault is used by default.
- Use `vault=<name>` as the **first** parameter to target a specific vault: `obsidian vault=Notes daily`
- Our vaults: `ptr`, `documentation`, `app` (under `vaults/`).

## Key commands for vault work

```shell
# Reading
obsidian read file=<name>              # read by wikilink-style name resolution
obsidian read path=<exact/path.md>     # read by exact vault-relative path
obsidian search query="<text>"         # search vault, returns file paths
obsidian search:context query="<text>" # search with matching line context

# Writing
obsidian create name=<name> content="<text>"  # create file (add `overwrite` flag to replace)
obsidian append file=<name> content="<text>"  # append to file
obsidian prepend file=<name> content="<text>" # prepend after frontmatter

# Structure
obsidian files folder=<path>           # list files (add `total` for count)
obsidian folders                       # list folders
obsidian tags counts                   # list tags with counts
obsidian backlinks file=<name>         # list backlinks to a file
obsidian links file=<name>             # list outgoing links
obsidian unresolved                    # list unresolved links (broken wikilinks)
obsidian orphans                       # files with no incoming links
obsidian outline file=<name>           # show heading structure

# Properties (frontmatter)
obsidian properties file=<name>                   # list properties
obsidian property:read name=<prop> file=<name>    # read a property value
obsidian property:set name=<prop> value=<val> file=<name>  # set a property

# File management
obsidian move file=<name> to=<path>    # move/rename (updates internal links)
obsidian rename file=<name> name=<new> # rename (updates internal links)
obsidian delete file=<name>            # trash file
```

## Parameters and flags

- **Parameters** take values: `param=value` or `param="value with spaces"`
- **Flags** are boolean switches with no value: `open`, `overwrite`, `total`
- Multiline content: use `\n` for newline, `\t` for tab
- Add `--copy` to any command to copy output to clipboard
- Output formats available on many commands: `format=json|tsv|csv|md`

## Developer commands (useful for automation)

```shell
obsidian eval code="<javascript>"      # run JS in Obsidian's context
obsidian dev:screenshot path=<file>    # screenshot the app
obsidian dev:errors                    # show JS errors
obsidian dev:console limit=<n>         # show console messages
```

## When to Use CLI vs Raw File Operations

| Use CLI for | Use Glob/Grep/Read for |
|-------------|----------------------|
| Finding entities by name/alias (wikilink resolution) | Reading specific known file paths |
| Tag-based queries | Pattern matching filenames |
| Backlink/link graph traversal | Regex content search |
| Broken link detection | Editing/writing files |


The CLI resolves wikilinks the same way Obsidian does, making `file=` lookups by entity name more reliable than grep patterns. Always prefer CLI search for entity lookups within the vault.
