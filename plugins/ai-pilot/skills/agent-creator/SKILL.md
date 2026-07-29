---
name: agent-creator
description: Use when creating expert agents. Generates agent.md with frontmatter, hooks, required sections, and skill references.
---


<objective>
Agent Creator scaffolds a complete Kimi Code expert agent: frontmatter (name, description, model, tools, skills, hooks), the mandatory Agent Workflow section, hook scripts, and marketplace registration. It covers three flows -- creating a brand-new domain/framework expert, adapting an existing agent to a new stack, and updating an agent's skills or hooks -- each ending with a `sniper` validation pass.

It does not create the skills an agent references -- for that, use `skill-creator`; agent-creator only wires the agent frontmatter and workflow around skills that already exist or are created alongside it.
</objective>

# Agent Creator

## Agent Workflow (MANDATORY)

Before ANY agent creation, delegate via `Task` — spawn 2 agents in parallel (single message, 2 Task calls). Generated agents only carry `Task` in their tools (no `TeamCreate`), so this same pattern is what they must use internally too:

1. **explore-codebase** - Check existing agents, analyze patterns
2. **research-expert** - Fetch latest agent conventions

`mcp__context7__query-docs` is a direct MCP call, not a spawned agent — invoke it directly (alongside the 2 Task calls) to get examples from existing agents.

After creation, run **sniper** for validation.

---

## Overview

| Action | When to Use |
|--------|-------------|
| **New Agent** | New domain/framework expert needed |
| **Adapt** | Copy from similar agent (Next.js → React) |
| **Update** | Add skills, modify hooks |

---

## Critical Rules

1. **ALL content in English** - Never French or other languages
2. **Frontmatter complete** - name, description, model, tools, skills, hooks
3. **Agent Workflow section** - Always first content section
4. **SOLID rules reference** - Link to solid-[stack] skill
5. **Register in marketplace.json** - Or agent won't load
6. **Hook scripts executable** - `chmod +x`
7. **Output Format section mandatory** - Every generated agent must define a standard `## Output Format` section (status, files_changed, errors, sources) — an agent invoked by a lead must return structured data, not prose

---

## Architecture

```
plugins/<plugin-name>/
├── agents/
│   └── <agent-name>.md      # Agent definition
├── skills/
│   ├── skill-a/
│   └── solid-[stack]/
├── scripts/
│   └── validate-*.sh        # Hook scripts
└── .kimi-plugin/
    └── plugin.json
```

→ See [architecture.md](references/architecture.md) for details

---

## Reference Guide

### Concepts

| Topic | Reference | When to Consult |
|-------|-----------|-----------------|
| **Architecture** | [architecture.md](references/architecture.md) | Understanding agent structure |
| **Frontmatter** | [frontmatter.md](references/frontmatter.md) | YAML configuration |
| **Required Sections** | [required-sections.md](references/required-sections.md) | Mandatory content |
| **Hooks** | [hooks.md](references/hooks.md) | Pre/Post tool validation |
| **Registration** | [registration.md](references/registration.md) | marketplace.json |

### Templates

| Template | When to Use |
|----------|-------------|
| [agent-template.md](references/templates/agent-template.md) | Creating new agent |
| [hook-scripts.md](references/templates/hook-scripts.md) | Validation scripts |

---

## Quick Reference

### Create New Agent

```bash
# 1. Research existing agents
→ explore-codebase + research-expert

# 2. Create files
touch plugins/<plugin>/agents/<agent-name>.md
touch plugins/<plugin>/scripts/validate-<stack>-solid.sh
chmod +x plugins/<plugin>/scripts/*.sh

# 3. Register in marketplace.json

# 4. Validate
→ sniper
```

### Adapt Existing Agent

```bash
# 1. Copy similar agent
cp plugins/nextjs-expert/agents/nextjs-expert.md plugins/new-plugin/agents/new-expert.md

# 2. Adapt with sed
sed -i '' "s/nextjs/newstack/g; s/Next\.js/NewStack/g" agents/new-expert.md

# 3. Update skills, tools, register
```

---

## Validation Checklist

- [ ] ALL content in English
- [ ] Frontmatter complete (name, description, model, tools, skills)
- [ ] Agent Workflow section present
- [ ] Mandatory Skills Usage table
- [ ] SOLID Rules reference to solid-[stack]
- [ ] Local Documentation paths valid
- [ ] Output Format section present (status, files_changed, errors, sources)
- [ ] Hook scripts executable
- [ ] Registered in marketplace.json

---

## Related: Skill Creator

**When creating an agent, you often need to create skills too.**

Use **`/fusengine:skill-creator`** to create skills for the agent:

| Scenario | Action |
|----------|--------|
| New agent needs skills | Create skills with skill-creator first |
| Agent references skills | Ensure skills exist in skills/ |
| Adapting agent | Adapt related skills too |

---

## Best Practices

### DO
- Use skill-creator for associated skills
- Reference solid-[stack] skill for SOLID rules
- Include Gemini Design section for UI agents
- Make hook scripts executable

### DON'T
- Write in French (English only)
- Skip Agent Workflow section
- Forget marketplace registration
- Create agent without its skills
- Hard-code paths in hooks (use `$KIMI_PLUGIN_ROOT`)
