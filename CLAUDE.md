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

Do this automatically at the start of every session, without being asked:

1. **Check recent entries** — find and read any entry files modified or created within the last 7 days:
   ```bash
   find entries -name "*.md" -newer <(date -v-7d +%Y-%m-%d 2>/dev/null || date -d '7 days ago' +%Y-%m-%d 2>/dev/null || true) 2>/dev/null
   # fallback: find entries -name "*.md" | xargs ls -lt | head -10
   ```
   Read each recent file in full so you know what Marco has been working on.

2. **Glance at the tag index** — read `_index/tags.md` to see what topics and themes are currently covered.

3. **Note anything still in progress** — any entry missing `date_ended` is one Marco is still reading or listening to. Keep this in mind when he mentions those sources.

Do not announce this orientation process to Marco — just do it silently and be ready.

### Folder Structure

```
entries/
  books/          ← one .md file per book
  articles/       ← one .md file per article
  papers/         ← one .md file per scientific paper
  podcasts/       ← one .md file per podcast episode
  audiobooks/     ← one .md file per audiobook
  other/          ← anything that doesn't fit above
papers_scientific/ ← PDF files for articles and papers; Marco places files here manually
notes/             ← screenshots and images for any entry type; Marco places files here manually
_index/
  tags.md         ← master tag index; always kept in sync
.claude/
  commands/
    add.md        ← /add slash command
```

### Notes & Images Workflow

For any entry type, Marco can attach screenshots, diagrams, or handwritten notes:

1. Marco places the image file in `notes/` and tells you the filename.
2. Read it with the Read tool: `notes/<filename>`.
3. Transcribe the content — diagram structure and labels, flowchart logic, handwritten text — into a `## Diagrams & Notes` section in the entry body.
4. Embed the image inline using: `![description](/notes/<filename>)` — it is served at `http://localhost:3000/notes/<filename>` and displays on the entry detail page.
5. Do not scan or access `notes/` proactively — only read a file when Marco names it.

Format for the section:

```
## Diagrams & Notes

![Brief description](/notes/filename.png)

*Transcription:* ...full digital text of the image content...
```

### PDF Workflow

For `article` and `paper` entries, Marco places PDF files manually in `papers_scientific/` and tells you the filename. When he does:

1. Read the PDF with the Read tool: `papers_scientific/<filename>`. For PDFs longer than 10 pages use the `pages` parameter (max 20 pages per request).
2. Use the content to populate Key Ideas, Summary, and Notable Quotes. Never rely on memory or training knowledge alone.
3. Set `pdf_path: <filename>` in the frontmatter. The server serves it at `http://localhost:3000/pdfs/<filename>` with an "Open PDF" button on the entry detail page.

### Adding an Entry

Use `/add` to start the guided flow. If Marco describes a source conversationally without typing `/add`, recognize the pattern and ask "Should I add this as a knowledge base entry?"

Do not write entry files directly without following the `/add` procedure — the tag index will fall out of sync.

### File Naming

`YYYY-MM-DD_slugified-title.md` — date is `date_added` (when the entry is created, not when the source was consumed). Slug: lowercase, spaces → hyphens, no punctuation except hyphens, max 60 chars.

### YAML Frontmatter

**Required:** `title`, `author`, `source_type`, `date_added`, `tags`, `related`  
**Date fields (include whichever apply):** `date_published` (when the source came out), `date_started` (when Marco began), `date_ended` (when Marco finished — omit if still in progress)  
**Optional (omit entirely if not applicable):** `url`, `isbn`, `pdf_path`

**`pdf_path`:** Filename only (e.g., `pr.118.017160.pdf`). File must be stored in `papers_scientific/`. Applicable to `article` and `paper` entries.  
**`source_type` values:** `book` | `article` | `paper` | `podcast` | `audiobook` | `other`

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

### Inline Date Markers

When adding notes to an existing entry across multiple sessions, prefix each new batch of notes with an italic date label so the chronological trail is visible inside the entry body. Format: `*YYYY-MM-DD*` on its own line immediately before the new content. Example:

```
## Key Ideas

*2026-04-22*
- First batch of notes added here.

*2026-04-25*
- Second batch of notes added in a later session.
```

Apply this whenever content is added to an entry that already has notes — not for the initial population of a blank entry.

### Key Words Section

Each entry may include a `## Key Words` section listing the most important or technical terms from the source. Format — one term per line:

```
**[Term]** — [Definition as used in this source]. *"[Example sentence from or paraphrased from the source]."*
```

- For PDF-backed entries: extract key words directly from the text
- For other entries: suggest candidates based on content the user has shared; the user confirms or adjusts
- Aim for 5–12 terms per entry — the vocabulary that is load-bearing for understanding this source
- Definitions should reflect how the term is used *in this specific source*, not a generic dictionary definition
- Omit the section entirely if no key words are available

### Content Rules

- Never invent or add information Marco did not provide (no AI-generated summaries)
- Structure and lightly edit Marco's own words
- Preserve his voice in the Takeaways section
- Omit `Notable Quotes` and `Related Entries` body sections if there is no content for them

### GitHub Saving

The Stop hook auto-saves all changes at the end of every session. No manual git operations are needed during normal knowledge-base work.
