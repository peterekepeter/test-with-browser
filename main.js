const core = require('@actions/core');
const github = require('@actions/github');
const puppeteer = require('puppeteer');

githubActionsMain();

async function githubActionsMain() {
    try {
        const url = core.getInput('url');
        const result = await automate(url);
        if (!result) {
            core.setFailed("Errors detect when browsing " + url);
        }
    }
    catch (err) {
        core.setFailed(err);
    }
}

function printContext() {
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    console.log(`The event payload: ${payload}`);
}

async function automate(testUrl) {

    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({    
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();

    let errorCount = 0;

    const timer = new Timer({
        debounceMs: 1000, // 1 second
        totalMs: 60000, // 60 seconds
    });

    page.on('request', request => {
        const method = request.method();
        let style = "36;1";
        switch(method) {
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
        switch(msgType){
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
        console.log(`\x1b[${style}m${pass?'.':'x'} ${msgType}\x1b[0m`, item.text());
        timer.debounce();
        if (!pass) {
            errorCount+=1;
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
        console.log(`\x1b[${style}m${pass?'.':'x'} ${code}\x1b[0m ${url}`);
        timer.debounce();
        if (!pass) {
            errorCount+=1;
        }
    });

    // Navigate the page to a URL.
    const url = testUrl;
    console.log(`\x1b[37;1mTEST:\x1b[0m ${url}`);
    await page.goto(url);
    await page.setViewport({width: 1080, height: 1024});
    await timer.promise;
    await browser.close();

    if (errorCount > 0) {
        console.log(`\x1b[31;1mfailed! ${errorCount} errors were found on ${url}`);
        return false;
    } else {
        console.log(`\x1b[34;1msuccess! no errors were found on ${url}`);
        return true;
    }

}

class Timer {

    constructor(options) {
        this.debounceMs = options?.debounceMs ?? 1000;
        this.totalMs = options?.totalMs ?? 60000;
        this.handler = () => this.end();
        this.promise = new Promise((resolve) => {
            this.resolve = resolve;
            this.globalTimeout = setTimeout(this.handler, this.totalMs);
            this.debounceTimeout = setTimeout(this.handler, this.debounceMs);
        });
    }

    debounce() {
        clearTimeout(this.debounceTimeout);
        setTimeout(this.handler, this.debounceMs);
    }

    end() {
        clearTimeout(this.debounceTimeout);
        clearTimeout(this.globalTimeout);
        this.resolve();
    }

}
