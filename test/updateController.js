var assert = require('assert');
var sinon = require('sinon');
var nock = require('nock');

var child_process = require('child_process');
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

    describe('_runNPMUpdate', function () {
        it('should run npm update', function (done) {
            var aPassedArgs;
            var fnError;
            var fnClose;
            var oProcess = {
                on: function(sEvent, fnFunction) {
                    if (sEvent === 'error') {
                        fnError = fnFunction;
                    } else if (sEvent === 'close') {
                        fnClose  =fnFunction;
                    }
                }
            };
            var oNpmUpdateStub = sandbox.stub(child_process, 'spawn').callsFake(function(sCommand, aArgs) {
                aPassedArgs = aArgs;
                return oProcess;
            });

            updateController._runNPMUpdate().then(function () {
                assert(oNpmUpdateStub.calledOnce);
                assert(aPassedArgs.length === 3);
                assert(aPassedArgs[0] === 'update');
                assert(aPassedArgs[1] === '-g');
                assert(aPassedArgs[2] === 'figure-speaker');

                done();
            });
            fnClose(0);
        });
        it('should reject because there was an error', function (done) {
            var aPassedArgs;
            var fnError;
            var fnClose;
            var oProcess = {
                on: function(sEvent, fnFunction) {
                    if (sEvent === 'error') {
                        fnError = fnFunction;
                    } else if (sEvent === 'close') {
                        fnClose = fnFunction;
                    }
                }
            };
            var oNpmUpdateStub = sandbox.stub(child_process, 'spawn').callsFake(function(sCommand, aArgs) {
                aPassedArgs = aArgs;
                return oProcess;
            });

            updateController._runNPMUpdate().catch(function () {
                assert(oNpmUpdateStub.calledOnce);
                assert(aPassedArgs.length === 3);
                assert(aPassedArgs[0] === 'update');
                assert(aPassedArgs[1] === '-g');
                assert(aPassedArgs[2] === 'figure-speaker');

                done();
            });
            fnError();
        });
        it('should reject because there was an error', function (done) {
            var aPassedArgs;
            var fnError;
            var fnClose;
            var oProcess = {
                on: function(sEvent, fnFunction) {
                    if (sEvent === 'error') {
                        fnError = fnFunction;
                    } else if (sEvent === 'close') {
                        fnClose = fnFunction;
                    }
                }
            };
            var oNpmUpdateStub = sandbox.stub(child_process, 'spawn').callsFake(function(sCommand, aArgs) {
                aPassedArgs = aArgs;
                return oProcess;
            });

            updateController._runNPMUpdate().catch(function () {
                assert(oNpmUpdateStub.calledOnce);
                assert(aPassedArgs.length === 3);
                assert(aPassedArgs[0] === 'update');
                assert(aPassedArgs[1] === '-g');
                assert(aPassedArgs[2] === 'figure-speaker');

                done();
            });
            fnClose(1);
        });
    });

});