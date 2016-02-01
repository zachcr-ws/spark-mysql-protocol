/*
*   Copyright (c) 2015 Particle Industries, Inc.  All rights reserved.
*
*   This program is free software; you can redistribute it and/or
*   modify it under the terms of the GNU Lesser General Public
*   License as published by the Free Software Foundation, either
*   version 3 of the License, or (at your option) any later version.
*
*   This program is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
*   Lesser General Public License for more details.
*
*   You should have received a copy of the GNU Lesser General Public
*   License along with this program; if not, see <http://www.gnu.org/licenses/>.
*/

var settings = require('../settings.js');
var CryptoLib = require('../lib/ICrypto.js');
var SparkCore = require('../clients/SparkCore.js');
var EventPublisher = require('../lib/EventPublisher.js');
var utilities = require('../lib/utilities.js');
var logger = require('../lib/logger.js');
var model = require("../lib/Model.js");
var crypto = require('crypto');
var ursa = require('ursa');
var when = require('when');
var path = require('path');
var net = require('net');
var fs = require('fs');


var DeviceServer = function (options) {
    this.options = options;
    this.options = options || {};
    settings.coreKeysDir = this.options.coreKeysDir = this.options.coreKeysDir || settings.coreKeysDir;

    this._allCoresByID = {};
    this._attribsByID = {};
    this._allIDs = {};

    this.init();
};

DeviceServer.prototype = {
    _allCoresByID: null,
    _attribsByID: null,
    _allIDs: null,


    init: function () {
        this.loadCoreData();
    },

    addCoreKey: function(coreid, public_key) {
        model.saveCoreKey({core_id: coreid, public_key: public_key});
        return false;
    },

    saveCoreData: function (coreid) {
        var defer = when.defer();
        try {
            var attribs = this._attribsByID[coreid];
            var that = this;
            
            model.saveCore(attribs).then(function(result){
                if ( result.insertId ) {
                    attribs.id = result.insertId;
                }
                defer.resolve()
            }, function (err) {
                if( err.code && err.code == "ER_DUP_ENTRY" ) {
                    logger.log("coreid already exist.");
                } else {
                    logger.error("Save core error: ", err);
                }
                defer.reject();
            });
        }
        catch (ex) {
            logger.error("Error saving core data ", ex);
        }
        
        return defer.promise;
    },

    loadCoreData: function () {
        var attribsByID = {};
        var that = this;

        model.allCore().then(function(result){
            for (var i in result) {
                var core = result[i];
                core.coreID = core.core_id;
                attribsByID[core.coreID] = core;
                that._allIDs[core.coreID] = true;
            }
            that._attribsByID = attribsByID;
        }, function(err){
            logger.error("Get AllCore Error: ", err);
        });
    },

    getCore: function (coreid) {
        return this._allCoresByID[coreid];
    },

    getCoreAttributes: function (coreid) {
        //assert this exists and is set properly when asked.
        this._attribsByID[coreid] = this._attribsByID[coreid] || {};
        //this._attribsByID[coreid]["coreID"] = coreid;

        return this._attribsByID[coreid];
    },

    setCoreAttribute: function (coreid, name, value) {
        this._attribsByID[coreid] = this._attribsByID[coreid] || {};
        this._attribsByID[coreid][name] = value;
        if ( !this._attribsByID[coreid].coreID ) {
            this._attribsByID[coreid]["coreID"] = coreid;
        }
        this.saveCoreData(coreid);
        return true;
    },

    setCoreAttributes: function(coreid, objects, callback) {
        var that = this;
        this._attribsByID[coreid] = this._attribsByID[coreid] || {};
        for(var key in objects) {
            this._attribsByID[coreid][key] = objects[key];
        }
        if ( !this._attribsByID[coreid].coreID ) {
            this._attribsByID[coreid]["coreID"] = coreid;
        }
        this.saveCoreData(coreid).then(function(){
            that.loadCoreData();
            if(callback) callback();
        });
        return;
    },

    getCoreByName: function (name) {
        //var cores = this._allCoresByID;
        var cores = this._attribsByID;
        for (var coreid in cores) {
            var attribs = cores[coreid];
            if (attribs && (attribs.name == name)) {
                return this._allCoresByID[coreid];
            }
        }
        return null;
    },

    /**
     * return all the cores we know exist
     * @returns {null}
     */
    getAllCoreIDs: function () {
        return this._allIDs;
    },

    /**
     * return all the cores that are connected
     * @returns {null}
     */
    getAllCores: function () {
        return this._allCoresByID;
    },

    /**
     * return one core's claim_code and compare them
     * @returns {promise}
     */
    compareClaimCode: function(coreid, claim_code) {
        var defer = when.defer();

        model.findCoreKey(coreid).then(function (result) {
            if (result.length > 0 && result[0].claim_code == claim_code) {
                defer.resolve();
            } else {
                defer.reject("fail");
            }
        }, function (err) {
            defer.reject({
                error: err
            });
        });

        return defer.promise;
    },


//id: core.coreID,
//name: core.name || null,
//last_app: core.last_flashed_app_name || null,
//last_heard: null


    start: function () {
        global.settings = settings;

        //
        //  Create our basic socket handler
        //

        var that = this,
            connId = 0,
            _cores = {},
            server = net.createServer(function (socket) {
                process.nextTick(function () {
                    try {
                        var key = "_" + connId++;
                        logger.log("Connection from: " + socket.remoteAddress + ", connId: " + connId);

                        var core = new SparkCore();
                        core.socket = socket;
                        core.startupProtocol();
                        core._connection_key = key;

                        //TODO: expose to API


                        _cores[key] = core;
                        core.on('ready', function () {
                            logger.log("Core online!");
                            var coreid = this.getHexCoreID();
                            that._allCoresByID[coreid] = core;
                            that._attribsByID[coreid] = that._attribsByID[coreid] || {
                                coreID: coreid,
                                name: null,
                                ip: this.getRemoteIPAddress(),
                                product_id: this.spark_product_id,
                                firmware_version: this.product_firmware_version
                            };
                        });
                        core.on('disconnect', function (msg) {
                            logger.log("Session ended for " + core._connection_key);
                            delete _cores[key];
                        });
                    }
                    catch (ex) {
                        logger.error("core startup failed " + ex);
                    }
                });
            });

        global.cores = _cores;
        global.publisher = new EventPublisher();

        server.on('error', function () {
            logger.error("something blew up ", arguments);
        });


        //
        //  Load the provided key, or generate one
        //
        if (!fs.existsSync(settings.serverKeyFile)) {
            console.warn("Creating NEW server key");
            var keys = ursa.generatePrivateKey();


            var extIdx = settings.serverKeyFile.lastIndexOf(".");
            var derFilename = settings.serverKeyFile.substring(0, extIdx) + ".der";
            var pubPemFilename = settings.serverKeyFile.substring(0, extIdx) + ".pub.pem";

            fs.writeFileSync(settings.serverKeyFile, keys.toPrivatePem('binary'));
            fs.writeFileSync(pubPemFilename, keys.toPublicPem('binary'));

            //DER FORMATTED KEY for the core hardware
            //TODO: fs.writeFileSync(derFilename, keys.toPrivatePem('binary'));
        }


        //
        //  Load our server key
        //
        CryptoLib.loadServerKeys(
            settings.serverKeyFile,
            settings.serverKeyPassFile,
            settings.serverKeyPassEnvVar
        );

        //
        //  Wait for the keys to be ready, then start accepting connections
        //
        server.listen(settings.PORT, function () {
            logger.log("SOAP started", { host: settings.HOST, port: settings.PORT });
        });


    }

};
module.exports = DeviceServer;