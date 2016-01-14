## Usage

#### Init mysqldb ( Singleton pattern ):

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
client.find().then(...);
client.save().then(...);
client.delete().then(...);
client.update().then(...);
client.query().then(...);
client.slave_query().then(...);    // slave node read action.
```