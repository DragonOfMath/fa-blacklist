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

function promisifyMethods(src, keys) {
	if (typeof(src) !== 'undefined') {
		keys.forEach(function (key) {
			src[key] = key in src ? promisify(src[key]) : emptyPromise;
		});
	}
	return src;
}

function emptyPromise() {
	return Promise.resolve(void 0);
}

/* All web browsers except Chrome support the browser entry point for web extensions.
 * browser differs from chrome in that it supports Promises whereas chrome uses callbacks.
 * A polyfill is necessary to allow Promise chains for chrome webextension APIs.
 */
var UA = window.navigator.userAgent;
if (!browser && UA.match(/Chrome/)) {
	console.log('Defining browser for',UA);
	var browser = chrome;
	// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/sendMessage
	// https://developer.chrome.com/extensions/runtime#method-sendMessage
	promisifyMethods(browser.runtime, ['sendMessage']);
	promisifyMethods(browser.storage.local, ['get','set','remove','clear']);
	promisifyMethods(browser.extension, ['sendMessage']);
	// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/sendMessage
	promisifyMethods(browser.tabs, ['sendMessage','query','create']);
	promisifyMethods(browser.contextMenus, ['create','update','remove','removeAll']);
} else if (browser) {
	// Firefox's menus.create() method does not return a Promise unlike the other methods
	if ('contextMenus' in browser) {
		promisifyMethods(browser.contextMenus, ['create']);
	}
}
