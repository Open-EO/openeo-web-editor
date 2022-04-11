import { Control } from 'ol/control.js';

export default class Progress {

	constructor() {
		this.createHtml();
		this.loading = 0;
		this.loaded = 0;
	}

	addLoading() {
		this.loading++;
		this.update();
	};

	addLoaded() {
		this.loaded++;
		this.update();
	}

	update() {
		var percent = (this.loaded / this.loading * 100).toFixed(1) + '%';
	
		this.label.innerText = "Loading Tiles (" + percent + ")";
		this.progressBarInner.style.width = percent;

		if (this.loading === this.loaded) {
			this.loading = 0;
			this.loaded = 0;
		}

		this.el.style.opacity = this.show() ? 1 : 0;
	}

	show() {
		return (this.loading > 0 && this.loaded <= this.loading);
	}

	createHtml() {
		this.el = document.createElement('div');
		this.el.className = 'ol-unselectable ol-progress-control';
		this.progressBar = document.createElement('div');
		this.progressBar.className = 'progress-bar';
		this.progressBarInner = document.createElement('div');
		this.progressBarInner.className = 'progress-bar-inner';
		this.progressBar.appendChild(this.progressBarInner);
		this.label = document.createElement('div');
		this.label.className = 'progress-label';
		this.el.appendChild(this.progressBar);
		this.el.appendChild(this.label);
	}
	
	getControl() {
		return new Control({
			element: this.el
		});
	}

}