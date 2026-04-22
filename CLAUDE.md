# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository

- **GitHub:** https://github.com/MarcoB-MD/ClaudeCode-The-Knowledge
- **Owner:** MarcoB-MD (dr.m.badwal@gmail.com)
- **Local path:** /Users/marco/ClaudeCode_The-Knowledge
- **Default branch:** main

## Web Browser View

Run the local web server to browse and read all entries in the browser:

```bash
npm start          # starts at http://localhost:3000
```

First time only (or after cloning fresh): run `npm install` first.

The browser UI shows an index of all entries as cards (filterable by type and tag, searchable), and a full detail view for each entry with all fields nicely laid out. The server reads the Markdown files live — no rebuild needed after adding entries.

## Auto-Save to GitHub

A `Stop` hook is configured in `.claude/settings.json`. Every time a Claude Code session ends, it automatically stages all changes, commits with a timestamp (`Auto-save: YYYY-MM-DD HH:MM`), and pushes to GitHub — but only if there are uncommitted changes. No manual `git commit` or `git push` is needed during normal work.

To review or disable the hook: open `/hooks` in Claude Code.

## Manual Git Commands

```bash
git add -A && git commit -m "message" && git push   # manual save
git status                                           # check uncommitted changes
git log --oneline -10                                # recent history
```

## Session Setup Recap

This project was initialized on 2026-04-22 with:
1. `git init` + initial commit of CLAUDE.md
2. GitHub repo created via `gh repo create` and pushed
3. `.claude/settings.json` created with the Stop auto-save hook
4. Knowledge base system built (entries, tag index, `/add` command)

---

## Knowledge Management System

This repository is a personal knowledge base for cataloging what Marco learns from books, articles, podcasts, audiobooks, and other sources. Entries are Markdown files with YAML frontmatter. Claude is the interface — Marco describes a source in conversation and Claude creates the structured entry.

### Orientation at the Start of a New Session

```bash
find entries -name "*.md" | wc -l   # total entry count
git log --oneline -5                 # recent changes
```

Then read `_index/tags.md` to understand what topics are covered.

### Folder Structure

```
entries/
  books/          ← one .md file per book
  articles/       ← one .md file per article
  podcasts/       ← one .md file per podcast episode
  audiobooks/     ← one .md file per audiobook
  other/          ← anything that doesn't fit above
_index/
  tags.md         ← master tag index; always kept in sync
.claude/
  commands/
    add.md        ← /add slash command
```

### Adding an Entry

Use `/add` to start the guided flow. If Marco describes a source conversationally without typing `/add`, recognize the pattern and ask "Should I add this as a knowledge base entry?"

Do not write entry files directly without following the `/add` procedure — the tag index will fall out of sync.

### File Naming

`YYYY-MM-DD_slugified-title.md` — date is `date_added` (when the entry is created, not when the source was consumed). Slug: lowercase, spaces → hyphens, no punctuation except hyphens, max 60 chars.

### YAML Frontmatter

**Required:** `title`, `author`, `source_type`, `date_consumed`, `date_added`, `tags`, `related`  
**Optional (omit entirely if not applicable):** `url`, `isbn`  
**`source_type` values:** `book` | `article` | `podcast` | `audiobook` | `other`

Never leave a field blank or with an empty string — omit it instead.

### Tag Index Maintenance

`_index/tags.md` is the authoritative record of all tags. Update it every time an entry is added or its tags change. Never leave it stale.

Update procedure (full rewrite each time):
1. Read the full current `_index/tags.md`
2. For each tag in the new/changed entry, find or create its H2 section
3. Add the entry line: `- [Title](../entries/<type>/filename.md) — Author (type, YYYY-MM-DD)`
4. Re-sort all H2 sections alphabetically by tag name
5. Update the "Last updated" date at the top
6. Write the complete file

### Related Entry Suggestions

When adding a new entry, read `_index/tags.md` and count tag overlap with existing entries before writing any files. Entries sharing 2+ tags are strong candidates; 1 tag is a weak candidate. Present top matches to Marco and wait for confirmation. Skip this step if the knowledge base has fewer than 5 entries.

### Content Rules

- Never invent or add information Marco did not provide (no AI-generated summaries)
- Structure and lightly edit Marco's own words
- Preserve his voice in the Takeaways section
- Omit `Notable Quotes` and `Related Entries` body sections if there is no content for them

### GitHub Saving

The Stop hook auto-saves all changes at the end of every session. No manual git operations are needed during normal knowledge-base work.
