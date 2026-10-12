---
name: apple-docs-mcp-workflows
description: Research-first workflows with Apple Docs MCP - API verification, WWDC research, and worked examples
when-to-use: planning research before implementing an Apple API, verifying availability, learning a new framework feature
keywords: research workflow, API verification, WWDC research, availability, deprecation
priority: medium
related: apple-docs-mcp.md
---

# Apple Docs MCP Workflows

Tool reference: `apple-docs-mcp.md`.

## Research-First (before coding)

```text
1. search_apple_docs "<API or concept>"
2. get_apple_doc_content <url>          -> exact declaration
3. get_platform_compatibility <url>     -> availability, deprecation
4. search_wwdc_content "<topic>"        -> recommended approach (bundled 2014-2025)
5. get_sample_code                      -> reference implementation
6. Implement with the official pattern
```

Never write an API you could not find; if unverifiable, leave it out and say so.

## API Verification

```text
1. get_apple_doc_content (signature + parameters)
2. get_platform_compatibility (min OS per platform)
3. Deprecated? -> get_related_apis / find_similar_apis for the replacement
4. Very new symbol missing from the MCP? -> fetch
   https://developer.apple.com/tutorials/data/documentation/<framework>/<symbol>.json
```

## HIG Rule Lookup

```text
1. browser_fetch https://developer.apple.com/design/human-interface-guidelines/<slug>
2. Quote the rule + cite the URL in code review / report
3. Cross-check the swiftui-core HIG references (hig-*.md)
```

## Examples

### SwiftUI navigation

```text
1. search_apple_docs "NavigationStack"
2. get_apple_doc_content NavigationStack init
3. search_wwdc_content "SwiftUI navigation"
4. get_sample_code navigation
```

### Core Data / SwiftData issue

```text
1. search_apple_docs "SwiftData ModelContext"
2. search_framework_symbols swiftdata
3. search_wwdc_content "SwiftData performance"
4. Apply recommended fix, rebuild with XcodeBuildMCP
```

### New OS feature (after the bundled WWDC range)

```text
1. get_documentation_updates
2. browser_fetch https://developer.apple.com/videos/ (current WWDC sessions)
3. get_apple_doc_content for each new symbol
4. Verify availability before using it
```

## Priority Reminder

- Apple Docs MCP first for SwiftUI, UIKit, AppKit, Foundation and every Apple framework.
- Context7 for third-party packages and general Swift libraries.
