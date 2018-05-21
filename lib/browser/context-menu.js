function $Menu(id, options, submenuLabel) {
	var $menu = html('menu', {'type': 'context', 'id': id});
	if (submenuLabel) {
		$menu.setAttribute('label', submenuLabel);
	} else {
		$menu.setStyle({display:'none'});
	}
	var $menuitem;
	for (var o in options) {
		if (typeof options[o] === 'function') {
			$menuitem = html('menuitem', {'label': o}).whenClicked(options[o]);
		} else if (typeof options[o] === 'object') {
			$menuitem = Menu('', options[o], o);
		} else {
			$menuitem = html('menuitem', {'id': o, 'label': options[o]});
		}
		$menu.append($menuitem);
	}
	return $menu;
}

var Menu = {
	DEFAULT_TYPE: 'normal',
	DEFAULT_CONTEXTS: ['page'],
	listeners: {},
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
	addItem: function (id, options, callback) {
		options = options || {};
		var createData = {
			id: id,
			type: options.type || Menu.DEFAULT_TYPE,
			contexts: 'contexts' in options ? options.contexts : Menu.DEFAULT_CONTEXTS,
		};
		if (options.parentId) {
			createData.parentId = options.parentId;
		}
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
		return browser.menus.create(createData, logLastError);
	},
	removeItem: function (id) {
		Menu.removeListener(id);
		return browser.menus.remove(id).catch(logLastError);
	},
	clearItems: function () {
		Menu.clearListeners();
		return browser.menu.removeAll();
	},
	refresh: function () {
		return browser.menu.refresh();
	},
	update: function (id, data) {
		return browser.menu.update(id, data).catch(logLastError);
	},
	handleClick: function (info, tab) {
		var listener = Menu.listeners[info.menuItemId];
		if (listener) {
			listener.callback.call(null, info, tab);
		}
	},
	handleShow: function (info, tab) {
		// TODO: populate the menu before showing
	},
	handleHide: function (info, tab) {
		// TODO: unpopulate the menu before hiding
	}
};

// Mobile OSes do not support context menus (for obvious reasons)
if (browser.menus) {
	browser.menus.onClicked.addListener(Menu.handleClick);
	//browser.menus.onShown.addListener(Menu.handleShow);
	//browser.menus.onHidden.addListener(Menu.handleHide);
}
