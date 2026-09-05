# Knowledge base

Markdown is the source of truth for everything the chat assistant knows. `services/knowledge.py` loads and indexes this folder at startup.

## Layout

- `buildings/<ID>.md` — one file per building or landmark. `ID` matches the client's building codes.
- `campus/<topic>.md` — campus-wide topics: history, traditions, dining, visiting, transit, Pittsburgh.
- `blog/<slug>.md` — admission blog posts, imported verbatim from the client bundle.

## File format

```
---
id: GHC                      # unique; building codes for buildings, campus-* for topics
title: "Gates and Hillman Centers"
type: building | landmark | campus | blog
aliases: ["Gates", "GHC"]    # names people actually use; searched alongside the body
sources: [https://...]       # where the facts came from; add one per fact source
---
# Title

## Section

One or more paragraphs.
```

Each `##` section becomes one retrieval chunk, prefixed with the file title and section name so it is searchable on its own. Keep sections focused on one subject, and split a section rather than letting it grow past ~250 words.

## Building sections to aim for

Overview, History, Departments and programs, Spaces and rooms, Dining, Hours and access, Accessibility, Fun facts, Nearby. Only include a section when there is real content for it.

## Rules

- Every fact must come from a listed source. No inferred facts.
- Prefer official cmu.edu pages. Note the date for anything that changes (exhibits, hours, prices).
- Write for retrieval: name the building or topic in each section rather than relying on pronouns.
