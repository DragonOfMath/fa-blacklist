function logLastError(err) {
	if (browser && browser.runtime.lastError) {
		console.error('Internal error:',browser.runtime.lastError);
	} else if (chrome && chrome.runtime.lastError) {
		console.error('Internal error:',chrome.runtime.lastError);
	} else if (err) {
		console.error(err);
	}
}

function promisify(fn) {
	return function () {
		var args = $A(arguments);
		return new Promise(function (resolve, reject) {
			try {
				fn.apply(null, args.concat([resolve]));
			} catch (e) {
				reject(e);
			}
		}).catch(logLastError);
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
			sendMessage: promisify(chrome.runtime.sendMessage)
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
	if ('extension' in chrome) {
		browser.extension = {
			sendMessage: promisify(chrome.extension.sendMessage)
		};
		for (var key in chrome.extension) {
			if (key in window.browser.extension) continue;
			browser.extension[key] = chrome.extension[key];
		}
	}
	if ('tabs' in chrome) {
		browser.tabs = {
			// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/sendMessage
			sendMessage: promisify(chrome.tabs.sendMessage),
			query:       promisify(chrome.tabs.query),
			create:      promisify(chrome.tabs.create)
		};
		for (var key in chrome.tabs) {
			if (key in window.browser.tabs) continue;
			browser.tabs[key] = chrome.tabs[key];
		}
	}
} else {
	//console.log('browser is defined');
}
