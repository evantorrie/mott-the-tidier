
<p align="center">
  <a href="https://github.com/evantorrie/mott-the-tidier/actions"><img alt="mott-the-tidier status" src="https://github.com/evantorrie/mott-the-tidier/workflows/units-test/badge.svg"></a>
</p>

# Mott the Tidier

This Github Action will run `go mod tidy` on a user-defined
set of directories.

There is also an option to **fail**, i.e. stop the workflow in the
general case, if any of the git tracked files tracked that are modified are
files *other than* `go.sum` files.

### Requirements

This Github Action must be run after the following conditions are met in your Github workflow.

1. Your code must be checked out. We suggest using `actions/checkout@v2`.
1. `go` must be installed on the workflow runner. We suggest using `actions/setup-go@v2`.

### Usage

Add this action as a step after you have checked out your code and
installed go on the Workflow runner.


```yaml
- uses: evantorrie/mott-the-tider@v1-beta
  with:   # all inputs are optional

    # file path pattern to go.mod files
    # This defaults to `go.mod`, but can use any of the glob patterns
    # as understood by @actions/glob - and includes support for multiple
    # patterns, one per line, as well as negating patterns (e.g. preceded by `-`).

    gomods: |
      **/go.mod
      -tools/go.mod

    # enforce action failure if any files modified as a result of the action
    # are *not* `go.sum` files
    # defaults to false

    gosum_only: true
```

### Example

Here is a typical workflow usage:

```yaml
name: Mod Tidier
on: [ pull_request ]

jobs:
  mod_tidier:
    runs-on: ubuntu-latest
    name: Clean up mismatched go.sum files
    steps:
    - uses: actions/checkout@v2
      with:
        ref: ${{ github.head_ref }}
    - uses: actions/setup-go@v2
      with:
        go-version: '^1.14.0'
    - uses: evantorrie/mott-the-tidier@v1-beta
      with:
        gomods: |
          **/go.mod
          -tools/go.mod
        gosum_only: true
    - uses: stefanzweifel/git-auto-commit-action@v4
      with:
        commit_message: Auto-fix go.sum discrepancies
```

### Inputs

1.  `gomods`
    Defaults to `go.mod`, i.e. top level `go.mod` in repo.

2.  `gosum_only`
    Defaults to `false`


### Outputs

TBD

## Background

The original impetus for this action was the introduction of
[Dependabot](https://github.blog/2020-06-01-keep-all-your-packages-up-to-date-with-dependabot/
"Dependabot") into an [open-source Go
project](https://github.com/open-telemetry/opentelemetry-go/
"OpenTelemetry").

Dependabot is a brilliant tool which will automatically create a pull
request by modifying `go.mod` and `go.sum` files for outdated
dependencies in a go module.  Unfortunately, it does not look (as of this time)
at transitive dependencies of the module in question elsewhere in the repo.
_Admittedly, this is usually rare in most Go projects_.

On the other hand, our build workflow which runs on every PR performs
`go mod tidy` as one of its actions and will fail the build if any
files in the repository show as "dirty" in a `git status`. With the
introduction of Dependabot, we would get many automatic dependency
update pull requests opened, but nearly all with _Build Failed_
messages due to these `go mod tidy` resulting in changes to `go.sum` files
in dependent modules elsewhere.

This action can be run as part of a workflow which targets these
Dependabot pull requests (or any Github targetable event) and
generates the *correct* per `go mod tidy` `go.sum` files. A subsequent
action in the workflow can auto-commit these changes back to the
PR such that the automatic Dependabot pull requests show up as
_Successful_ in our CI system.
