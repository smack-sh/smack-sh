# Contributing to Smack.sh

First off, thank you for considering contributing to Smack.sh! It's people like you that make Smack.sh such a great tool.

We welcome any type of contribution, not just code. You can help with:

*   **Reporting a bug**
*   **Discussing the current state of the code**
*   **Submitting a fix**
*   **Proposing new features**
*   **Becoming a maintainer**

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue on our GitHub repository. Please include as much detail as possible, including:

*   A clear and descriptive title.
*   A step-by-step description of how to reproduce the bug.
*   The expected behavior and what actually happened.
*   Your operating system, browser, and any other relevant information about your environment.

### Suggesting Enhancements

If you have an idea for a new feature or an improvement to an existing one, please open an issue on our GitHub repository. Please include:

*   A clear and descriptive title.
*   A detailed description of the proposed enhancement.
*   Any mockups or examples that might help illustrate your idea.

### Your First Code Contribution

Unsure where to begin contributing to Smack.sh? You can start by looking through these `good first issue` and `help wanted` issues:

*   [Good first issues](https://github.com/smack-sh/smack-sh/labels/good%20first%20issue) - issues which should only require a few lines of code, and a test or two.
*   [Help wanted issues](https://github.com/smack-sh/smack-sh/labels/help%20wanted) - issues which should be a bit more involved than `good first issue` issues.

### Pull Request Process

1.  Fork the repository and create your branch from `main`.
2.  If you've added code that should be tested, add tests.
3.  If you've changed APIs, update the documentation.
4.  Ensure the test suite passes.
5.  Make sure your code lints.
6.  Issue that pull request!

## Development Setup

To get started with the development of Smack.sh, you'll need to have the following tools installed:

*   Node.js (version 18.18.0 or higher)
*   pnpm

Once you have these tools installed, you can follow these steps to get the project up and running:

1.  Clone the repository:
    ```bash
    git clone https://github.com/smack-sh/smack-sh.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd smack-sh
    ```
3.  Install the dependencies:
    ```bash
    pnpm install
    ```
4.  Copy the example environment file:
    ```bash
    cp .env.example .env.local
    ```
5.  Start the development server:
    ```bash
    pnpm run dev
    ```

## Code of Conduct

This project and everyone participating in it is governed by the [Smack.sh Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [maintainers@smack-sh.duckdns.org](mailto:maintainerst@smack-sh.duckdns.org)
