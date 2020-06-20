const glob = require('@actions/glob');
const path = require('path');

const hasIterationProtocol = variable =>
      variable !== null && Symbol.iterator in Object(variable);

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

exports.findDirectories = findDirectories;

