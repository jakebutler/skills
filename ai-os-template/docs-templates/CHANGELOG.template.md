<!--
  TEMPLATE: CHANGELOG.md — checkpoint/user-facing ledger.

  WRITE TIER: A — fully automatic for the Unreleased draft section (see
  DESIGN-MEMO.md §7.4); the draft section is where hooks/workflows append entries as
  work lands.
  - Prepend-newest: new released sections go at the top, directly under Unreleased.
  - Append-only for past entries. Never edit or delete a released section once it's
    written — if history was wrong, add a new entry that corrects it, don't rewrite it.
  - Git history is the commit-level ledger. This file is NOT a mirror of every commit —
    entries are meaningful, user- or checkpoint-facing changes, not commit noise
    ("fix typo," "wip," "address review comment" do not belong here).
  - The `## Unreleased` section is a running draft. Automatic hooks may add entries to
    it as work completes; a human or the wrap-session workflow cuts it into a dated
    release section when it's ready to ship.

  Instantiation: replace {{PLACEHOLDERS}}. Delete the example released section below
  once real entries exist.
-->

# Changelog

All notable changes to {{REPO_NAME}}. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); entries are meaningful changes, not a
commit-by-commit mirror (see git log for that).

## Unreleased

<!-- Draft section. Hooks/workflows may append entries here automatically as work
     lands; cut to a dated section below at release/checkpoint time. -->

### Added
- {{UNRELEASED_ADDED_ITEM}}

### Changed
- {{UNRELEASED_CHANGED_ITEM}}

### Fixed
- {{UNRELEASED_FIXED_ITEM}}

<!-- EXAMPLE released section — delete once real entries replace it. -->
## [{{VERSION_OR_DATE}}] — {{RELEASE_DATE}}

### Added
- {{ADDED_ITEM}}

### Changed
- {{CHANGED_ITEM}}

### Fixed
- {{FIXED_ITEM}}
