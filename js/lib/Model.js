/*
 *  Mysql model
 *  	saveCore: save core infomation
 *      saveCoreKey: save core's identify
 *      allCore: get all core
 *      findCore: get one core
 */

var client = require("./MysqlDb.js").InitMysqlClient();
var memo = require("./Memory.js");
var when = require("when");

var Model = {

	saveCore: function (core) {
		if( !core.id ){
			var name = typeof core.name == "undefined" ? "" : core.name;
			var firmware = typeof core.firmware_version == "undefined" ? "" : core.firmware_version;
			//var group = (typeof core.group == "undefined" || core.group == 0) ? 1 : core.group;
			var values = [0, 
				name, 
				core.coreID, 
				core.registrar,
				core.timestamp,
				firmware
				//group
			];
			return client.save("core", values);
		} else {
			core.core_id = core.coreID;
			delete core.coreID;

			return client.update("core", core, ["id=?"], [core.id]);
		}
	},

	saveCoreKey: function (corekey) {
		client.find("core_key", ["core_id=?"], [corekey.core_id]).then(function(result){
			if ( !result && result.length <= 0 ){
				return client.save("core_key", [corekey.core_id, "", corekey.public_key]);
			} else {
				result[0].public_key = corekey.public_key;
				return client.update("core_key", result[0], ["core_id=?"], [corekey.core_id]);
			}
		}, function(err){
			console.log("Save Core Key Error: ", err);
		});
	},

	saveClaimCode: function(id, code) {
		var defer = when.defer();
		this.updateRegistrar(id, code);

		client.find("core_key", ["core_id=?"], [id]).then(function(result) {
			if ( result.length > 0) {
				result[0].claim_code = code;
				client.update("core_key", result[0], ["core_id=?"], [id]).then(function(resp) {
					defer.resolve(result);
				}, function(err) {
					defer.reject(err);
				});
			} else {
				defer.reject("Core " + id + " is not Exsits.");
			}
		}, function(err) {
			defer.reject(err);
		});

		return defer.promise;
	},

	updateRegistrar: function(id, code) {
		this.getUserByClaimCode(code).then(function(user) {
			if(user.length > 0) {
				var user_id = user[0].id;

				client.find("core", ["core_id=?"], [id]).then(function(core) {
					if(core.length > 0) {
						core[0].registrar = user_id;
						memo.setAttribute(id, "registrar", user_id);
						client.update("core", core[0], ["core_id=?"], [id]);
					}
				});
			}
		});
	},

	findCore: function (coreid) {
		return client.find("core", ["core_id=?"], [coreid]);
	},

	allCore: function () {
		return client.find("core");
	},

	findCoreKey: function(coreid) {
		return client.find("core_key", ["core_id=?"], [coreid]);
	},

	getUserByClaimCode: function(code) {
		return client.find("user", ["claim_code=?"], [code]);
	}
}

module.exports = Model;