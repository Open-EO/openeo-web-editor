import DataInput from './data/input';

export const isDesktop = typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__);

// Links to other sites open in the system browser instead of new app windows.
// OIDC login uses window.open and is not affected, as the popup must stay in the app.
export function installDesktopHandlers() {
	if (!isDesktop) {
		return;
	}
	installTokenRequestProxy();
	document.addEventListener('click', async event => {
		const a = event.target instanceof Element ? event.target.closest('a[href]') : null;
		if (!a || a.hasAttribute('download') || event.defaultPrevented) {
			return;
		}
		let url;
		try {
			url = new URL(a.href, window.location.href);
		} catch (e) {
			return;
		}
		if (!['http:', 'https:', 'mailto:'].includes(url.protocol) || url.origin === window.location.origin) {
			return;
		}
		event.preventDefault();
		const { openUrl } = await import('@tauri-apps/plugin-opener');
		await openUrl(url.toString());
	});
}

// Identity providers (e.g. CDSE) allow http://localhost:1410/ as redirect URL for native clients,
// but reject token and userinfo requests from that browser origin. So these OAuth requests (oidc-client uses XHR)
// are sent by the Rust side without an Origin header, like the Python and R clients do.
function isOAuthRequest({ method, url }, body) {
	if (method === 'POST' && typeof body === 'string' && /(^|&)grant_type=/.test(body)) {
		return true;
	}
	try {
		return /\/(userinfo|revoke|introspect)\/?$/.test(new URL(url).pathname);
	} catch (e) {
		return false;
	}
}

function installTokenRequestProxy() {
	const NativeXhr = window.XMLHttpRequest;
	class TokenProxyXhr extends NativeXhr {
		open(method, url, ...rest) {
			this._proxy = { method: String(method).toUpperCase(), url: String(url), headers: {} };
			return super.open(method, url, ...rest);
		}
		setRequestHeader(name, value) {
			if (this._proxy) {
				this._proxy.headers[name] = value;
			}
			return super.setRequestHeader(name, value);
		}
		send(body) {
			const p = this._proxy;
			if (!p || !isOAuthRequest(p, body)) {
				return super.send(body);
			}
			this._sendViaTauri(p, body);
		}
		async _sendViaTauri(p, body) {
			const define = (name, value) => Object.defineProperty(this, name, { value, configurable: true });
			try {
				const { fetch } = await import('@tauri-apps/plugin-http');
				// An empty Origin makes the HTTP plugin omit the header
				const response = await fetch(p.url, { method: p.method, headers: { ...p.headers, Origin: '' }, body: body || undefined });
				const text = await response.text();
				define('readyState', 4);
				define('status', response.status);
				define('statusText', response.statusText);
				define('responseText', text);
				define('response', text);
				define('getResponseHeader', name => response.headers.get(name));
				if (this.onload) {
					this.onload(new ProgressEvent('load'));
				}
			} catch (error) {
				console.error(error);
				if (this.onerror) {
					this.onerror(new ProgressEvent('error'));
				}
			}
		}
	}
	window.XMLHttpRequest = TokenProxyXhr;
}

function browserDownload(href, filename) {
	const a = document.createElement('a');
	a.style.display = 'none';
	a.href = href;
	a.setAttribute('download', filename);
	a.setAttribute('target', '_blank');
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

// Saves a Blob, asking for the location in the desktop app. Returns false if the user cancelled.
export async function saveFile(blob, filename) {
	if (!isDesktop) {
		const url = URL.createObjectURL(blob);
		browserDownload(url, filename);
		setTimeout(() => URL.revokeObjectURL(url), 60000);
		return true;
	}
	const { save } = await import('@tauri-apps/plugin-dialog');
	const { writeFile } = await import('@tauri-apps/plugin-fs');
	const path = await save({ defaultPath: filename });
	if (!path) {
		return false;
	}
	await writeFile(path, new Uint8Array(await blob.arrayBuffer()));
	return true;
}

export async function saveUrl(url, filename, fetcher = null) {
	if (!isDesktop) {
		browserDownload(url, filename);
		return true;
	}
	const blob = fetcher ? await fetcher(url) : await (await fetch(url)).blob();
	return await saveFile(blob, filename);
}

// Opens a file chooser and resolves to a list of DataInputs (empty if cancelled)
export function chooseFiles({ multiple = true, accept = null } = {}) {
	return new Promise(resolve => {
		const input = document.createElement('input');
		input.type = 'file';
		input.multiple = multiple;
		if (accept) {
			input.accept = accept;
		}
		input.style.display = 'none';
		input.addEventListener('change', () => {
			resolve(Array.from(input.files || []).map(file => new DataInput({ blob: file })));
			document.body.removeChild(input);
		});
		input.addEventListener('cancel', () => {
			resolve([]);
			document.body.removeChild(input);
		});
		document.body.appendChild(input);
		input.click();
	});
}

// Directories (e.g. Zarr stores) via the directory picker
export function chooseDirectory() {
	return new Promise(resolve => {
		const input = document.createElement('input');
		input.type = 'file';
		input.webkitdirectory = true;
		input.style.display = 'none';
		input.addEventListener('change', () => {
			const files = Array.from(input.files || []);
			document.body.removeChild(input);
			if (files.length === 0) {
				return resolve([]);
			}
			const root = files[0].webkitRelativePath.split('/')[0];
			const map = new Map(files.map(f => [f.webkitRelativePath.slice(root.length + 1), f]));
			resolve([new DataInput({ name: root, files: map })]);
		});
		input.addEventListener('cancel', () => {
			resolve([]);
			document.body.removeChild(input);
		});
		document.body.appendChild(input);
		input.click();
	});
}

function readEntries(reader) {
	return new Promise((resolve, reject) => reader.readEntries(resolve, reject));
}

async function collectDirectory(entry, prefix, map) {
	const reader = entry.createReader();
	let batch;
	while ((batch = await readEntries(reader)).length > 0) {
		for (const child of batch) {
			const path = prefix ? `${prefix}/${child.name}` : child.name;
			if (child.isDirectory) {
				await collectDirectory(child, path, map);
			}
			else {
				map.set(path, await new Promise((resolve, reject) => child.file(resolve, reject)));
			}
		}
	}
	return map;
}

// Files and directories dropped from the operating system
export async function inputsFromDrop(dataTransfer) {
	if (!dataTransfer) {
		return [];
	}
	const items = Array.from(dataTransfer.items || []).filter(i => i.kind === 'file');
	if (items.length === 0) {
		return Array.from(dataTransfer.files || []).map(file => new DataInput({ blob: file }));
	}
	// Entries must be retrieved synchronously before the first await
	const entries = items.map(i => ({ entry: i.webkitGetAsEntry ? i.webkitGetAsEntry() : null, file: i.getAsFile() }));
	const inputs = [];
	for (const { entry, file } of entries) {
		if (entry && entry.isDirectory) {
			inputs.push(new DataInput({ name: entry.name, files: await collectDirectory(entry, '', new Map()) }));
		}
		else if (file) {
			inputs.push(new DataInput({ blob: file }));
		}
	}
	return inputs;
}
