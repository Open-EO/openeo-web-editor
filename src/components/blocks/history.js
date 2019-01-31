/**
 * Handles the history
 */
var History = function(blocks)
{
    this.historySize = 30;
    this.blocks = blocks;
    this.history = [];
    this.enabled = true;
};

/**
 * Enable or disable storing (e.g. for importing)
 */
History.prototype.enable = function(enable) {
    this.enabled = enable;
}

/**
 * Save the current situation to the history
 */
History.prototype.save = function()
{
    if (!this.enabled) {
        return;
    }

    this.history.push(this.blocks.export());

    if (this.history.length > this.historySize) {
        this.history.shift();
    }
};

/**
 * Restores the last saved situation
 */
History.prototype.size = function()
{
    return this.history.length;
};

/**
 * Restores the last saved situation
 */
History.prototype.restoreLast = function()
{
    if (this.history.length) {
        var last = this.history.pop();
        this.blocks.importData(last);
    }
};

export default History;