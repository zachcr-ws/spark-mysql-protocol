/*
 *  Mysql model
 *  	saveCore: save core infomation
 *      saveCoreKey: save core's identify
 *      allCore: get all core
 *      findCore: get one core
 */

var client = require("./MysqlDb.js").InitMysqlClient();;

var Model = {

	saveCore: function (core) {
		if( !core.id ){
			var name = typeof core.name == "undefined" ? "" : core.name;
			var values = [0, name, core.core_id, core.registrar, core.timestamp];
			return client.save("core", values);
		} else {
			var id = core.id;
			delete core.id;
			return client.update("core", core, ["id=?"], [id]);
		}
	},

	saveCoreKey: function (corekey) {
		if( !corekey.id ){
			var values = [0, corekey.core_id, corekey.public_key];
			return client.save("core_key", values);
		} else {
			var id = corekey.id;
			delete corekey.id;
			return client.update("core_key", corekey, ["id=?"], [id]);
		}
	},

	findCore: function (coreid) {
		return client.find("core", ["core_id=?"], [coreid]);
	},

	allCore: function () {
		return client.find("core");
	}
}

module.exports = Model;