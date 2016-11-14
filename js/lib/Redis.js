var redis = require("redis");

var RedisDriver = function(domain, port) {
    this.domain = domain;
    this.port = port;
}

RedisDriver.prototype = {

    client: function() {
        return redis.createClient(this.port, this.domain);
    },

    hset: function(key, tp, value) {
        var client = this.client();
        client.on("connect", function() {
            client.hset(key, tp, value, function(err) {
                if (err) {
                    console.error("[Redis Set Erorr]: ", err);
                }
            })
        });
    }
}

module.exports = function(domain, port) {
    return new RedisDriver(
        domain, port
    )
};
