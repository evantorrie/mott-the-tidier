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

describe('checkModifiedFiles', () => {
    const filesOnlyGosum = [ 'go.sum', 'tests/go.sum', 'foo/bar/go.sum' ];
    const filesOnlyGosumGomod = [ 'go.mod', 'go.sum', 'foo/bar/go.mod', 'foo/bar/go.sum', 'bar/go.mod' ];
    const filesAll = [ ...filesOnlyGosum, ...filesOnlyGosumGomod, 'main.go' ];

    test('does not throw when both flags disabled', () => {
        expect(() => utils.checkModifiedFiles(filesAll, false, false)).not.toThrow();
        expect(() => utils.checkModifiedFiles(filesOnlyGosum, false, false)).not.toThrow();
        expect(() => utils.checkModifiedFiles(filesOnlyGosumGomod, false, false)).not.toThrow();
    });

    test('throws on arbitrary files when either flag enabled', () => {
        expect(() => utils.checkModifiedFiles(filesAll, true, false)).toThrow();
        expect(() => utils.checkModifiedFiles(filesAll, false, true)).toThrow();
    });

    test('throws on go.mod files when gosum_only flag enabled', () => {
        expect(() => utils.checkModifiedFiles(filesAll, true, false)).toThrow();
        expect(() => utils.checkModifiedFiles(filesOnlyGosumGomod, true, false)).toThrow();
        expect(() => utils.checkModifiedFiles(filesOnlyGosum, true, false)).not.toThrow();
    });

    test('does not throw on go.sum only files when gomodsum_only flag enabled', () => {
        expect(() => utils.checkModifiedFiles(filesOnlyGosum, false, true)).not.toThrow();
        expect(() => utils.checkModifiedFiles(filesOnlyGosumGomod, false, true)).not.toThrow();
    });

});

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
    process.env['INPUT_GOMODS'] = 'go.mod';
    const ip = path.join(__dirname, 'index.js');
    console.log(cp.execSync(`node ${ip}`, { env: process.env }).toString());
})

