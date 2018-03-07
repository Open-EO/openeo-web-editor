export default {
	error(vm, message, title = null) {
		vm.$snotify.error(message, title);
	},
	info(vm, message, title = null) {
		vm.$snotify.info(message, title);
	},
	ok(vm, message, title = null) {
		vm.$snotify.success(message, title);
	},

	downloadData: (function () {
		var a = document.createElement("a");
		document.body.appendChild(a);
		a.style = "display: none";
		return function (data, fileName, type) {
			var blob;
			if (data instanceof Blob) {
				blob = data;
			}
			else {
				if (!type) {
					type = 'application/octet-stream';
				}
				blob = new Blob([data], {type: type});
			}
			if (!fileName) {
				fileName = 'unnamed-file';
			}
			var url = window.URL.createObjectURL(blob);
			a.href = url;
			a.download = fileName;
			a.click();
			window.URL.revokeObjectURL(url);
		};
	}()),

	makeList(data, level) {
		var items = [];
		var callback = (val, key) => {
			var typeOfVal = typeof val;
			if (typeOfVal === "object") {
				if (val === null || Array.isArray(val) && val.length == 0 || Object.keys(val).length == 0) {
					val = '<em>None</em>';
				}
				else {
					val = this.makeList(val, level ? level+1 : 1);
				}
			}
			if (!this.isNumeric(key) || typeOfVal === 'object') {
				if (typeof key === 'string') {
					key = key.replace(/([a-z\d])([A-Z])/g, '$1 $2');
					key = key.replace(/([a-zA-Z\d])_([a-zA-Z\d])/g, '$1 $2');
					key = key.charAt(0).toUpperCase() + key.substr(1);
				}
				val = "<em>" + key + "</em>: " + val;
			}
			items.push("<li>" + val + "</li>");
		};
		var i = 0;
		for (var key in data) {
			i++;
			callback(data[key], key);
			if (i > 100) {
				items.push("<li><em>Following entries omitted...</em></li>");
				break;
			}
		}
		return "<ul>" + items.join("") + "</ul>";
	},

	isNumeric(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	},

	recolorImage(canvas, script) {
		if (!canvas.originalImage || !script.Visualization || !script.Visualization.function) {
			return;
		}
		
		try {
			const ctx = canvas.getContext('2d');
			const tgtData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			for (var i = 0; i < tgtData.data.length; i += 4) {
				const input = canvas.originalImage.data.slice(i, i + 4);
				const es = script.Visualization.function(input, script.Visualization.args);
				tgtData.data.set(es, i);
			}
			ctx.putImageData(tgtData, 0, 0);
		} catch(e) {
			console.log(e);
		}
	}

};