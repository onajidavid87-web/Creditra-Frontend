# Contributing

Thanks for taking the time to contribute to Creditra Frontend! This guide
captures the conventions that keep the codebase consistent.

## Branching

- Create feature branches off `main`.
- Use a short, kebab-cased prefix that mirrors the conventional-commit
  category, e.g. `feat/draw-credit-confirm`, `fix/landing-cta-focus-ring`,
  `docs/wallet-onboarding`.

## Commits

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` user-visible new capability
- `fix:` bug fix
- `refactor:` non-behavioural code change
- `docs:` documentation only
- `test:` tests only
- `chore:` tooling, dependencies, repository hygiene
- `style:` formatting, missing semicolons, etc.

Keep the subject under 72 characters and write in the imperative mood.

## Pull requests

- Keep PRs small and focused — one logical change per PR.
- Include the accessibility checklist from the root `README.md`.
- Link any related issue with `Closes #123`.

## Local checks

Before opening a PR, run:

```bash
npm run lint
npm run test
npm run build
```

If any of these fail, fix the underlying issue rather than silencing it.
