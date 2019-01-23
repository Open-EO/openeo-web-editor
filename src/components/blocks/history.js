/**
 * Handles the history
 */
var History = function(blocks)
{
    this.historySize = 30;
    this.blocks = blocks;
    this.history = [];
};

/**
 * Save the current situation to the history
 */
History.prototype.save = function()
{
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