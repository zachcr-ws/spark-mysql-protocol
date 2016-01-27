/*
 * Mysql client
 * Func- MysqlDriver(): set mysql configuration
 * Func- MysqlDriver().query(): excute query
 */

var mysql = require("mysql");
var when = require("when");

var MasterClient = {};
var SlaveClient = {};
var Driver = undefined;

var MysqlDriver = function(host_master, host_slave, user, password, dbname, limit) {
	MasterClient = mysql.createPool({
		host: host_master,
		user: user,
		password: password,
		database: dbname,
		connectionLimit: limit
	});

	SlaveClient = mysql.createPool({
		host: host_slave,
		user: user,
		password: password,
		database: dbname,
		connectionLimit: limit
	});
}

MysqlDriver.prototype = {
	query: function(query_string, values){
		var defer = when.defer();

		MasterClient.getConnection(function(err, con) {
			if(err) defer.reject(err);
			con.query(query_string, values, function(err, rows, feilds) {
				con.release();
				if(err) defer.reject(err);
				defer.resolve(rows);
			});
		});

		return defer.promise;
	},

	slave_query: function(query_string, values){
		var defer = when.defer();

		SlaveClient.getConnection(function(err, con){
			if(err) defer.reject(err);
			con.query(query_string, values, function(err, rows, feilds){
				con.release();
				if(err) defer.reject(err);
				defer.resolve(rows);
			});
		});

		return defer.promise;
	},

	find: function(table, where, values, orderby, limit){
		var query_string = "SELECT * FROM " + table;
		if(where && typeof where == 'object') query_string += " WHERE " + where.join(" AND ");
		if(limit) query_string += " LIMIT " + limit;
		if(orderby) query_string += " ORDER BY " + orderby;
		return this.slave_query(query_string, values)
	},

	save: function(table, values){
		var query_string = "INSERT INTO " + table;
		if(values){
			var val = [];
			for (var i = 0; i < values.length; i++){
				val.push("?");
			}
			query_string += " VALUES (" + val.join(",") + ")";
			return this.query(query_string, values);
		}
	},

	update: function(table, sets, where, values){
		var query_string = "UPDATE " + table + " SET ",
			updatesKey = [],
			updatesVal = [];
		if ( sets ){
			for(var k in sets){
				updatesKey.push(k + "=?");
				updatesVal.push(sets[k]);
			}
			updatesKey.join(", ");
			query_string += updatesKey;
		}
		if(where && typeof where == 'object') query_string += " WHERE " + where.join(" AND ");
		return this.query(query_string, updatesVal.concat(values));
	},

	delete: function(table, where, values){
		var query_string = "DELETE FROM " + table;
		if(where && typeof where == 'object') {
			query_string += " WHERE " + where.join(" AND ");
		}
		return this.query(query_string, values);
	}
};

module.exports.InitMysqlClient = function(host_master, host_slave, user, password, database, limit){
	if(Driver == undefined) {
		Driver = new MysqlDriver(
			host_master,
			host_slave,
			user,
			password,
			database,
			limit
		);
	}
	return Driver;
};