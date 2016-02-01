/*
 *  Mysql model
 *  	saveCore: save core infomation
 *      saveCoreKey: save core's identify
 *      allCore: get all core
 *      findCore: get one core
 */

var client = require("./MysqlDb.js").InitMysqlClient();
var when = require("when");

var Model = {

	saveCore: function (core) {
		if( !core.id ){
			var name = typeof core.name == "undefined" ? "" : core.name;
			var values = [0, name, core.coreID, core.registrar, core.timestamp];
			return client.save("core", values);
		} else {
			var id = core.id;
			core.core_id = core.coreID;

			delete core.id;
			delete core.coreID;
			
			return client.update("core", core, ["id=?"], [id]);
		}
	},

	saveCoreKey: function (corekey) {
		client.find("core_key", ["core_id=?"], [corekey.core_id]).then(function(result){
			if ( result.length <= 0 ){
				return client.save("core_key", [corekey.core_id, "", corekey.public_key]);
			} else {
				reslut[0].public_key = corekey.public_key;
				return client.update("core_key", reslut[0], ["core_id=?"], [corekey.core_id]);
			}
		}, function(err){
			console.log("Save Core Key Error: ", err);
		});
	},

	saveClaimCode: function(id, code) {
		var defer = when.defer();

		client.find("core_key", ["core_id=?"], [id]).then(function(reslut) {
			if ( reslut.length >= 0) {
				reslut[0].claim_code = code;
				client.update("core_key", reslut[0], ["core_id=?"], [id]).then(function(resp) {
					defer.resolve(reslut);
				}, function(err) {
					defer.reject(err);
				});
			} else {
				defer.reject("Core " + id + " is not Exsits.");
			}
		}, function() {
			defer.reject(err);
		});

		return defer.promise;
	},

	findCore: function (coreid) {
		return client.find("core", ["core_id=?"], [coreid]);
	},

	allCore: function () {
		return client.find("core");
	},

	findCoreKey: function(coreid) {
		return client.find("core_key", ["core_id=?"], [coreid]);
	}
}

module.exports = Model;