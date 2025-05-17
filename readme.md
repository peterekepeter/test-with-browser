# Test with browser

[![CI](https://github.com/peterekepeter/test-with-browser/actions/workflows/ci.yml/badge.svg)](https://github.com/peterekepeter/test-with-browser/actions/workflows/ci.yml)

Tests a website at given url for errors.

## Example usage

You can test a deployed web application by giving the URL to it, assuming
that it's running somewhere.

```yaml
steps:
- name: Test Deployed Website
  uses: peterekepeter/test-with-browser@v1.0.2
  timeout-minutes: 5
  with:
    url: 'https://github.com/status'
```

For now it's recommended to set an appropriate timeout from github actions.
The testing is supposed to stop when there is no more activity on the page,
but this detection can be flaky.

You can also test an html file that was commited to your repo, or a static
web-app that was bundled in a previous step.

```yaml
steps:
- name: Test Local HTML File
  uses: peterekepeter/test-with-browser@v1.0.2
  timeout-minutes: 5
  with:
    url: 'file://${{ github.workspace }}/test/static-site/index.html'
```

Test will fail if
 - there is an HTTP request with an error code 400..599
 - console.error was called for any reason

## Inputs

### `url`

**Required** The url that should be tested by the browser.
