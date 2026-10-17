# Security

Static personal website (brianathey.studio) on GitHub Pages; no backend, logins or forms.

## Reporting a vulnerability

Please report security issues privately through GitHub: **Security → Report a vulnerability** on this repository (private vulnerability reporting is enabled). Don't open a public issue for security problems.

## Automated protections (always on)

| Protection | Status |
|---|---|
| GitHub secret scanning | Enabled |
| Push protection (blocks commits that contain secrets) | Enabled |
| Dependabot vulnerability alerts | Enabled |
| Private vulnerability reporting | Enabled |

## Checks run on 2026-10-16

| Check | Result |
|---|---|
| Secret patterns (AWS, GitHub, OpenAI, Anthropic, Slack, Google, Twilio, Hugging Face keys; private keys; hard-coded tokens) in every file **and every past commit** | ✅ None found |
| Credential files ever committed (`.env`, `*.pem`, `*.key`, `id_rsa`, credentials) | ✅ None found |
| GitHub secret-scanning alerts | ✅ 0 open alerts |
| Commit author emails | ✅ Resolved on 2026-10-16: history rewritten so every commit uses GitHub's private no-reply address |
| Personal data in files and documents | ✅ None (résumé PDF is a public version with no phone, email or confidential figures) |
| Photo metadata (469 published images) | ✅ No GPS or camera data; originals never committed |
| Unsafe DOM patterns (`innerHTML`, `eval`, `document.write` in site code) | ✅ None; all text set with `textContent` |
| Content Security Policy | ✅ Self only; no third-party scripts, styles or fonts; embeds limited to listed music services |
| Third-party embeds | ✅ Click-to-load, sandboxed, `strict-origin-when-cross-origin` referrer |
| External links | ✅ All `target="_blank"` links use `rel="noopener"` |
| Fonts | ✅ Self-hosted (no visitor IP addresses sent to Google) |
| HTTPS | ✅ Enforced (GitHub Pages certificate) |
| Privacy | ✅ No cookies, analytics or tracking; preferences stay in the visitor's browser; privacy note in the footer |
| Legal | ✅ Texas Gov't Code §406.017 notary notice shown in English and Spanish |
| Accessibility (axe-core 4.10, WCAG 2.2 AA + best practices) | ✅ 0 violations (English and Spanish, both color themes, photo gallery) |

## Known limits

GitHub Pages does not allow custom HTTP headers, so `frame-ancestors`, HSTS preload and similar header-only protections can't be set. The site has no logins, forms or stored user data, so the practical risk is low.

## Not covered

These checks are automated and point-in-time. They are not a penetration test or a formal audit.
