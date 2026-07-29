/** Benchmark run metrics — one JSON record per CLI × fixture execution. */
export interface RunResult {
  cli: string;
  fixture: string;
  startedAt: string;
  durationMs: number;
  exitCode: number | null;
  timedOut: boolean;
  testsPass: number;
  testsFail: number;
  success: boolean;
  testsModified: boolean;
  filesChanged: string[];
  newFiles: string[];
  violations: string[];
}

/** Fixture registry entry: directory under fixtures/ + an optional file the task must create. */
export interface FixtureDef {
  dir: string;
  expectNew?: string;
}

/** Captured result of a synchronous shell command. */
export interface ShResult {
  code: number | null;
  out: string;
  timedOut: boolean;
}
