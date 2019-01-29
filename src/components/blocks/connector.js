/**
 * A connector
 */
var Connector = function(name, type, index = null)
{
    this.index = null;

    if (typeof type === 'undefined') {
        // Create from ID
        if (typeof name === 'string') {
            var parts = name.split('_');
            this.name = parts[0];
            this.type = parts[1];
            if (parts.length == 3) {
                this.index = parts[2];
            }
        }
        // Import from JSON
        else if (Array.isArray(name) && name.length >= 2) {
            this.name = name[0];
            this.type = name[1];
            if (name.length > 2) {
                this.index = name[2];
            }
        }
        else {
            throw 'Unable to create Connector';
        }
    }
    else {
        this.name = name;
        this.type = type;
        if (index != null) {
            this.index = parseInt(index);
        }
    }
};

/**
 * Gets the connector identifier
 */
Connector.prototype.id = function()
{
    var id = this.name + '_' + this.type;

    if (this.index != null) {
        id += '_' + this.index;
    }

    return id;
};

/**
 * Is this connector an input?
 */
Connector.prototype.isInput = function()
{
    return this.type == 'input';
};

/**
 * Is this connector an output?
 */
Connector.prototype.isOutput = function()
{
    return this.type == 'output';
};

/**
 * Is this connector the same as another?
 */
Connector.prototype.same = function(other)
{
    return (this.name == other.name && 
            this.index == other.index && this.type == other.type);
};

/**
 * Export the connector
 */
Connector.prototype.export = function()
{
    var data = [this.name, this.type];

    if (this.index !== null) {
        data.push(this.index);
    }

    return data;
}

export default Connector;