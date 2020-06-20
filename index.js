const core = require('@actions/core');
const exec = require('@actions/exec');
const process = require('process');
const utils = require('./utils');

async function run() {
    try {
        if (process.env["GITHUB_ACTIONS"]) {
            // console.log("Running inside a github action");
        }
        // To test this from your dev box, use "env INPUT_GOMODS='<test_pattern>' node index.js"
        const filePatterns = core
              .getInput('gomods')
              .split("\n")
              .map(s => s.trim())
              .filter(s => s !== "");
        let dirs = await utils.findDirectories(filePatterns);
        await gomodTidy(dirs);
        let diffs = await checkGoSumOnly();
        core.startGroup('Files changed');
        for (const f of diffs) {
            console.log(f);
        }
        core.endGroup();
        const gosum_only = core.getInput('gosum_only').toLowerCase();
        if (gosum_only === 'true' || gosum_only === 'enabled') {
            // count number of files which end in go.sum
            // \todo add check for full filename rather than suffix, i.e. ohgo.sum)
            let gosums = diffs.filter(s => s.endsWith('go.sum'));
            core.debug(`go.sums=${gosums}`);
            if (diffs.length !== gosums.length) {
                const msg = "Files other than go.sum were changed during go mod tidy!"; 
                throw new Error(msg);
            }
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();

async function gomodTidy(dirs) {
    let p = [];
    for (const d of dirs) {
        core.debug(`${d}: go mod tidy`);
        p.push(exec.exec('go', ['mod', 'tidy'], { cwd: d, silent: true }));
    }
    return await Promise.all(p);
}

// Run git status in each directory - to see what files have changed
// \todo check behaviour with git submodules
async function checkGoSumOnly() {
    core.debug(`git diff --name-only`);
    let myOutput = '';
    const options = {
        silent: true,
        listeners: {
            stdout: data => {
                myOutput += data.toString();
            }
        }
    };
    await exec.exec('git', ['diff', '--name-only'], options);
    // break up the filenames in output by line
    const diffs = myOutput.split("\n").filter(x => x.trim());
    core.debug(`diffs=${diffs}`);
    return diffs;
}
