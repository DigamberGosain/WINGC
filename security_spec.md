# Security Specification: Wing-C Lakeview Apartment

## 1. Data Invariants
- Society members and residents can view directory, maintenance status, expenses, and electricity bills.
- User updates and creations must enforce strict types, schema limits, and sanitization.
- Expense records, maintenance payments, and electricity records are strictly validated with positive amounts, string boundaries, and required fields.
- Admin role modifications and sensitive administrative handovers require proper validation.

## 2. The Dirty Dozen Malicious Payloads (to reject)
1. Injected 200KB junk string payload into user ID.
2. Negative maintenance due amount (`maintenanceDue: -5000`).
3. Invalid occupancy type (`occupancyType: 'squatter'`).
4. Non-numeric units in electricity bill (`unitsConsumed: 'hundred'`).
5. Negative expense voucher amount (`amount: -25000`).
6. Missing required `monthYear` in maintenance record.
7. Overly long flat number exceeding bounds (> 50 characters).
8. Admin handover with negative tenure months (`handoverTenureMonths: -12`).
9. Unbounded array injection into expense or user record.
10. Malformed date format string exceeding boundary limits.
11. Corrupted phone number length (> 25 characters).
12. Shadow fields injection (`__v: 1, hacked: true`) into maintenance record.
