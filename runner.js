const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs")

if (!fs.existsSync(__dirname + "/node_modules")) {
    sh("npm", "--prefix", __dirname, "install");
}

sh("node", path.join(__dirname, "main.js"));

function sh(cmd, ...args){
    const result = spawnSync(cmd, args, { stdio: 'inherit' });
    if (result.error) {
        console.error(result.error);
    }
    if (result.status) {
        console.error("status code", result.status);
        process.exit(1);
    }
}
