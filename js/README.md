## Usage

#### Init mysqldb ( Singleton pattern ):

db architecture: db.sql

```
var MysqlClient = require("spark-mysql-protocol/lib/MysqlDb.js")
MysqlClient.InitMysqlClient(
	settings.db.host_master,
	settings.db.host_slave,
	settings.db.user,
	settings.db.password,
	settings.db.database,
	settings.db.poolCap
);
```

* host_master: mysql's master ip addr
* host_slave: mysql's slave ip addr
* user
* password
* database
* poolCap: connection pool's limit

#### Use

all functions return a promise.

```
var client = require("spark-mysql-protocol/lib/MysqlDb.js").InitMysqlClient();
client.find(table, where, values, orderby, limit).then(...);
client.save(table, values).then(...);
client.delete(table, where, values).then(...);
client.update(table, sets, where, values).then(...);
client.query(query_string, values).then(...);
client.slave_query(query_string, values).then(...);    // slave node read action.
```

* table: String --- table's name
* where: [] --- where's array --- exp: ["id=?", "username=?"]
* values: [] --- for find function: where's values, for save function: insert values
* orderby: [] --- orderby array
* limit: String --- limit
* sets: object --- exp: {"username" : "ZachBergh"}
* query_string --- original query_string, params use '?': "select * from user where id=?"

### Claim Code

Send by soft-AP protocal, and saved in core_key.