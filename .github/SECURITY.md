# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Lok'Room seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please do NOT:

- Open a public GitHub issue
- Disclose the vulnerability publicly before it has been addressed

### Please DO:

1. **Email us directly** at security@lokroom.com with:
   - A description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact
   - Any suggested fixes (if available)

2. **Allow us time to respond** - We aim to respond within 48 hours

3. **Work with us** to understand and resolve the issue

## What to Expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Communication**: We will keep you informed about our progress
- **Credit**: We will credit you in our security advisory (unless you prefer to remain anonymous)
- **Timeline**: We aim to release a fix within 30 days for critical vulnerabilities

## Security Measures

Lok'Room implements several security measures:

- **Authentication**: Secure authentication with NextAuth.js
- **Rate Limiting**: API rate limiting with Upstash Redis
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **XSS Protection**: React's built-in XSS protection
- **CSRF Protection**: CSRF tokens on all forms
- **Security Headers**: Comprehensive security headers
- **Dependency Scanning**: Automated dependency vulnerability scanning
- **Code Analysis**: CodeQL security analysis

## Security Best Practices

When contributing to Lok'Room:

1. Never commit sensitive data (API keys, passwords, etc.)
2. Use environment variables for configuration
3. Follow secure coding practices
4. Keep dependencies up to date
5. Run security scans before submitting PRs

## Bug Bounty Program

We currently do not have a bug bounty program, but we deeply appreciate security researchers who help us keep Lok'Room secure.

## Contact

For security concerns, please contact: security@lokroom.com

For general questions: contact@lokroom.com
