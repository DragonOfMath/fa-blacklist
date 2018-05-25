function logLastError() {
	if (browser && browser.runtime.lastError) {
		console.error('Internal error:',browser.runtime.lastError);
	} else if (chrome && chrome.runtime.lastError) {
		console.error('Internal error:',chrome.runtime.lastError);
	}
}

function promisify(fn) {
	var _args = Array.prototype.slice(arguments, 1);
	return function () {
		var args = Array.prototype.slice(arguments, 0);
		return new Promise(function (resolve, reject) {
			function callback(response) {
				logLastError();
				resolve(response);
			}
			fn.apply(null, args.concat(_args, [callback]));
		});
	};
}

/* All web browsers except Chrome support the browser entry point for web extensions.
 * browser differs from chrome in that it supports Promises whereas chrome uses callbacks.
 * A polyfill is necessary to allow Promise chains for chrome webextension APIs.
 */
var UA = window.navigator.userAgent;
if (!browser && UA.match(/Chrome/)) {
	console.log('Defining browser for',UA);
	var browser = {
		runtime: {
			// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/sendMessage
			// https://developer.chrome.com/extensions/runtime#method-sendMessage
			sendMessage: promisify(chrome.runtime.sendMessage, {})
		},
		extension: {
			sendMessage: promisify(chrome.extension.sendMessage, {})
		},
		tabs: {
			// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/sendMessage
			sendMessage: promisify(chrome.tabs.sendMessage, {}),
			query:       promisify(chrome.tabs.query),
			create:      promisify(chrome.tabs.create)
		},
		storage: {
			local: {
				get:    promisify(chrome.storage.local.get),
				set:    promisify(chrome.storage.local.set),
				remove: promisify(chrome.storage.local.remove),
				clear:  promisify(chrome.storage.local.clear)
			}
		},
		i18n:          chrome.i18n,
		menus:         chrome.contextMenus,
		contextMenus:  chrome.contextMenus,
		notifications: chrome.notifications
	};
	for (var key in chrome.runtime) {
		if (key in window.browser.runtime) continue;
		browser.runtime[key] = chrome.runtime[key];
	}
	for (var key in chrome.extension) {
		if (key in window.browser.extension) continue;
		browser.extension[key] = chrome.extension[key];
	}
	for (var key in chrome.tabs) {
		if (key in window.browser.tabs) continue;
		browser.tabs[key] = chrome.tabs[key];
	}
} else {
	//console.log('browser is defined');
}
