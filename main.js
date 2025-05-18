'use strict';

async function main() {
    const actions = require('@actions/core');

    // const github = require('@actions/github');
    // Get the JSON webhook payload for the event that triggered the workflow
    // const payload = JSON.stringify(github.context.payload, undefined, 2)
    // console.log(`The event payload: ${payload}`);

    const url = actions.getInput('url');
    const browser = actions.getInput('browser');
    const expectFailure = actions.getBooleanInput('expect-fail');
    const expectConsolePatternStr = actions.getInput('expect-console-pattern')
    const requiresFirefox = browser === "firefox";

    let error = null;
    try {
        if (requiresFirefox) {
            // npx puppeteer browsers install firefox
            sh("npx", "puppeteer", "browsers", "install", "firefox");
        }

        let consoleRegex = null
        if (expectConsolePatternStr) {
            consoleRegex = new RegExp(expectConsolePatternStr, 'i');
        }

        await automateBrowser({ url, browser, consoleRegex });
    }
    catch (err) {
        error = err;
    }

    if (expectFailure) {
        if (error) {
            console.log(`\x1b[34;1mSuccess! Found expected error: ${error}`)
            error = null;
        }
        else {
            error = new Error("Expected an error, but none found.");
        }
    }

    if (error) {
        actions.setFailed(error);
    }
}

async function automateBrowser({ url = '', browser = 'chrome', consoleRegex = null } = {}) {
    // Before we continue, validate that the URL is valid
    console.log(`\x1b[37;1mTest with ${browser}:\x1b[0m ${JSON.stringify(url)}`);
    const URL = require("url").URL;
    new URL(url); // throws if invalid

    // Launch the browser and open a new blank page
    const puppeteer = require('puppeteer');
    const browserInstance = await puppeteer.launch({
        args: ['--no-sandbox'],
        browser: browser
    });
    let browserCloseReason = "Unknown reason!"
    try {
        await automatePage(browserInstance, url, consoleRegex);
    }
    catch (err) {
        browserCloseReason = "Error was thrown"
        throw err;
    }
    finally {
        console.log(`Closing browser: ${browserCloseReason}!`)
        await browserInstance.close();
    }

}

async function automatePage(browserInstance, navigateUrl, consoleRegex) {
    const page = await browserInstance.newPage();

    let consoleRegexMatch = 0
    let errorCount = 0;

    const timer = new Timer({
        debounceMs: 1000, // 1 second
        totalMs: 60000, // 60 seconds
    });
    console.log(`timer.reason: ${timer.reason}`);

    page.on('request', request => {
        const method = request.method();
        let style = "36;1";
        switch (method) {
            case "GET": style = "32;1"; break;
            case "POST": style = "33;1"; break;
            case "PUT": style = "33;1"; break;
            case "DELETE": style = "31;1"; break;
            default: style = "36;1"; break;
        }
        console.log(`\x1b[${style}m. ${request.method()}\x1b[0m`, request.url());
        timer.debounce();
    });

    page.on('console', item => {
        let pass = true;
        const msgType = item.type();
        let style = "38;1";
        switch (msgType) {
            case 'error':
            case 'assert':
                style = "31;1"
                pass = false;
                break;
            case 'warn':
                style = "33;1"
                break;
            default:
                style = "36;1"
                break;
        }
        const text = item.text();
        console.log(`\x1b[${style}m${pass ? '.' : 'x'} ${msgType}\x1b[0m`, text);
        timer.debounce();
        if (consoleRegex && consoleRegex.test(text)) {
            console.log('\x1b[32;1m. . matches\x1b[0m', JSON.stringify(consoleRegex.toString()))
            consoleRegexMatch += 1;
        }
        if (!pass) {
            errorCount += 1;
        }
    })

    page.on('response', response => {
        let pass = true;
        const code = response.status();
        const url = response.url();
        let style = "33;1";
        if (200 <= code && code < 300) {
            style = "32;1";
        }
        else if (300 <= code && code < 400) {
            style = "33;1";
        }
        else if (300 <= code && code < 400) {
            style = "33;1";
        }
        else if (400 <= code && code < 600) {
            style = "31;1";
            pass = false;
        }
        else {
            style = "35;1";
            pass = false;
        }
        console.log(`\x1b[${style}m${pass ? '.' : 'x'} ${code}\x1b[0m ${url}`);
        timer.debounce();
        if (!pass) {
            errorCount += 1;
        }
    });

    // Navigate the page to a URL.
    await page.goto(navigateUrl);
    await page.setViewport({ width: 1080, height: 1024 });
    await timer.promise;
    console.log(`timer.reason: ${timer.reason}`);
    if (timer.reason == 1) browserCloseReason = `Timeout of ${timer.totalMs}ms exceeded`;
    else if (timer.reason == 2) browserCloseReason = `No browser activity for ${timer.debounceMs}ms`;

    if (consoleRegex && consoleRegexMatch <= 0) {
        if (consoleRegexMatch <= 0) {
            const message = `${consoleRegex} did not match anything`;
            console.log(`\x1b[31;1mfailed! ${message}!`);
            throw new Error(message)
        }
    }

    if (errorCount > 0) {
        message = `${errorCount} errors were found`;
        console.log(`\x1b[31;1mfailed! ${message} errors were found on ${navigateUrl}`);
        throw new Error(message)
    }

}

class Timer {

    constructor(options) {
        this.debounceMs = options?.debounceMs ?? 1000;
        this.totalMs = options?.totalMs ?? 60000;
        this.handler = reason => this.end(reason);
        this.reason = 0;
        this.promise = new Promise((resolve) => {
            this.resolve = resolve;
            this.globalTimeout = setTimeout(this.handler, this.totalMs, 1);
            this.debounceTimeout = setTimeout(this.handler, this.debounceMs, 2);
        });
    }

    debounce() {
        clearTimeout(this.debounceTimeout);
        setTimeout(this.handler, this.debounceMs);
    }

    end(reason) {
        this.reason = reason;
        clearTimeout(this.debounceTimeout);
        clearTimeout(this.globalTimeout);
        this.resolve();
    }

}

function sh(cmd, ...args) {
    const { spawnSync } = require("child_process");
    const result = spawnSync(cmd, args, { stdio: 'inherit' });
    if (result.error) {
        console.error(result.error);
    }
    if (result.status) {
        console.error("status code", result.status);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
} else {
    module.exports = { Timer };
}
