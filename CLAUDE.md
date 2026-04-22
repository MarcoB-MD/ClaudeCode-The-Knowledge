# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository

- **GitHub:** https://github.com/MarcoB-MD/ClaudeCode-The-Knowledge
- **Owner:** MarcoB-MD (dr.m.badwal@gmail.com)
- **Local path:** /Users/marco/ClaudeCode_The-Knowledge
- **Default branch:** main

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
4. This CLAUDE.md updated to persist context across sessions
