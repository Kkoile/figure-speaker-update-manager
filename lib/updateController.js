'use strict';

var winston = require('winston');
var constants = require('./constants');
var request = require('request-promise');
var compareVersions = require('compare-versions');
var unzip = require('unzipper');
var fs = require('fs');
var path = require('path');
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

exports._getDownloadUrlOfLatestVersion = function() {
    return this._getLatestRelease()
        .then(function(oData) {
            return oData.zipball_url;
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

exports._downloadLatestVersion = function() {
    return this._getDownloadUrlOfLatestVersion()
        .then(function(sUrl) {
            return request({
                uri: sUrl,
                method: "GET",
                headers: {
                    'User-Agent': 'Request-Promise'
                }
            }).pipe(unzip.Extract({ path: process.cwd() + '/tmp' })).promise();
        })
        .then(function() {
            var aDirectories = fs.readdirSync(process.cwd() + '/tmp');
            var sDirectory = aDirectories.find(function(sFileOrDirectory) {
                return sFileOrDirectory.startsWith('Kkoile-figure-speaker-');
            });
            return process.cwd() + '/tmp/' + sDirectory;
        });
};

exports._installDependencies = function(sDirectory) {
    return new Promise(function(resolve, reject) {
        var sNpmCmd = os.platform().startsWith('win') ? 'npm.cmd' : 'npm';
        var installProcess = child_process.spawn(sNpmCmd, ['install'], {env: process.env, cwd: sDirectory, stdio: 'inherit'});
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

exports._buildProject = function(sDirectory) {
    return new Promise(function(resolve, reject) {
        var sNpmCmd = os.platform().startsWith('win') ? 'npm.cmd' : 'npm';
        var installProcess = child_process.spawn(sNpmCmd, ['run', 'build'], {env: process.env, cwd: sDirectory, stdio: 'inherit'});
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

exports._renameCurrentProject = function() {
    return new Promise(function(resolve, reject) {
        var sPathOfCurrentProject = process.env.PATH_TO_PROJECT;
        if (!sPathOfCurrentProject) {
            return reject(new Error('Environment variable PATH_TO_PROJECT needs to be set'));
        }
        if (sPathOfCurrentProject.endsWith('/')) {
            sPathOfCurrentProject = sPathOfCurrentProject.substring(0, sPathOfCurrentProject.length - 1);
        }
        fs.rename(sPathOfCurrentProject, sPathOfCurrentProject + '_OLD', function(err, data) {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
};

function deleteFolderRecursive(sPath) {
    if (fs.existsSync(sPath)) {
        fs.readdirSync(sPath).forEach(function(file, index){
            var curPath = sPath + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(sPath);
    }
};

exports._removeOldProject = function() {
    return new Promise(function(resolve, reject) {
        var sPathOfCurrentProject = process.env.PATH_TO_PROJECT;
        if (!sPathOfCurrentProject) {
            return reject(new Error('Environment variable PATH_TO_PROJECT needs to be set'));
        }
        if (sPathOfCurrentProject.endsWith('/')) {
            sPathOfCurrentProject = sPathOfCurrentProject.substring(0, sPathOfCurrentProject.length - 1);
        }
        deleteFolderRecursive(sPathOfCurrentProject + '_OLD');
        resolve();
    });
};

exports._replaceCurrentProjectWithNewOne = function(sDirectory) {
    return this._renameCurrentProject()
        .then(function() {
            return new Promise(function(resolve, reject) {
                var sPathOfCurrentProject = process.env.PATH_TO_PROJECT;
                if (!sPathOfCurrentProject) {
                    return reject(new Error('Environment variable PATH_TO_PROJECT needs to be set'));
                }
                fs.rename(sDirectory, sPathOfCurrentProject, function(err, data) {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            });
        })
        .then(this._removeOldProject.bind(this));
};

exports._stopCurrentProject = function() {
    return Promise.resolve();
};

exports._startCurrentProject = function() {
    return Promise.resolve();
};

exports.installLatest = function () {
    winston.info('Installing latest version');
    return this._downloadLatestVersion()
        .then(function(sDirectory) {
            return this._installDependencies(sDirectory)
                .then(function() {
                    return this._buildProject(sDirectory);
                }.bind(this))
                .then(this._stopCurrentProject.bind(this))
                .then(function() {
                    return this._replaceCurrentProjectWithNewOne(sDirectory);
                }.bind(this))
                .then(this._startCurrentProject.bind(this));
        }.bind(this))
};