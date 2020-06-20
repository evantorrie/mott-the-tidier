// __mocks__/@actions/glob.js

const glob = jest.genMockFromModule('@actions/glob');

let mockGlobs = Object.create(null);

function __setGlobs(newGlobs) {
    mockGlobs = Object.create(null);
    for (const g in newGlobs) {
        mockGlobs[g] = newGlobs[g];
    }
}

async function* syncToAsyncIterable(syncIterable) {
    for (const elem of syncIterable) {
        yield elem;
    }
}

async function create(pattern) {
    const results = mockGlobs[pattern] || [];

    const asyncIterable = syncToAsyncIterable(results);
    const asyncFun = () => { return asyncIterable; };
    const gen = Object.create(null);
    gen.globGenerator = asyncFun;
    return gen;
}


glob.create = create;
glob.__setGlobs = __setGlobs;

module.exports = glob;
