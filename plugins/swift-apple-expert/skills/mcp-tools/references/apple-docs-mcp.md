---
name: apple-docs-mcp
description: Apple Docs MCP server - tools for official Apple documentation, symbols, platform availability, sample code and bundled WWDC sessions
when-to-use: researching Apple APIs, checking availability/deprecation, searching WWDC sessions, getting sample code
keywords: Apple Docs, WWDC, documentation, symbols, availability, SwiftUI, UIKit, sample code
priority: high
related: apple-docs-mcp-workflows.md, xcodebuild-mcp.md
---

# Apple Docs MCP

Source: https://github.com/kimsungwhee/apple-docs-mcp (npm `@kimsungwhee/apple-docs-mcp`; tool names read from v1.0.26).

## Installation

```json
{
  "mcpServers": {
    "apple-docs": { "command": "npx", "args": ["-y", "@kimsungwhee/apple-docs-mcp"] }
  }
}
```

## Documentation Tools

| Tool | Use |
|------|-----|
| `search_apple_docs` | Search all Apple documentation by keyword |
| `get_apple_doc_content` | Full page for a documentation URL (declaration, parameters, discussion) |
| `search_framework_symbols` | Browse symbols of one framework (filter by kind) |
| `list_technologies` | Frameworks/technologies by category |
| `get_platform_compatibility` | Availability and deprecation per platform |
| `get_related_apis` / `find_similar_apis` | Related or alternative APIs |
| `resolve_references_batch` | Resolve many doc references at once |
| `get_documentation_updates` | Latest SDK/documentation updates |
| `get_technology_overviews` | Technology overview articles |
| `get_sample_code` | Apple sample code projects |

## WWDC Tools

| Tool | Use |
|------|-----|
| `search_wwdc_content` | Full-text search in transcripts/code |
| `list_wwdc_videos` / `list_wwdc_years` | Browse by year/topic |
| `get_wwdc_video` | Session details + transcript |
| `get_wwdc_code_examples` | Code shown in sessions |
| `browse_wwdc_topics` / `find_related_wwdc_videos` | Topic navigation |

**Coverage**: WWDC data is bundled offline for **2014-2025** (package v1.0.26, published 2025-09). Sessions after that (WWDC26+) are not in the bundle - read them from https://developer.apple.com/videos/ with `browser_fetch`.

## Gaps - use the web

- **Human Interface Guidelines** pages: `browser_fetch` https://developer.apple.com/design/human-interface-guidelines/<slug> (JSON: https://developer.apple.com/tutorials/data/design/human-interface-guidelines/<slug>.json).
- Very recent symbols: cross-check https://developer.apple.com/tutorials/data/documentation/<framework>/<symbol>.json (metadata.platforms gives availability).

## Priority

1. Apple Docs MCP / developer.apple.com - Apple APIs and HIG
2. Context7 - third-party libraries
3. Exa - community examples

Workflows and examples: `apple-docs-mcp-workflows.md`.
