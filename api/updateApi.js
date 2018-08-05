"use strict";

var winston = require('winston');
var express = require('express');
var url = require('url');

var updateController = require('../lib/updateController');

var updateApi = express.Router();

updateApi.route('/checkForUpdate').get(function (req, res, next) {
    winston.debug("Checking for update");
    var oQuery = url.parse(req.url, true).query,
        sVersion = oQuery.version;
    if (!sVersion) {
        res.status(400).send("The current version has to be provided.");
        return;
    }
    updateController.checkForUpdate(sVersion)
        .then(function(oData) {
            res.send(oData);
        })
        .catch(next);
});

updateApi.route('/installLatest').post(function (req, res, next) {
    winston.info("Installing Latest Version");
    updateController.installLatest()
        .then(function(oData) {
            res.send(oData);
        })
        .catch(next);
});

module.exports = updateApi;