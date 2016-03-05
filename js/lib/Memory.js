/*
	function: Save data in memory
*/

var Memory = {
	_allCoresByID = null,
	_attribsByID = null,
	_allIDs = null,

	setAttribute: function(id, key, val) {
		this._attribsByID[id] = this._attribsByID[id] || {};
        this._attribsByID[id][key] = value;
        if ( !this._attribsByID[id].coreID ) {
            this._attribsByID[id]["coreID"] = id;
        }
	},

	setAttributes: function(id, objects) {
        this._attribsByID[id] = this._attribsByID[id] || {};
        for(var key in objects) {
            this._attribsByID[id][key] = objects[key];
        }
        if ( !this._attribsByID[id].coreID ) {
            this._attribsByID[id]["coreID"] = id;
        }
	}
}

module.exports = Model;