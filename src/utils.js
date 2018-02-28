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
			const isJavaScript = (typeof data === 'object');
			if (!type) {
				type = 'application/octet-stream';
			}
			if (!fileName) {
				fileName = 'unnamed-file';
			}
			var blob = new Blob([data], {type: "text/javascript"});
			var url = window.URL.createObjectURL(blob);
			a.href = url;
			a.download = fileName;
			a.click();
			window.URL.revokeObjectURL(url);
		};
	}())
};