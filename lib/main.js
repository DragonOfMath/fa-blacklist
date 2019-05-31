Menu.setItems({
	'target-menu': {
		options: {
			title: 'Page Target'
		}
	},
	'filter-menu': {
		options: {
			title: 'Filters'
		}
	}
});

var Options = {};

var Background = {
	TITLE: i18n.get('extensionName'),
	ICON: '../static/fabl-32.png',
	EDITOR:  browser.runtime.getURL('editor.html'),
	OPTIONS: browser.runtime.getURL('options.html'),
	TEST: 0,
	STORAGE_DATA: 'appData',
	DEFAULT_OPTIONS: {
		'enabled': true,
		'alwaysScan': false,
		'autoSort': false,
		'firstItem': false,
		'notifications': true
	},
	
	getAppData: function () {
		return {filters: Filters, options: Options};
	},
	apply: function (data, reply) {
		reply(Background.getAppData());
	},
	
	updateContextMenu: function (data, reply) {
		Background.updatePageContextMenu(data, reply);
		Background.updateFilterContextMenu();
	},
	updatePageContextMenu: function (target, reply) {
		if (!Menu.isSupported) return;
		Menu.clearItems('target-menu');
		if (!target) return;
		var menu = {
			'add-target': {
				options: {
					parentId: 'target-menu',
					title: 'Add "' + target.id + '" to...'
				}
			},
			'remove-target': {
				options: {
					parentId: 'target-menu',
					title: 'Remove "' + target.id + '" from...'
				}
			},
			'remove-all': {
				options: {
					parentId: 'remove-target',
					title: 'All filters'
				},
				callback: reply.curry({action: 'remove-target-from-filters', args: [target, target.tags]})
			},
			'inspect-target': {
				options: {
					parentId: 'target-menu',
					title: 'Inspect "' + target.id + '"'
				},
				callback: reply.curry({action: 'inspect-object', args: [target]})
			}
		};
		for (var ID in Filters) {
			var filter = Filters[ID];
			if (target.tags.includes(ID)) {
				menu['remove-'+ID] = {
					options: {
						parentId: 'remove-target',
						title: filter.name
					},
					callback: reply.curry({action: 'remove-target-from-filter', args: [target, ID]})
				};
			} else {
				menu['add-'+ID] = {
					options: {
						parentId: 'add-target',
						title: filter.name
					},
					callback: reply.curry({action: 'add-target-to-filter', args: [target, ID]})
				};
			}
		}
		Menu.setItems(menu);
	},
	updateFilterContextMenu: function () {
		if (!Menu.isSupported) return;
		Menu.clearItems('filter-menu');
		var menu = {};
		for (var ID in Filters) {
			var filter = Filters[ID];
			menu[ID] = {
				options: {
					parentId: 'filter-menu',
					title: filter.name
				},
				callback: Background.openEditor.curry(ID)
			};
		}
		Menu.setItems(menu);
	},
	
	updateFilters: function (filterChanges, reply) {
		var change = false, users = [], submissions = [];
		for (var ID in filterChanges) {
			var _filter = filterChanges[ID];
			var filter = Filters[ID];
			change |= _filter.users.length > 0 || _filter.submissions.length > 0;
			filter.addUsers(_filter.users);
			filter.addSubmissions(_filter.submissions);
			users = users.concat(_filter.users);
			submissions = submissions.concat(_filter.submissions);
		}
		if (change) {
			// sort the users and submissions arrays of the updated filters
			if (Options.autoSort) {
				for (var ID in filterChanges) {
					var filter = Filters[ID];
					filter.users = filter.users.sort();
					filter.submissions = filter.submissions.sort();
				}
			}
			
			// save changes
			Background.save();
			
			// notify the user of the changes
			if (Options.notifications) {
				Notify(
					Background.TITLE + ' - ' + i18n.get('mainScanResults'),
					(users.length ? ('Users (' + users.length + '):\n' + users.join(', ') + '\n\n') : '') + 
					(submissions.length ? ('Submissions (' + submissions.length + '):\n' + submissions.join(', ')) : ''),
					Background.ICON
				);
			}
		}
	},
	getFilters: function (data, reply) {
		reply(Filters);
	},
	setFilters: function (filters, reply) {
		for (var ID in filters) {
			Filters[ID] = new Filter(filters[ID]);
		}
		Background.updateFilterContextMenu();
		Background.save();
	},
	resetFilters: function (data, reply) {
		for (var id in Filters) {
			delete Filters[id];
		}
		Background.updateFilterContextMenu();
		if (reply) reply();
	},
	getFilter: function (ID, reply) {
		reply(Filters[ID]);
	},
	setFilter: function (filter, reply) {
		console.log('Setting Filter',filter.id);
		Filters[filter.id] = new Filter(filter);
		Background.updateFilterContextMenu();
		Background.save();
	},
	addToFilter: function (data, reply) {
		if (data.filter in Filters) {
			var filter = Filters[data.filter];
			switch (data.type) {
				case 'user':
					console.log('Added User',data.target,'to Filter',data.filter);
					filter.addUser(data.target);
					break;
				case 'submission':
					console.log('Added Submission',data.target,'to Filter',data.filter);
					filter.addSubmission(data.target);
					break;
			}
			Background.save();
		} else {
			error('Invalid Filter ID:',data.filter);
		}
	},
	removeFromFilter: function (data, reply) {
		if (data.filter in Filters) {
			var filter = Filters[data.filter];
			switch (data.type) {
				case 'user':
					console.log('Removed User',data.target,'from Filter',data.filter);
					filter.removeUser(data.target);
					break;
				case 'submission':
					console.log('Removed Submission',data.target,'from Filter',data.filter);
					filter.removeSubmission(data.target);
					break;
			}
			Background.save();
		} else {
			error('Invalid Filter ID:',data.filter);
		}
	},
	addToFilters: function (data, reply) {
		data.filters.forEach(function (ID) {
			try {
				var filter = Filters[ID];
				switch (data.type) {
					case 'user':
						console.log('Added User',data.target,'to Filter',ID);
						filter.addUser(data.target);
						break;
					case 'submission':
						console.log('Added Submission',data.target,'to Filter',ID);
						filter.addSubmission(data.target);
						break;
				}
			} catch (e) {
				error('Invalid Filter ID:',ID);
			}
		});
		Background.save();
	},
	removeFromFilters: function (data, reply) {
		data.filters.forEach(function (ID) {
			try {
				var filter = Filters[ID];
				switch (data.type) {
					case 'user':
						console.log('Removed User',data.target,'from Filter',ID);
						filter.removeUser(data.target);
						break;
					case 'submission':
						console.log('Removed Submission',data.target,'from Filter',ID);
						filter.removeSubmission(data.target);
						break;
				}
			} catch (e) {
				error('Invalid Filter ID:',ID);
			}
		});
		Background.save();
	},
	addAllToFilter: function (data, reply) {
		if (data.filter in Filters) {
			var filter = Filters[data.filter];
			switch (data.type) {
				case 'user':
					console.log('Added Users',data.targets.join(', '),'to Filter',data.filter);
					filter.addUsers(data.targets);
					break;
				case 'submission':
					console.log('Added Submissions',data.targets.join(', '),'to Filter',data.filter);
					filter.addSubmissions(data.targets);
					break;
			}
			Background.save();
		} else {
			error('Invalid Filter ID:',data.filter);
		}
	},
	removeAllFromFilter: function (data, reply) {
		if (data.filter in Filters) {
			var filter = Filters[data.filter];
			switch (data.type) {
				case 'user':
					console.log('Removed Users',data.targets.join(', '),'from Filter',data.filter);
					filter.removeUsers(data.targets);
					break;
				case 'submission':
					console.log('Removed Submissions',data.targets.join(', '),'from Filter',data.filter);
					filter.removeSubmissions(data.targets);
					break;
			}
			Background.save();
		} else {
			error('Invalid Filter ID:',data.filter);
		}
	},
	toggle: function (ID, reply) {
		if (ID in Filters) {
			var filter = Filters[ID];
			console.log('Toggling Filter',filter.id);
			filter.options.enabled = !filter.options.enabled;
			Background.save();
			if (reply) reply(null);
		} else {
			error('Invalid Filter ID:',ID);
		}
	},
	delete: function (ID, reply) {
		if (ID in Filters) {
			var filter = Filters[ID];
			console.log('Deleting Filter',filter.id);
			delete Filters[ID];
			Background.save();
			reply(null);
		} else {
			error('Invalid Filter ID:',ID);
		}
	},
	
	getOptions: function (data, reply) {
		try {
			reply(Options);
		} catch (e) {
			error(e);
		}
	},
	setOptions: function (options, reply) {
		try {
			for (var k in options) {
				Options[k] = options[k];
			}
			if (reply) {
				Background.save();
				reply(Options);
			}
		} catch (e) {
			if (reply) reply(e);
			else error(e);
		}
	},
	resetOptions: function (data, reply) {
		Background.setOptions(Background.DEFAULT_OPTIONS, reply);
	},
	
	toggleApp: function (data, reply) {
		Options.enabled = !Options.enabled;
		Background.save();
		if (reply) reply(Options.enabled);
	},
	resetApp: function (data, reply) {
		Background.resetFilters();
		Background.resetOptions();
		Background.save();
	},
	init: function () {
		if (Background.TEST) {
			Background.setFilters({
				'test': {
					'name': 'Test blacklist',
					'id': 'test',
					'type': 0,
					'color': '#ff0000',
					'options': {
						'enabled': true,
						'matchTitle': false
					}
				},
				'test2': {
					'name': 'Test whitelist',
					'id': 'test2',
					'type': 1,
					'color': '#00aa00',
					'options': {
						'enabled': true,
						'matchTitle': false
					}
				},
				'test3': {
					'name': 'Test disabled',
					'id': 'test3',
					'type': 0,
					'color': '#0000aa',
					'options': {
						'enabled': false,
						'matchTitle': false
					}
				},
				'test4': {
					'name': 'Test auto',
					'id': 'test4',
					'type': 1,
					'enabled': false,
					'options': {
						'matchTitle': true,
						'color': '#aa00aa'
					}
				}
			});
			Background.resetOptions();
		} else {
			Background.load();
		}
	},
	load: function () {
		try {
			Background.resetOptions();
			Background.resetFilters();
			Storage.get(Background.STORAGE_DATA).then(function (appData) {
				Background.setOptions(appData.options);
				Background.setFilters(appData.filters);
			}).catch(error);
		} catch (e) {
			error(e);
		}
	},
	save: function () {
		try {
			Storage.set(Background.STORAGE_DATA, Background.getAppData());
		} catch (e) {
			error(e);
		}
	},
	import: function (data, reply) {
		Background.setOptions(data.options);
		Background.setFilters(data.filters);
		Background.save();
		if (reply) reply(data);
	},
	export: function (data, reply) {
		reply(Background.getAppData());
	},
	openEditor: function (id) {
		browser.tabs.create({
			url: Background.EDITOR + (typeof id === 'string' ? '#' + id : '')
		});
	},
	openOptions: function () {
		browser.tabs.create({
			url: Background.OPTIONS
		});
	}
};

Messenger.context = 'runtime';
Messenger.addListener('apply',                  Background.apply);
Messenger.addListener('apply-reply-reply',      Background.updateFilters);
Messenger.addListener('update-context-menu',    Background.updatePageContextMenu);
Messenger.addListener('get-filters',            Background.getFilters);
Messenger.addListener('set-filters',            Background.setFilters);
Messenger.addListener('reset-filters',          Background.resetFilters);
Messenger.addListener('get-filter',             Background.getFilter);
Messenger.addListener('set-filter',             Background.setFilter);
Messenger.addListener('add-to-filter',          Background.addToFilter);
Messenger.addListener('remove-from-filter',     Background.removeFromFilter);
Messenger.addListener('add-to-filters',         Background.addToFilters);
Messenger.addListener('remove-from-filters',    Background.removeFromFilters);
Messenger.addListener('add-all-to-filter',      Background.addAllToFilter);
Messenger.addListener('remove-all-from-filter', Background.removeAllFromFilter);
Messenger.addListener('toggle-filter',          Background.toggle);
Messenger.addListener('delete-filter',          Background.delete);
Messenger.addListener('get-options',            Background.getOptions);
Messenger.addListener('set-options',            Background.setOptions);
Messenger.addListener('reset-options',          Background.resetOptions);
Messenger.addListener('toggle-app',             Background.toggleApp);
Messenger.addListener('reset-app',              Background.resetApp);
Messenger.addListener('open-editor',            Background.openEditor);
Messenger.addListener('open-options',           Background.openOptions);
Messenger.addListener('import',                 Background.import);
Messenger.addListener('export',                 Background.export);
Background.init();
