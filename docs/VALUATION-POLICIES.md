# Valuation policies

## Reporting period

One ledger, starting with optional opening stock for each product. Opening stock must be the first and only opening entry. The report includes dates up to the chosen cutoff. There is no start-date filter that discards required opening history. Same-day entries retain insertion order. Dates without quantities available at that point are rejected, even when a later purchase would cover the deficit.

## Calculations

| System | FIFO | Weighted average |
|---|---|---|
| Perpetual | Issue oldest available layers at their costs | Issue at current inventory value / quantity; recompute after receipts/returns |
| Periodic | Value ending quantity from newest net receipt layers | Opening plus net purchase cost / opening plus net purchase quantity × ending quantity |

For all methods, **available cost = closing inventory cost + net COGS**. Available cost is opening cost + purchase cost − purchase return cost. Sales return quantities reduce net quantity sold. Reports round only for display; internal values use 40 decimal digits.

## Return policy

Every return must reference an earlier transaction for the same product, of the correct type. Cumulative partial returns cannot exceed the original quantity. The UI and backup validation enforce all four methods, so switching methods cannot reveal an invalid ledger.

- Perpetual sales returns restore the original sale's blended unit issue cost. Under FIFO this becomes a new receipt layer on the return date. This is an explicit MVP convention where the specific original unit layer is not identified; it is not represented as the only accounting treatment.
- Perpetual FIFO purchase returns remove the linked purchase's unconsumed layer at its original cost. A quantity already consumed from that layer cannot be returned, even if other receipts remain. Returned sale layers do not replenish the original purchase-return capacity.
- Moving-average purchase returns remove quantity and original invoice cost. A transaction leaving negative value, or nonzero value at zero quantity, is rejected for review rather than silently adjusted.
- Periodic purchase returns reduce the original net receipt quantity and cost; sales returns reduce net quantity issued. Periodic stock cards expose running quantities but defer value/COGS to period end.
- Cross-period returns where the original transaction is absent, supplier credits without goods movements and inventory write-offs are not supported.

## Independent example

Purchase 10 units at 10; sell 6; purchase 10 at 20; sell 6. Ending quantity is 8, available cost 300.

| Method | Ending inventory | Net COGS |
|---|---:|---:|
| Perpetual FIFO | 160.00 | 140.00 |
| Moving average | 137.142857… | 162.857143… |
| Periodic FIFO | 160.00 | 140.00 |
| Periodic weighted average | 120.00 | 180.00 |

## Source references and scope

- IFRS Foundation, IAS 2 overview: https://www.ifrs.org/issued-standards/list-of-standards/ias-2-inventories/ (reviewed 2026-10-13).
- Firebase transaction documentation: https://firebase.google.com/docs/firestore/manage-data/transactions (reviewed 2026-10-13).

These references inform design context. They are not a certification or audit. The app does not implement a complete IAS 2 / LKAS 2 assessment, NRV testing, all eligible cost allocations, disclosures, or verified financial compliance.
