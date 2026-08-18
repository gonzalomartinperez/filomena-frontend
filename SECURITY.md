# Security policy

This repository is a portfolio/reference snapshot. It does not contain production credentials, institutional data, or the original institutional import templates.

## Safe setup

- Never commit `.env` or `.env.local`; start from `.env.example.local` or `.env.example.docker`.
- Treat every `NEXT_PUBLIC_*` value as browser-visible. Never place secrets or privileged tokens in those variables.
- Point `NEXT_PUBLIC_API_URL` only to an API environment you are authorized to use.
- Keep authentication credentials, production URLs, private deployment configuration, and real exam data outside version control.
- Use synthetic identities and exam records in local development.
- Keep backend services and operational dashboards behind appropriate authentication and network controls.

Frontend role and route guards improve the user experience but are not a security boundary. The backend must enforce authorization, institution isolation, exam state, and input validation for every request.

## Reporting a vulnerability

Do not publish exploit details, credentials, personal data, or institutional information in a public issue. Use GitHub's private vulnerability reporting channel when it is available for this repository.
