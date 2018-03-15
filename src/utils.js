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
	},

	isChildOfModal(that) {
		return that.$parent && that.$parent.$options.name == 'Modal';
	}
};