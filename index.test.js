const process = require('process');
const cp = require('child_process');
const path = require('path');
const utils = require('./utils');

describe('test findDirectories', () => {
    const MOCK_GLOBS_INFO = {
        'go.mod': ['/foo/go.mod'],
        'test/go.mod': ['/foo/test/go.mod'],
        '**/go.mod': ['/foo/test/go.mod', '/foo/bar/go.mod']
    };

    beforeEach(() => {
        require('@actions/glob').__setGlobs(MOCK_GLOBS_INFO);
    });

    test('returns an empty array with an empty param', async() => {
        const dirs = await utils.findDirectories();
        expect(dirs).toEqual([]);
    });

    test('returns an empty array with a non-iterable object', async() => {
        const dirs = await utils.findDirectories(100);
        expect(dirs).toEqual([]);
    });

    test('findDirectories iterates over patterns', async() => {
        const dirs = await utils.findDirectories(['go.mod', 'test/go.mod']);
        expect(dirs).toEqual(['/foo', '/foo/test']);
    });

});

// shows how the runner will run a javascript action with env / stdout protocol
test.skip('test runs', () => {
    process.env['INPUT_GOMODS'] = 'go.mod';
    const ip = path.join(__dirname, 'index.js');
    console.log(cp.execSync(`node ${ip}`, { env: process.env }).toString());
})

