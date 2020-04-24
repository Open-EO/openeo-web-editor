export default class History {

    /**
     * Handles the history
     */
    constructor(blocks) {
        this.historySize = 30;
        this.blocks = blocks;
        this.history = [];
        this.enabled = true;
    }
    
    /**
     * Enable or disable storing (e.g. for importing)
     */
    enable(enable) {
        this.enabled = enable;
    }
    
    /**
     * Save the current situation to the history
     */
    save() {
        if (!this.enabled) {
            return;
        }
    
        this.history.push(this.blocks.export());
    
        if (this.history.length > this.historySize) {
            this.history.shift();
        }
    }
    
    /**
     * Number of steps
     */
    size() {
        return this.history.length;
    }
    
    /**
     * Restores the last saved situation
     */
    restoreLast() {
        if (this.history.length) {
            var last = this.history.pop();
            this.blocks.import(last);
        }
    }

}