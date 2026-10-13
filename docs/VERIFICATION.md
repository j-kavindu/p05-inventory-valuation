# Verification evidence

Build date: 2026-10-13, user timezone Asia/Colombo.

## Executed

- `npm test`: **26 passed, 0 failed**.
- `npm run build`: **passed** strict TypeScript and Vite production compilation.
- Synthetic dataset validates in all four method/system combinations.

The test suite includes independent hand-calculated FIFO, moving-average and periodic results; original-cost returns; cumulative over-return rejection; receipt-layer capacity; negative stock; backdating; six-decimal inputs; fractional arithmetic; empty and zero-cost stock; full depletion; opening ordering; duplicate IDs; valid date cutoff; invalid dates; cross-product references; CSV formula neutralization; and cost reconciliation.

The initial `tsx` command failed because this runtime does not permit its IPC pipe. The committed test command uses `node --import tsx --test` and successfully runs the same tests without the CLI IPC server.

## Not executed

- Browser functional/visual QA and screenshot capture: the required managed browser-control capability is unavailable. Per Sites workflow, no alternative browser automation or preview server was improvised.
- Live Google sign-in, Firestore round-trip, Firebase hosting deployment, and security-rule emulator tests: no user Firebase project configuration was provided.
- Financial compliance audit, external accountant review, NRV or statutory reporting validation.

The delivered code is a tested costing MVP; the whole product is not described as fully browser-tested or compliance-certified. See deployment acceptance checks before using real business data.
