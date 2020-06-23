const core = require('@actions/core');
const glob = require('@actions/glob');
const path = require('path');

const hasIterationProtocol = variable =>
      variable !== null && Symbol.iterator in Object(variable);

/**
 * @param diffs array of filenames to examine
 * @param gosum boolean check all files are go.sum only
 * @param gomodsum boolean check all files are go.mod or go.sum only
 * @returns {void}
 * @throws string exeception if diffs do not satisfy constraints
 */
function checkModifiedFiles(diffs, gosum_only, gomodsum_only) {
    if (!(gosum_only || gomodsum_only)) {
        // then we really don't care about what files were modified
        return;
    }
    // precondition diffs is a container that has a 'filter' operation
    // \todo add check for full filename rather than suffix, i.e. ohgo.sum)
    let gosums = diffs.filter(s => s.endsWith('go.sum'));
    let gomods = diffs.filter(s => s.endsWith('go.mod'));
    core.debug(`go.sums=${gosums}, go.mods=${gomods}, diffs=${diffs}`);
    let desired = gosum_only ? gosums.length : (gosums.length + gomods.length);
    if (diffs.length !== desired) {
        const fileSpec = gosum_only ? 'go.sum' : 'go.{mod,sum}';
        const msg = `Files other than ${fileSpec} were changed during \`go mod tidy\`!`;
        throw new Error(msg);
    }
}

/**
 * @param patterns An Iterable container of globbale patterns
 * @returns {array} array of paths matching the globs
 */
async function findDirectories(patterns) {
    let dirs = new Set();
    if (hasIterationProtocol(patterns)) {
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

exports.checkModifiedFiles = checkModifiedFiles;
exports.findDirectories = findDirectories;

