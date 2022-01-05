import {Control} from 'ol/control';

export default class TextControl extends Control {
	constructor(opt_options) {
	  const options = opt_options || {};
  
	  const element = document.createElement('div');
	  element.className = 'value ol-unselectable ol-control';
  
	  super({
		element: element,
		target: options.target,
	  });
	}
  
	setValue(value) {
		this.element.innerHTML = value;
	}
  
	setTitle(value) {
		this.element.title = value;
	}
  }