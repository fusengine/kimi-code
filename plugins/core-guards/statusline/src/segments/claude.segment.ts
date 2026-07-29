/**
 * Kimi Segment - Affiche la version de Kimi
 *
 * @description SRP: Affichage version Kimi uniquement
 */

import type { StatuslineConfig } from "../config/schema";
import type { ISegment, SegmentContext } from "../interfaces";
import { colors } from "../utils";

export class ClaudeSegment implements ISegment {
	readonly name = "kimi";
	readonly priority = 10;

	isEnabled(config: StatuslineConfig): boolean {
		return config.kimi.enabled;
	}

	async render(context: SegmentContext, config: StatuslineConfig): Promise<string> {
		const { icons, global } = config;
		const version = context.input.version || "N/A";
		const label = global.showLabels ? " Kimi:" : "";

		return `${colors.blue(icons.kimi)}${colors.blue(label)} ${version}`;
	}
}
