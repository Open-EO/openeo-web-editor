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
			var type = typeof val;
			if (type === "array" || type === "object") {
				val = this.makeList(val, level ? level+1 : 1);
			}
			if (key && (!this.isNumeric(key) || level > 0 || type !== 'string')) {
				val = "<em>" + key + "</em>: " + val;
			}
			items.push("<li>" + val + "</li>");
		};
		for (var key in data) {
			callback(data[key], key);
		}
		return "<ul>" + items.join("") + "</ul>";
	},

	isNumeric(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	}

};