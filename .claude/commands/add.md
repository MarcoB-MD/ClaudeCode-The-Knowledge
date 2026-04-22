---
description: Add a new entry to the knowledge base (book, article, paper, podcast, audiobook, or other)
argument-hint: Optional — title or brief description of what you're adding
allowed-tools: [Read, Write, Bash]
---

# Add Knowledge Base Entry

You are adding a new entry to this personal knowledge base. Follow these steps precisely and in order. Do not skip steps.

Arguments passed by the user: $ARGUMENTS

---

## Step 1 — Gather Information

Ask the user for the following fields. You may ask for all of them at once in a single message. Do not proceed to Step 2 until you have all required fields.

**Required:**
- Title
- Author or creator
- Source type — must be one of: `book`, `article`, `paper`, `podcast`, `audiobook`, `other`
- Date published — when did this source originally come out? (YYYY-MM-DD)
- Date started — when did you begin reading/listening? (YYYY-MM-DD; default to today if not specified)
- Date ended — when did you finish? (YYYY-MM-DD; omit entirely if still in progress)
- Tags — ask for 2–6 topic tags; suggest candidates based on what the user tells you about the content; normalize all tags to lowercase-hyphenated form (e.g. "Behavioral Economics" → `behavioral-economics`)
- Summary — ask the user to share their notes; tell them you will structure them (do not generate a summary yourself)
- Key ideas — ask for their distilled takeaways in any form; you will turn them into clean bullet points
- Personal takeaways — what do they want to remember or apply?

**Optional (ask once; accept "none" or skip):**
- URL — for articles and podcast episodes
- ISBN — for books
- Notable quotes — any passages worth preserving verbatim
- PDF file — for `article` and `paper` types only: ask if there is a PDF; if yes, ask for the full file path on disk

If $ARGUMENTS contains a title or description, use it as a starting point and ask only for the missing fields.

---

## Step 2 — Suggest Related Entries

Before writing any file:

1. Read the file at `_index/tags.md`
2. Check whether the knowledge base has 5 or more entries: `find entries -name "*.md" | wc -l`. If fewer than 5, skip to Step 3 and note that related-entry suggestions will improve as the knowledge base grows.
3. For each tag the user provided, collect all existing entries listed under that tag in the index
4. Count how many of the user's tags each existing entry shares
5. Rank candidates by overlap count (descending), then by date_added (newest first) for ties
6. If any candidates exist with at least 1 overlapping tag, tell the user:

   > "Based on your tags, these existing entries may be related:
   > - [Title] (N tags in common: tag1, tag2)
   > Should I include any of these as Related entries? You can also name others you want linked."

7. If no overlap exists, say "No closely related entries found" and continue.

Wait for the user's confirmation before proceeding.

---

## Step 3 — Determine File Path

1. Map source_type to folder:
   - `book` → `entries/books/`
   - `article` → `entries/articles/`
   - `paper` → `entries/papers/`
   - `podcast` → `entries/podcasts/`
   - `audiobook` → `entries/audiobooks/`
   - `other` → `entries/other/`

2b. **PDF handling** (articles and papers only): if the user provided a PDF path:
   - Build the PDF filename using the same slug: `YYYY-MM-DD_<slug>.pdf`
   - Run: `cp "/user/provided/path.pdf" "assets/pdfs/YYYY-MM-DD_<slug>.pdf"`
   - Set `pdf_path: YYYY-MM-DD_<slug>.pdf` in the frontmatter
   - Read the PDF (`assets/pdfs/YYYY-MM-DD_<slug>.pdf`) so you have access to the full content when populating Summary, Key Ideas, and Notable Quotes — do not ask the user to paste text from it

2. Build the filename:
   - Take today's date in YYYY-MM-DD format
   - Slugify the title: lowercase, spaces → hyphens, remove all punctuation except hyphens, truncate at 60 characters
   - Example: `2026-04-22_thinking-fast-and-slow.md`

3. Check for collision: `ls entries/<folder>/YYYY-MM-DD_slug.md 2>/dev/null`
   - If it exists, try appending `-2`, then `-3`, etc., until the path is free

---

## Step 4 — Write the Entry File

Create the file at the path determined in Step 3. Use this exact structure:

```
---
title: "<title>"
author: "<author>"
source_type: <type>
date_published: <YYYY-MM-DD>
date_started: <YYYY-MM-DD>
date_added: <today YYYY-MM-DD>
tags:
  - <tag1>
  - <tag2>
related:
  - <confirmed-filename.md>
```

Include `url:` only if the user provided one. Include `isbn:` only if the user provided one. Include `pdf_path:` only for `article` and `paper` types where a PDF was provided. Do not leave any field blank or with an empty string — omit the field entirely.

Then the body:

```
---

# <title>

**Author:** <author>
**Type:** <source_type, capitalized>
**Published:** <date_published>
**Started:** <date_started>
**Finished:** <date_ended — omit this line if still in progress>

---

## Summary

<user's summary, lightly edited for clarity and structure — never AI-generated>

## Key Ideas

- <distilled idea>
- <distilled idea>

## Notable Quotes

> <quote>

## Personal Takeaways

<user's takeaways, lightly edited — preserve their voice>

## Related Entries

- [[<filename-without-extension>]] — <author> — <one-line description>
```

Omit `Notable Quotes` if no quotes were provided. Omit `Related Entries` if no related entries were confirmed. Do not invent or add any information the user did not provide.

---

## Step 5 — Update the Tag Index

Read the full current content of `_index/tags.md`. Then rewrite it completely with these changes applied:

1. Remove the "_No entries yet_" placeholder line if present
2. For each tag in the new entry's `tags` list:
   - If an H2 section for that tag exists: add a new line for this entry in chronological order (oldest first, newest last)
   - If no H2 section exists: create one at the correct alphabetical position
3. Entry line format: `- [<title>](../<folder>/<filename>) — <author> (<source_type>, <date_added>)`
4. Sort all H2 tag sections alphabetically by tag name
5. Update the "_Last updated_" date at the top to today

Write the complete updated file back (full rewrite, not append).

---

## Step 6 — Confirm

Tell the user:
- Full path where the entry was saved
- How many tags it was indexed under and what they are
- How many entries are now in the knowledge base: `find entries -name "*.md" | wc -l`
- Any related entries that were linked

Example:
> Entry saved: `entries/books/2026-04-22_thinking-fast-and-slow.md`
> Indexed under 3 tags: psychology, decision-making, cognitive-bias
> Knowledge base now has 1 entry.
> No related entries yet (knowledge base is still small — suggestions will appear once you have 5+ entries).

---

## Conversational Trigger (no /add command)

If a user describes a book, article, paper, podcast, or other source in conversation without typing `/add`, recognize the pattern and ask:
> "Should I add this as a knowledge base entry?"
If they say yes, proceed from Step 1.
