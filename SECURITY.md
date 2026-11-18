# Security & Data Privacy Policy

## Data Residency & Air-Gapped Principles

The **UP Police BNSS 126/135 Chalani Report Generator** handles preventive policing dossiers. The application is strictly engineered around **client-side air-gapped data privacy**:

- **Zero Server Egress**: Suspect names, witness testimonies, residential addresses, and police officer identities are stored strictly inside the client's local browser memory (`IndexedDB` / `localStorage`).
- **No Third-Party Telemetry**: Zero tracking scripts, analytics beacons, or remote database logging.
- **Offline Integrity**: Operates fully offline via Service Worker caching after initial asset loading.

## Reporting a Vulnerability

If you identify any data exposure risk, cross-site scripting (XSS) vulnerability, or DOM manipulation flaw:
1. Please do **NOT** open a public issue.
2. Email **linkwithshivang@gmail.com** with the subject line `[SECURITY] UP Police BNSS Report Vulnerability`.
3. Provide details and proof-of-concept steps.

All security disclosures are acknowledged within 48 hours.
