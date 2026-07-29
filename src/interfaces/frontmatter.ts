/**
 * YAML frontmatter shapes shared by the skills/agents/commands converters.
 */

export type FrontmatterData = Record<string, string | string[]>;

export interface Frontmatter {
	data: FrontmatterData;
	body: string;
}
