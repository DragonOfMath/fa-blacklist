function $Menu(id, options, submenuLabel) {
	var $menu = html('menu', {type: 'context', id: id});
	if (submenuLabel) {
		$menu.setAttribute('label', submenuLabel);
	} else {
		$menu.setStyle({display:'none'});
	}
	var $menuitem;
	for (var o in options) {
		if (typeof options[o] === 'function') {
			$menuitem = html('menuitem', {label: o}).whenClicked(options[o]);
		} else if (typeof options[o] === 'object') {
			$menuitem = Menu('', options[o], o);
		} else {
			$menuitem = html('menuitem', {id: o, label: options[o]});
		}
		$menu.append($menuitem);
	}
	return $menu;
}

var Menu = {
	DEFAULT_TYPE: 'normal',
	DEFAULT_CONTEXTS: ['all'],
	items: {},
	listeners: {},
	isSupported: ('contextMenus' in browser) || ('menus' in browser),
	hasListener: function (id) {
		return id in Menu.listeners;
	},
	addListener: function (id, callback) {
		Menu.listeners[id] = callback;
	},
	removeListener: function (id) {
		delete Menu.listeners[id];
	},
	clearListeners: function () {
		for (var id in Menu.listeners) {
			Menu.removeListener(id);
		}
	},
	setItems: function (menuItems, parentId) {
		for (var id in menuItems) {
			var item = menuItems[id];
			if (parentId) {
				item.options = item.options || {};
				item.options.parentId = parentId;
			}
			Menu.addItem(id, item.options, item.callback);
			if (item.submenu) {
				Menu.setItems(item.submenu, id);
			}
		}
	},
	addItem: function (id, options, callback) {
		Menu.items[id] = {}; // pointers to other items
		options = options || {};
		var createData = {
			id: id,
			type: options.type || Menu.DEFAULT_TYPE,
			contexts: options.contexts || Menu.DEFAULT_CONTEXTS
		};
		switch (createData.type) {
			case 'separator':
				break;
			case 'checkbox':
			case 'radio':
				createData.checked = !!options.checked;
			case 'normal':
			default:
				createData.title = options.title || id;
				if (typeof callback === 'function') Menu.addListener(id, callback);
				break;
		}
		if (options.parentId) {
			createData.parentId = options.parentId;
			Menu.items[options.parentId][id] = Menu.items[id];
		}
		return browser.contextMenus.create(createData).catch(logLastError);
	},
	removeItem: function (id) {
		if (!(id && id in Menu.items)) return Promise.resolve(null);
		for (var subId in Menu.items[id]) {
			Menu.removeItem(subId);
		}
		delete Menu.items[id];
		Menu.removeListener(id);
		return browser.contextMenus.remove(id).catch(logLastError);
	},
	clearItems: function (parentId) {
		var menu = parentId ? Menu.items[parentId] : Menu.items;
		for (var id in menu) {
			Menu.removeItem(id);
		}
	},
	refresh: function () {
		return browser.contextMenus.refresh();
	},
	update: function (id, data) {
		return browser.contextMenus.update(id, data).catch(logLastError);
	},
	handleClick: function (info, tab) {
		var listener = Menu.listeners[info.menuItemId];
		if (listener) {
			listener.call(null, info, tab);
		}
	},
	handleShow: function (info, tab) {
		// TODO: populate the menu before showing
	},
	handleHide: function (info, tab) {
		// TODO: unpopulate the menu before hiding
	}
};

//console.log('Is contextMenus supported:',Menu.isSupported);

// Mobile OSes do not support context menus (for obvious reasons)
if (Menu.isSupported) {
	browser.contextMenus.onClicked.addListener(Menu.handleClick);
	//browser.contextMenus.onShown.addListener(Menu.handleShow);
	//browser.contextMenus.onHidden.addListener(Menu.handleHide);
}
