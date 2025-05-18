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
      uses: peterekepeter/test-with-browser@v1.1.0
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
      uses: peterekepeter/test-with-browser@v1.1.0
      with:
        url: 'file://${{ github.workspace }}/test/hello.html'
```

## Browsers

You can specify if you want to test with `firefox` or `chrome`, by default
`chrome` will be used.

```yml
    steps:
    - name: 'Firefox'
      uses: peterekepeter/test-with-browser@v1.1.0
      with:
        url: 'file://${{ github.workspace }}/test/hello.html'
        browser: 'firefox'
```


## Testing failure cases

Sometimes it's necessary to check that errors are propertly reported.
Setting `expect-fail: true` will cause the test to pass only if it
fails. The following YML tests navigation fails to a file which does not exist.

```yml
    steps:
    - uses: peterekepeter/test-with-browser@main
      with:
        url: 'file://${{ github.workspace }}/test/doesnotexist'
        expect-fail: true
```

## Check for specific console message

You can set up the test to only pass if a certain log message is logged.
If you plan to run a test framework and it logs a message at the end
then you can use this to make the action fail if it does not match.

Note that 

```yml
    steps:
    - name: 'Expect console pattern matches'
      uses: peterekepeter/test-with-browser@main
      with:
        url: 'file://${{ github.workspace }}/test/test.html'
        expect-console-pattern: '\d+ tests successfully passed!'
```


## Configure timeouts

You can configure the timeouts. There is a timeout for browser inactivity
and a timeout for the test. If any of these timeouts are reached, the
browser is closed and a conclusion is drawn based on inspected logs
and inspected requests. You can see the default values below.

```yml
    steps:
    - uses: peterekepeter/test-with-browser@main
      with:
        url: 'file://${{ github.workspace }}/test/hello.html'
        timeout-seconds: 60
        timeout-inactive-seconds: 3
```
