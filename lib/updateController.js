'use strict';

var winston = require('winston');
var constants = require('./constants');
var request = require('request-promise');
var compareVersions = require('compare-versions');
var os = require('os')
var child_process = require('child_process');

exports._getLatestRelease = function() {
    return request({
        uri: constants.Github.API + '/repos/' + constants.Github.Repository + '/releases/latest',
        method: "GET",
        json: true,
        headers: {
            'User-Agent': 'Request-Promise'
        }
    });
};

exports._getLatestVersion = function() {
    return this._getLatestRelease()
        .then(function(oData) {
            var sVersion = oData.tag_name;
            if (sVersion.startsWith('v')) {
                sVersion = sVersion.substring(1);
            }
            return sVersion;
        });
};

exports.checkForUpdate = function (sCurrentVersion) {
    winston.debug('Checking for update since version', sCurrentVersion);
    return this._getLatestVersion()
        .then(function(sLatestVersion) {
            var iComparisonResult = compareVersions(sLatestVersion, sCurrentVersion);
            return {
                higherVersionAvailable: iComparisonResult === 1,
                latestVersion: sLatestVersion
            }
        });
};

exports._restartFigureSpeaker = function() {
    return new Promise(function(resolve, reject) {
        var installProcess = child_process.spawn('sudo', ['systemctl', 'restart', 'figure-speaker'], {env: process.env, stdio: 'inherit'});
        installProcess.on('error', reject);
        installProcess.on('close', function(iCode) {
           if (iCode === 0) {
               resolve();
           } else {
               reject();
           }
        });
    });
};

exports._runNPMUpdate = function() {
    return new Promise(function(resolve, reject) {
        var sNpmCmd = os.platform().startsWith('win') ? 'npm.cmd' : 'npm';
        var installProcess = child_process.spawn(sNpmCmd, ['install', '-g', 'figure-speaker@latest'], {env: process.env, stdio: 'inherit'});
        installProcess.on('error', reject);
        installProcess.on('close', function(iCode) {
           if (iCode === 0) {
               resolve();
           } else {
               reject();
           }
        });
    });
};

exports.installLatest = function () {
    winston.info('Installing latest version');
    return this._runNPMUpdate()
        .then(this._restartFigureSpeaker);
};