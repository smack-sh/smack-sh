# Security Policy

## Supported Versions

| Version    | Supported |
|------------|-----------|
| `main`     | ✅        |
| `< main`   | ❌        |

This project follows a rolling support model on the default branch. Only the latest commits on the default branch receive timely security fixes.

## Reporting a Vulnerability

Thank you for helping keep **smack‑sh** secure.  
We take security seriously and ask that you follow these responsible disclosure guidelines.

**Do not** report security issues via public GitHub issues or pull requests.

To report a vulnerability:

- Email: **security@smack-sh.dev**
- Provide a clear and concise description of the issue.
- Include:
  - The type of vulnerability (e.g., XSS, SQL injection, privilege escalation).
  - Steps to reproduce the issue.
  - Proof‑of‑concept or example code (if available).
  - Impact assessment and any affected components.

We aim to acknowledge new reports within **3 business days** and keep you updated on resolution progress.

## Vulnerability Handling Process

Once a valid security issue is reported:

1. Triage and confirm the vulnerability.
2. Create a private GitHub security advisory (if needed) to coordinate disclosure.
3. Assign priority and remediation steps.
4. Release a fix and security advisory with an appropriate disclosure timeline.
5. Credit the reporter (optional, unless anonymity is requested).

## Security Expectations

Contributors and maintainers should:

- Keep dependencies up to date.
- Follow secure coding practices.
- Avoid committing secrets, API keys, or credentials.
- Review changes that touch authentication, authorization, or networking code carefully.

## Additional Resources

Security best practices and more guidance:

- GitHub Security Advisories and coordinated disclosure
- GitHub Advanced Security features and scanning tools

## Contact

For general questions about security for this project: **security@smack-sh.dev**
