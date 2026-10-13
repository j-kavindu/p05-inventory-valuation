# Verification evidence

Build date: 2026-10-13, user timezone Asia/Colombo.

## Executed

- `npm test`: **26 passed, 0 failed**.
- `npm run build`: **passed** strict TypeScript and Vite production compilation.
- Synthetic dataset validates in all four method/system combinations.

The test suite includes independent hand-calculated FIFO, moving-average and periodic results; original-cost returns; cumulative over-return rejection; receipt-layer capacity; negative stock; backdating; six-decimal inputs; fractional arithmetic; empty and zero-cost stock; full depletion; opening ordering; duplicate IDs; valid date cutoff; invalid dates; cross-product references; CSV formula neutralization; and cost reconciliation.

The initial `tsx` command failed because this runtime does not permit its IPC pipe. The committed test command uses `node --import tsx --test` and successfully runs the same tests without the CLI IPC server.

## Live deployment verification

On 2026-10-13, [GitHub Actions run 38327249966](https://github.com/j-kavindu/p05-inventory-valuation/actions/runs/38327249966) completed successfully, including dependency installation, valuation tests, production build and GitHub Pages deployment.

The [live app](https://j-kavindu.github.io/p05-inventory-valuation/) was opened in a desktop browser. The synthetic dashboard rendered with four products and 14 movements. Perpetual FIFO showed closing inventory LKR 72,823.33 and net COGS LKR 149,626.67. Switching to weighted average and the periodic system updated these to LKR 70,104.93 and LKR 152,345.07. A real screenshot is stored at `docs/screenshots/overview.jpg`.

This is a limited desktop smoke check, not complete browser acceptance testing.

## Not executed

- Complete browser functional/visual QA, mobile viewport testing, and all deployment acceptance scenarios. Initial Sites preview verification was unavailable; the later public GitHub Pages desktop smoke check is recorded above.
- Live Google sign-in, Firestore round-trip, Firebase hosting deployment, and security-rule emulator tests: no user Firebase project configuration was provided.
- Financial compliance audit, external accountant review, NRV or statutory reporting validation.

The delivered code is a tested costing MVP; the whole product is not described as fully browser-tested or compliance-certified. See deployment acceptance checks before using real business data.
