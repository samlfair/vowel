# Releasing

How vowel and votive are released to npm. This file is for
maintainers; it isn't in the package.

Releases are manual until CI and release tooling are set up. Then most
of this becomes "merge the release PR".

## Before you start

- Node 26: the tests and the package need it.
- Commit messages follow Conventional Commits (`fix:`, `feat:`,
  `feat!:`). Before 1.0, a breaking change is released in a minor
  (0.8 → 0.9), not a major.
- votive comes first. If vowel needs an unreleased votive change,
  release votive, then vowel. vowel's `"votive": "0.5"` range picks up
  a votive patch by itself; a new votive minor needs the range changed.
  Update vowel's lockfile with `npm install --package-lock-only`, which
  leaves `node_modules` alone (a plain `npm install` in a workspace
  replaces the linked votive).

## A release

On `main`, for votive and then vowel:

1. **Nothing uncommitted.** `git status` shows a clean tree. npm
   publishes what's on disk, not what's committed, so a dirty tree
   ships changes git doesn't have (0.7.7 shipped that way, and broke
   every install).

2. **Tests pass.**

   ```
   npm test
   ```

   votive's `npm test` watches and never exits, so run
   `node --test tests/*.js` there. vowel's suite includes
   `tests/packageContents.js`, which fails when the package would import
   a file or a dependency it doesn't ship.

3. **Bump the version.** `patch` for fixes, `minor` for features and
   breaking changes:

   ```
   npm version patch -m 'chore: release %s'
   ```

   This refuses to run on a dirty tree, updates `package.json` and the
   lockfile, commits them, and tags the commit `vX.Y.Z`.

4. **Publish.**

   ```
   npm publish
   ```

5. **Push the commit and its tag.**

   ```
   git push --follow-tags
   ```

## After a minor

- **Release notes.** List every breaking change, with an old → new
  table for anything a site's CSS or markdown names (classes, ids,
  variables, settings).
- **The docs.** Deploy vowel.cc only once the release that its pages
  describe is published.

## A patch to an older minor

Once 0.9 is out, a fix for 0.8 is released from a branch off its last
tag, under a dist-tag of its own, so it doesn't become `latest`:

```
git switch -c release-0.8 v0.8.1
npm version patch -m 'chore: release %s'
npm publish --tag release-0.8
git push -u origin release-0.8 --follow-tags
```

Then bring the fix to `main` if it applies there too.

## A beta

Work for the next minor goes on a `next` branch, while `main` keeps
taking patches. After each patch, merge `main` into `next`:

```
git switch next
git merge main
```

Publish betas under the `beta` dist-tag. Always pass `--tag beta`, or
the beta can become `latest` and every new install gets it.

The first beta is `0.9.0-beta.0`:

```
npm version preminor --preid beta -m 'chore: release %s'
npm publish --tag beta
git push --follow-tags
```

Each later beta is `0.9.0-beta.1`, `0.9.0-beta.2`, and so on:

```
npm version prerelease --preid beta -m 'chore: release %s'
npm publish --tag beta
git push --follow-tags
```

Testers opt in with `npx vowel@beta` or `npm install vowel@beta`. A
`^0.8.1` range never matches a beta, so nobody gets one by accident.

If a vowel beta needs a votive beta, publish votive's first, and pin it
exactly in vowel's `package.json` on `next` (`"votive": "0.6.0-beta.0"`):
a range doesn't match a prerelease.

To release the minor, merge `next` into `main`, then on `main`:

```
npm version minor -m 'chore: release %s'
npm publish
git push --follow-tags
```

From `0.9.0-beta.n`, `npm version minor` gives `0.9.0`. Then point the
`beta` dist-tag at the release, or remove it:

```
npm dist-tag add vowel@0.9.0 beta
```

## Checking a release

- `npm view vowel dist-tags` shows what `latest`, `beta` and the
  `release-*` tags point at.
- `git tag` should have a `vX.Y.Z` for every published version from
  here on.
