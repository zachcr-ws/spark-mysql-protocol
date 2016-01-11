/*
 * Mysql client
 * Func- MysqlDriver(): set mysql configuration
 * Func- MysqlDriver().query(): excute query
 */

var mysql = require("mysql");
var when = require("when");

var MasterClient = {};
var SlaveClient = {};

var MysqlDriver = function(host_master, host_slave, user, password, dbname, limit) {
	MasterClient = mysql.createConnection({
		host: host_master,
		user: user,
		password: password,
		database: dbname
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

		MasterClient.query(query_string, values, function(err, rows, fields){
			if(err) defer.reject(err);
			defer.resolve(rows, fields);
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

	save: function(table, keys, values){
		var query_string = "INSERT INTO " + table;
		if(keys && values){
			query_string += " (" + keys.join(",") + ")";
			var val = [];
			for (var i = 0; i < keys.length; i++){
				val.push("?");
			}
			query_string += " VALUES (" + val.join(",") + ")";
			return this.query(query_string, values);
		}
	},

	delete: function(table, where, values){
		var query_string = "DELETE FROM " + table;
		if(where && typeof where == 'object') {
			query_string += " WHERE " + where.join(" AND ");
		}
		return this.query(query_string, values);
	}
};

module.exports = MysqlDriver;