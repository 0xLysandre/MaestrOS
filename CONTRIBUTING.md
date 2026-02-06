# Contributing to MedPlanOS

Thank you for your interest in contributing to MedPlanOS! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Be kind, constructive, and patient with other contributors.

## How to Contribute

### Reporting Bugs

Before creating a bug report:
1. Check the [existing issues](https://github.com/0xLysandre/MedPlanOS/issues) to avoid duplicates
2. Use the latest version of the application

When creating a bug report, include:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Your environment (OS, Node.js version, etc.)
- Screenshots if applicable
- Error messages from the console

### Suggesting Features

Feature requests are welcome! Please:
1. Check existing issues to avoid duplicates
2. Describe the feature and its use case
3. Explain why this would benefit other users

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies**: `npm install`
3. **Make your changes** following the code style guidelines
4. **Test your changes** thoroughly
5. **Commit with clear messages** following conventional commits
6. **Push to your fork** and submit a pull request

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Git

### NixOS Users

```bash
# Enter the development shell
nix-shell

# Or use the dev script (auto-enters nix-shell)
./dev.sh
```

### Other Platforms

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Or manually:
npm run build:main
npm run dev:renderer &
npm run electron:dev
```

### Project Structure

```
src/
├── main/           # Electron main process
│   ├── database/   # SQLite queries and migrations
│   └── services/   # Business logic (calendar, scheduling)
├── renderer/       # React frontend
│   ├── components/ # UI components
│   └── store/      # Zustand state management
└── shared/         # Shared types and constants
```

## Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Avoid `any` types - use proper typing
- Export types from dedicated files

### React Components

- Use functional components with hooks
- Keep components focused and small
- Use TypeScript interfaces for props
- Prefer composition over inheritance

### Naming Conventions

- **Files**: `PascalCase.tsx` for components, `camelCase.ts` for utilities
- **Components**: `PascalCase`
- **Functions/Variables**: `camelCase`
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: resolve bug
docs: update documentation
style: formatting changes
refactor: code restructuring
test: add or update tests
chore: maintenance tasks
```

### Example Commit Messages

```
feat: add task export to CSV
fix: resolve calendar sync timezone issue
docs: add NixOS installation instructions
refactor: simplify task scheduling logic
```

## Testing

```bash
# Run type checking
npm run build:main

# Build the app
npm run build
```

## Areas Where Help is Needed

- [ ] Unit tests for core services
- [ ] E2E tests with Playwright
- [ ] Internationalization (i18n)
- [ ] Accessibility improvements (a11y)
- [ ] Performance optimizations
- [ ] Documentation improvements
- [ ] Mobile companion app

## Questions?

If you have questions, feel free to:
- Open a [Discussion](https://github.com/0xLysandre/MedPlanOS/discussions)
- Ask in an existing issue

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
