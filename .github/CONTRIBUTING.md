# Contributing to Lok'Room

Thank you for your interest in contributing to Lok'Room! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- A clear and descriptive title
- Detailed steps to reproduce the issue
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (OS, browser, version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- A clear and descriptive title
- Detailed description of the proposed feature
- Explanation of why this enhancement would be useful
- Possible implementation approach

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Commit your changes** using conventional commits
6. **Push to your fork** and submit a pull request

## Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL database (or Neon account)
- Git

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Lokroom.git
cd Lokroom

# Install dependencies
cd apps/web
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types when possible
- Use proper type definitions

### Code Style

- Follow the existing code style
- Use Prettier for formatting: `npm run format`
- Use ESLint for linting: `npm run lint`

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: fix bug in component
docs: update documentation
style: format code
refactor: refactor component
test: add tests
chore: update dependencies
```

### Testing

- Write tests for new features
- Ensure all tests pass: `npm test`
- Maintain or improve code coverage

## Project Structure

```
apps/web/
├── src/
│   ├── app/          # Next.js app directory
│   ├── components/   # React components
│   ├── lib/          # Utility functions
│   └── types/        # TypeScript types
├── prisma/           # Database schema
├── public/           # Static assets
└── tests/            # Test files
```

## Pull Request Process

1. **Update documentation** for any changed functionality
2. **Add tests** for new features
3. **Ensure CI passes** all checks
4. **Request review** from maintainers
5. **Address feedback** promptly
6. **Squash commits** before merging (if requested)

## Review Process

- PRs require at least one approval
- All CI checks must pass
- Code must follow style guidelines
- Tests must pass with adequate coverage

## Branch Naming

Use descriptive branch names:

```
feature/add-user-profile
fix/login-redirect-bug
docs/update-readme
refactor/optimize-queries
```

## Getting Help

- Check existing documentation
- Search existing issues
- Ask questions in discussions
- Contact maintainers

## Recognition

Contributors will be recognized in:

- GitHub contributors list
- Release notes (for significant contributions)
- Project documentation

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## Questions?

Feel free to reach out:

- Open a discussion on GitHub
- Email: contact@lokroom.com

Thank you for contributing to Lok'Room!
