
<p align="center">
  <a href="https://github.com/evantorrie/mott-the-tidier/actions"><img alt="mott-the-tidier status" src="https://github.com/evantorrie/mott-the-tidier/workflows/units-test/badge.svg"></a>
</p>

# Mott the Tidier

This is a Github Action that will run `go mod tidy` on a user-defined
set of directories.

There is also an option to _fail_, i.e. stopping the workflow, if any
of the files tracked by git that are modified are files *other than*
`go.sum` files.

This may be used to fail a build if any of the `go.mod` files in the
checked out code are modified, e.g. if the code has superfluous
dependencies or missing necessary dependencies.

## Requirements

1. Your code must be checked out. We suggest using `actions/checkout@v2`.
1. `go` must be installed on the workflow runner. We suggest using `actions/setup-go@v2`.

