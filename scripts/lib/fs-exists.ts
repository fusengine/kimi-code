import { stat } from "node:fs/promises";

export async function exists(path: string): Promise<boolean> {
	try {
		await stat(path);
		return true;
	} catch {
		return false;
	}
}

export async function readJsonSafe<T>(path: string): Promise<T | null> {
	const file = Bun.file(path);
	if (!(await file.exists())) return null;
	try {
		return (await file.json()) as T;
	} catch {
		return null;
	}
}
