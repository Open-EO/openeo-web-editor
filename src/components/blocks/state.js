import Vue from 'vue';

export default {
	state: Vue.observable({
		readOnly: /*true*/false,
		compactMode: false,
		center: [0,0],
		mouse: [0,0],
		scale: 1.3,
		resultNode: null, // Block
		linkFrom: null, // Array
		linkTo: null, // Array
		supportedEvents: [] // Array
	}),
	enableCompactMode(enable = true) {
		this.state.compactMode = !!enable;
	},
	setScale(scale) {
		this.state.scale = scale;
	},
	setCenter(x, y) {
		this.state.center = [x, y];
	},
	multiplyScale(deltaScale) {
		this.setScale(this.state.scale * deltaScale);
	},
	link(parameter) {
		if (this.state.linkFrom) {
			this.state.linkTo = parameter;
		}
		else {
			this.state.linkFrom = parameter;
		}
	},
	unlink(parameter = null) {
		if (parameter) {
			if (this.state.linkTo == parameter) {
				this.state.linkTo = null;
			}
			else if (this.state.linkFrom == parameter) {
				this.state.linkFrom = null;
			}
		}
		else {
			this.state.linkTo = null;
			this.state.linkFrom = null;
		}
	},
	setReadOnly(readOnly = true) {
		this.state.readOnly = readOnly;
	},
	setSupportedEvents(events) {
		this.state.supportedEvents = events.map(e => 'blocks.' + e);
	},
	supports(event) {
		return this.state.supportedEvents.includes('blocks.' + event);
	},
	setMousePos(x, y) {
		this.state.mouse = [x, y];
	}
};