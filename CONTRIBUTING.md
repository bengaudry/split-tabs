# Guide to contributing to Side by Side repository

First off, thank you for considering contributing to Side by Side!

## Getting Started

1. **Fork & Clone**: Fork the repository on GitHub and clone it locally.
2. **Install Dependencies**: Run `npm install` to install all project dependencies.
3. **Pre-commit hooks**: The project uses Husky to run formatting and linting on commit.

## Development Commands

This project is a browser extension built with TypeScript, Webpack, and tested with Vitest.

- `npm run build` - Builds the extension via Webpack into the `build/` directory.
- `npm run format` - Automatically formats all files using Prettier.
- `npm run lint` - Checks formatting (Prettier) and lints Python scripts (Ruff).
- `npm run test` - Runs the Vitest test suite.
- `npm run test:coverage` - Runs tests and generates a coverage report.

## Pull Request Process

1. Create a new branch for your feature or bugfix.
2. Ensure your code follows the existing style, format your code (`npm run format`), and check that all tests pass (`npm run test`).
3. Commit your changes. The `lint-staged` and `husky` hooks will format and lint your staged files.
4. Provide a clear, descriptive summary of your changes in the PR description.

## Adding compatibility with a Firefox Theme

To make a new theme compatible with the extension, contributors must add the theme's colors configuration to the `knownThemesColors` object found in [`src/shared/themes/knownThemesColors.ts`](src/shared/themes/knownThemesColors.ts).
Please include a comment with a link to the original theme if you are pulling it from the Firefox Add-ons store.
