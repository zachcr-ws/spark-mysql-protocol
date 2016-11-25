var redis = require("redis");

var RedisClient = undefined;

var RedisDriver = function(domain, port, key) {
    this.domain = domain;
    this.port = port;
    this.key = key;
}

RedisDriver.prototype = {

    client: function() {
        return redis.createClient(this.port, this.domain);
    },

    hset: function(tp, value) {
        var client = this.client(),
            key = this.key;
        client.on("connect", function() {
            client.hset(key, tp, value, function(err) {
                if (err) {
                    console.error("[Redis Set Erorr]: ", err);
                }

                client.end();
            })
        });
    }
}

module.exports.InitRedisClient = function(domain, port, key) {
    if (RedisClient == undefined) {
        RedisClient = new RedisDriver(domain, port, key);
    }
    return RedisClient;
};
