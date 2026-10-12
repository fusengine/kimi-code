# Complete Workflow Example

**Request**: "Fix all TypeScript errors in auth module"

## PHASE 1: Exploration
```
> Launch explore-codebase agent

Result:
- Language: TypeScript
- Framework: Next.js 16
- Auth module: src/modules/auth/
- Interfaces: src/interfaces/
- State: Zustand in src/stores/
```

## PHASE 2: Documentation
```
> Launch research-expert agent
> Request: "TypeScript 5.x function overload syntax"
> Request: "Next.js 16 Server Actions authentication"

Result:
- TypeScript 5.3 docs: Function overloads
- Next.js 16 docs: useSearchParams is now async
- Best practice: Zod for validation
```

## PHASE 3: Impact Analysis
```
> Grep all files importing auth functions

Files found:
1. src/app/login/page.tsx (imports signIn)
2. src/app/dashboard/layout.tsx (imports useAuth)
3. src/middleware.ts (imports validateToken)

Risk Assessment:
- signIn: 🟡 MEDIUM (2 usages)
- useAuth: 🔴 HIGH (3 usages, refactor needed)
- validateToken: 🟢 LOW (internal only)

⚠️ FLAG TO USER: useAuth needs refactoring (3 files affected)
```

## PHASE 3.5: DRY Detection
```
> Run jscpd on auth module

npx jscpd src/modules/auth/ --threshold 3 --reporters console,json

Result:
- Duplication: 4.2% (🟡 ACCEPTABLE for TypeScript threshold 3%)
- Clones: 2
  - signIn validation ↔ signUp validation (12 lines)
  - token parsing in auth.ts ↔ middleware.ts (8 lines)

Action:
- 🟡 Document for Phase 5 extraction
- Candidate: Extract shared validation → validators/auth.validator.ts
```

## PHASE 4: Detection
```
Errors found:
- src/modules/auth/signIn.ts:45 - TS2345 type mismatch
- src/hooks/useAuth.ts:12 - Missing dependency
- src/modules/auth/validateToken.ts:23 - TS2322 null safety
```

## PHASE 5: Correction
```
Fix 1: signIn.ts:45
- Error: TS2345
- Research: TypeScript overload docs
- Impact: 2 usages compatible
- Fix: Add type annotation
- ✅ Applied

Fix 2: useAuth.ts:12 (HIGH RISK)
- Error: Missing dependency
- Research: React 19 useEffect docs
- Impact: 🔴 3 files affected
- ⚠️ USER APPROVAL: Approved
- Fix: Extract to useAuthState.ts
- ✅ Applied + updated 3 files

Fix 3: validateToken.ts:23
- Error: TS2322 null
- Impact: Internal only
- Fix: Add null guard
- ✅ Applied
```

## PHASE 6: Verification
```
✅ tsc --noEmit: 0 errors
✅ ESLint: 0 errors, 0 warnings
✅ npm test: All passing
✅ Architecture: Compliant
✅ File sizes: All within `FUSE_SOLID_MAX_LINES`
✅ DRY: 1.8% duplication (down from 4.2%)

🎯 MISSION COMPLETE: 3 errors fixed, 1 DRY extraction, 0 code broken
```
