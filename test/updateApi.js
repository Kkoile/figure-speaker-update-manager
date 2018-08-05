var assert = require('assert');
var sinon = require('sinon');
var request = require('supertest');

var updateController = require('../lib/updateController');

describe('Update Api', function () {
    var server;

    before(function () {
        sandbox = sinon.sandbox.create();
        server = require('../index.js');
    });

    after(function (done) {
        server.close(done);
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe('checkForUpdate', function () {
        it('should pass current version to controller', function (done) {
            var oUpdateControllerStub = sandbox.stub(updateController, 'checkForUpdate').withArgs("1.0.0").resolves();

            request(server)
                .get('/updates/checkForUpdate')
                .query({version: '1.0.0'})
                .expect(200, function (err, res) {
                    assert(res.status === 200);
                    assert(oUpdateControllerStub.calledOnce);
                    done();
                });
        });
        it('should reject if no version is provided', function (done) {
            var oUpdateControllerStub = sandbox.stub(updateController, 'checkForUpdate');

            request(server)
                .get('/updates/checkForUpdate')
                .query({})
                .expect(400, function (err, res) {
                    assert(res.status === 400);
                    assert(oUpdateControllerStub.notCalled);
                    done();
                });
        });
    });

    describe('installLatest', function () {
        it('should call update controller', function (done) {
            var oUpdateControllerStub = sandbox.stub(updateController, 'installLatest').resolves();

            request(server)
                .post('/updates/installLatest')
                .expect(200, function (err, res) {
                    assert(res.status === 200);
                    assert(oUpdateControllerStub.calledOnce);
                    done();
                });
        });
    });
});