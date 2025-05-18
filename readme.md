# Test with browser

[![CI](https://github.com/peterekepeter/test-with-browser/actions/workflows/ci.yml/badge.svg)](https://github.com/peterekepeter/test-with-browser/actions/workflows/ci.yml)

A very basic testing tool for websites and web apps. Intended to be a 
minimalictic approach towards E2E testing.

## Minimal setup

You can test a deployed web application by giving the URL to it, assuming
that it's running somewhere where the runner has network access to.

```yaml
    steps:
    - name: Test Deployed Website
      uses: peterekepeter/test-with-browser@v1.0.2
      with:
        url: 'https://github.com/status'
```

The default criteria of success is for the website to load and have no
errors, no exceptions and no failed HTTP requests. By default the test 
ends when there is no browser activity detected for 5 seconds.

## Static files

You can also test an html file that was commited to your repo, or a static
web-app that was built in a previous step.

```yml
    steps:
    - name: Test Local HTML File
      uses: peterekepeter/test-with-browser@v1.0.2
      with:
        url: 'file://${{ github.workspace }}/test/static-site/index.html'
```

## Browsers

You can specify if you want to test with `firefox` or `chrome`, by default
`chrome` will be used.

```yml
    steps:
      - name: 'Firefox'
        uses: peterekepeter/test-with-browser@v1.0.2
        with:
          url: 'file://${{ github.workspace }}/test/static-site/index.html'
          browser: 'firefox'
```


## Testing failure cases

Sometimes it's necessary to check that errors are propertly reported.
Setting `expect-failure: true` will cause the test to pass only if it
fails. The following YML tests that the URL validation is working.

```yml
    steps:
      - name: 'URL Validation'
        uses: peterekepeter/test-with-browser@v1.0.2
        with:
          url: 'garbagevalue'
          expect-failure: true
```