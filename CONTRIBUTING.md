# Contributing to @fivexlabs/ng-headless-datagrid

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Pull Requests

Pull requests are the best way to propose changes to the codebase:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Setting Up Development Environment

```bash
# Clone your fork
git clone https://github.com/your-username/ng-headless-datagrid.git
cd ng-headless-datagrid

# Install dependencies
npm install

# Build the library
npm run build

# Run tests
npm test

# Build and watch for changes during development
npm run build:watch
```

## Project Structure

```
projects/ng-headless-datagrid/
├── src/
│   ├── lib/
│   │   ├── interfaces/        # TypeScript interfaces
│   │   ├── services/          # Core services
│   │   ├── directives/        # Angular directives
│   │   └── ng-headless-datagrid.ts  # Main export file
│   └── public-api.ts         # Public API exports
├── package.json              # Library package.json
└── README.md                # Library README
```

## Coding Standards

- Use TypeScript for all code
- Follow Angular coding standards
- Use Angular signals for reactive programming
- Add JSDoc comments for all public APIs
- Include unit tests for new features
- Update documentation for API changes

## Testing

- Write unit tests using Jasmine/Karma
- Test all public APIs
- Include edge cases in tests
- Maintain high test coverage

## Documentation

- Update README.md for new features
- Add examples for new functionality
- Include TypeScript type definitions
- Document breaking changes in CHANGELOG.md

## Bug Reports

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/Fivex-Labs/ng-headless-datagrid/issues).

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Feature Requests

We welcome feature requests! Please:

1. Check if the feature has already been requested
2. Provide a clear description of the problem and solution
3. Include code examples when possible
4. Consider the scope and impact of the change

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team. All complaints will be reviewed and investigated promptly and fairly.

## Questions?

Feel free to reach out to us at [GitHub Issues](https://github.com/Fivex-Labs/ng-headless-datagrid/issues) or contact us through [Fivex Labs](https://fivexlabs.com).

Thank you for contributing! 🎉 