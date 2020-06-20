const core = require('@actions/core');
const exec = require('@actions/exec');
const glob = require('@actions/glob');
const path = require('path');
const process = require('process');

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
        let dirs = await findDirectories(filePatterns);
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

async function findDirectories(patterns) {
    let dirs = new Set();
    for (const p of patterns) {
        let pat = p[0] != '-' ? p : p.substr(1);
        let matches = new Set();
        const globber = await glob.create(pat);
        for await (const f of globber.globGenerator()) {
            matches.add(path.dirname(f));
        }
        if (p[0] == '-') {
            dirs = difference(dirs, matches);
        } else {
            dirs = union(dirs, matches);
        }
    }
    return [...new Set(dirs)];
}

function union(setA, setB) {
    let _union = new Set(setA);
    for (let elem of setB) {
        _union.add(elem);
    }
    return _union;
}

function difference(setA, setB) {
    let _difference = new Set(setA);
    for (let elem of setB) {
        _difference.delete(elem);
    }
    return _difference;
}
