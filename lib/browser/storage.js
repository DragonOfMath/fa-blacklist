if (!browser) {
	throw 'browser polyfill is missing.';
}

var Storage = {
	area: 'local',
	get: function (key) {
		if (browser) {
			return browser.storage[Storage.area].get(key);
		} else {
			return Promise.resolve(window.localStorage.getItem(key));
		}
	},
	set: function (key, value) {
		var obj = {};
		obj[key] = value;
		if (browser) {
			return browser.storage[Storage.area].set(obj);
		} else {
			return Promise.resolve(window.localStorage.setItem(key, value));
		}
	},
	remove: function (key) {
		if (browser) {
			return browser.storage[Storage.area].remove(key);
		} else {
			return Promise.resolve(window.localStorage.removeItem(key));
		}
	},
	clear: function () {
		if (browser) {
			return browser.storage[Storage.area].clear();
		} else {
			return Promise.resolve(window.localStorage.clear());
		}
	}
};
