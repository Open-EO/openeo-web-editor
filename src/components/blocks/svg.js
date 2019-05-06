export default class SVG {

	constructor(selector, width = null, height = null) {
		this.svgNS = 'http://www.w3.org/2000/svg';

		if (typeof selector === 'string') {
			this.element = document.querySelector(selector);
		}
		else {
			this.element = selector;
		}

		if (width !== null) {
			this.element.style.width = width;
		}
		if (height !== null) {
			this.element.style.height = height;
		}
	}

    /**
	 * Delete everything in the current document.
	 * @param [attrsToo=false] {boolean} <code>true</code> to clear any root attributes as well, <code>false</code> to leave them.
	 * @return {SVGWrapper} This wrapper.
	 */
	clear() {
		while (this.element.firstChild) {
			this.element.removeChild(this.element.firstChild);
		}
		return this;
	}

	/**
	 * Draw a line.
	 * 
	 * Code based on SVG.js, see https://svgjs.com.
	 * 
	 * @param x1 {number} The x-coordinate for the start of the line.
	 * @param y1 {number} The y-coordinate for the start of the line.
	 * @param x2 {number} The x-coordinate for the end of the line.
 	 * @param y2 {number} The y-coordinate for the end of the line.
	 * @param [settings] {object} Additional settings for this node.
	 * @return {SVGElement} The new line node.
	 */
	line(x1, y1, x2, y2, settings = {}) {
		return this._makeNode('line', Object.assign({x1: x1, y1: y1, x2: x2, y2: y2}, settings));
	}

	/** Create a SVG node with the given settings.
	 * 
	 * Code based on SVG.js, see https://svgjs.com.
	 * 
	 * @private
	 * @param name {string} The name of the element.
	 * @param [settings] {object} Additional settings for this node.
	 * @return {SVGElement} The new node.
	 */
	_makeNode(name, settings) {
		var node = this.element.ownerDocument.createElementNS(this.svgNS, name);
		for (var name in settings) {
			var value = settings[name];
			if (value != null && (typeof value !== 'string' || value !== '')) {
				node.setAttribute(name, value);
			}
		}
		this.element.appendChild(node);
		return node;
	}

}