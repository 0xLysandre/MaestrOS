# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### Do NOT

- Open a public GitHub issue
- Disclose the vulnerability publicly before it's fixed

### Do

1. **Email** the maintainers directly at [security@example.com] (or create a private security advisory on GitHub)
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 1 week
- **Resolution Timeline**: Depends on severity, typically 30-90 days

### Scope

The following are in scope:
- MedPlanOS desktop application
- Data stored locally (SQLite database)
- Google Calendar OAuth integration
- IPC communication between main and renderer processes

### Out of Scope

- Issues in third-party dependencies (report to their maintainers)
- Social engineering attacks
- Physical attacks

## Security Best Practices for Users

1. **Keep the app updated** to the latest version
2. **Protect your .env file** - never commit credentials
3. **Use strong Google account security** - enable 2FA
4. **Don't install from untrusted sources** - only use official releases

## Security Features

- **Context Isolation**: Renderer process is isolated from Node.js
- **Secure Token Storage**: Google OAuth tokens are encrypted using Electron's safeStorage
- **No Remote Code Execution**: The app doesn't load remote scripts
- **Sandboxed Renderer**: Limited access to system resources
