var assert = require('assert');
var sinon = require('sinon');
var nock = require('nock');

var unzip = require('unzipper');
var fs = require('fs');

var updateController = require('../lib/updateController');

describe('Update Controller', function () {

    var sandbox;
    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        nock.cleanAll();
        sandbox.restore();
    });

    describe('_getLatestVersion', function () {
        it('should call github API and retrieve latest version', function (done) {

            nock("https://api.github.com").get("/repos/Kkoile/figure-speaker/releases/latest").reply(200, JSON.stringify({tag_name: "1.0.1"}));

            updateController._getLatestVersion().then(function (sVersion) {
                assert(sVersion === "1.0.1");
                assert(nock.isDone());
                done();
            });
        });
        it('should remove first letter if it starts with `v`', function (done) {

            nock("https://api.github.com").get("/repos/Kkoile/figure-speaker/releases/latest").reply(200, JSON.stringify({tag_name: "v1.0.1"}));

            updateController._getLatestVersion().then(function (sVersion) {
                assert(sVersion === "1.0.1");
                assert(nock.isDone());
                done();
            });
        });
    });

    describe('_getDownloadUrlOfLatestVersion', function () {
        it('should call github API and retrieve url', function (done) {

            nock("https://api.github.com").get("/repos/Kkoile/figure-speaker/releases/latest").reply(200, JSON.stringify({tarball_url: "https://download/url"}));

            updateController._getDownloadUrlOfLatestVersion().then(function (sUrl) {
                assert(sUrl === "https://download/url");
                assert(nock.isDone());
                done();
            });
        });
    });

    describe('checkForUpdate', function () {
        it('should compare given version with latest version', function (done) {

            var oStub = sandbox.stub(updateController, '_getLatestVersion').resolves("1.0.1");

            updateController.checkForUpdate("1.0.0").then(function (oData) {
                assert(oData.latestVersion === "1.0.1");
                assert(oData.higherVersionAvailable === true);
                assert(oStub.calledOnce);
                done();
            });
        });
        it('should compare given version with latest version', function (done) {

            var oStub = sandbox.stub(updateController, '_getLatestVersion').resolves("1.0.1");

            updateController.checkForUpdate("1.0.1").then(function (oData) {
                assert(oData.latestVersion === "1.0.1");
                assert(oData.higherVersionAvailable === false);
                assert(oStub.calledOnce);
                done();
            });
        });
    });

    describe('_downloadLatestVersion', function () {
        it('should download unzip and save latest release', function (done) {
            nock("https://api.github.com").get("/repos/Kkoile/figure-speaker/releases/latest").reply(200, JSON.stringify({tarball_url: "https://download/url"}));
            nock("https://download").get("/url").reply(200, "BINARY ZIP FORMAT");
            var oStub = sandbox.stub(unzip, 'Extract').resolves("Kkoile-figure-speaker-3810034");
            var oStub = sandbox.stub(fs, 'readdirSync').returns(["Kkoile-figure-speaker-3810034"]);

            updateController._downloadLatestVersion().then(function (sPath) {
                assert(sPath === process.cwd() + '/tmp/Kkoile-figure-speaker-3810034');
                done();
            });
        });
    });

});