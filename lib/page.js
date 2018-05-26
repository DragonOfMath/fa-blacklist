var Page = {
	INITIAL_LOAD: true,
	LoggedInUser: null,
	clear: function () {
		for (var name in Users) {
			delete Users[name];
		}
		for (var id in Submissions) {
			delete Submissions[id];
		}
		for (var ID in Filters) {
			delete Filters[ID];
		}
	},
	init: function () {
		Page.clear();
		var data = scrape(document);
		Users             = data.users;
		Submissions       = data.submissions;
		Page.LoggedInUser = data.logged_in_user;
		List.init(Users, Submissions);
		
		// show the $window when any node is hovered over
		function addEventHandlers(node) {
			node.hoverTarget.whenHovered($Window.HOVER_DURATION, $Window.update.curry(node.target));
			node.hoverTarget.whenMouseEnter(Page.updateContextMenu.curry(node.target));
		}
		for (var name in Users) {
			Users[name].nodes.forEach(addEventHandlers);
		}
		for (var id in Submissions) {
			Submissions[id].nodes.forEach(addEventHandlers);
		}
		if (Page.LoggedInUser) {
			Page.LoggedInUser.nodes.forEach(addEventHandlers);
		}
		
		Page.load();
	},
	updateContextMenu: function (target) {
		Messenger.send('runtime', 'update-context-menu', {
			id:   target.id,
			tags: target.tags,
			type: target.type
		});
	},
	handleContextMenuClick: function (data, reply) {
		console.log(data);
		if (!data) return Page.load();
		var target = data.args[0];
		if (typeof target === 'object') {
			if (target.type == 'user') {
				target = Users[target.id];
			} else if (target.type == 'submission') {
				target = Submissions[target.id];
			} else if (target.type == Filter.WHITELIST || target.type == Filter.BLACKLIST) {
				target = Filters[target.id];
			}
			data.args[0] = target;
		}
		var action = data.action.camelize();
		if (action in Page) {
			Page[action].apply(Page, data.args);
		}
	},
	updateTags: function (filters) {
		//console.log('Updating existing tags');
		for (var name in Users) {
			Users[name].updateTags(filters);
		}
		for (var id in Submissions) {
			Submissions[id].updateTags(filters);
		}
	},
	cacheFilters: function (filters) {
		//console.log('Caching filters');
		for (var ID in Filters) delete Filters[ID];
		for (var ID in filters) Filters[ID] = new Filter(filters[ID]);
	},
	backToNormal: function () {
		//console.log('Resetting page to normal');
		for (var name in Users) {
			Users[name].showNodes();
		}
		for (var id in this.Submissions) {
			Submissions[id].showNodes();
		}
	},
	scanContent: function (filters) {
		//console.log('Scanning page content');
		
		var payload = {};
		for (var ID in filters) {
			var filter = filters[ID];
			
			// skip disabled filters
			if (!filter.options.enabled) continue;
			
			// do automatic search and filter
			payload[ID] = { users: [], submissions: [] };
			if (filter.options.matchTitle) {
				for (var id in Submissions) {
					var submission = Submissions[id];
					var user = submission.user;
					if (submission.hasTag(ID)) continue;
					var matches = submission.matchNodes(filter.keywords, 'title');
					if (matches && matches.length) {
						if (filter.options.sensitive) {
							payload[ID].users.push(user.id);
							user.addTag(ID);
							console.log('Added',user.id,'to',ID,'(Matched with:',matches,')');
						} else {
							payload[ID].submissions.push(submission.id);
							submission.addTag(ID);
							console.log('Added',submission.id,'to',ID,'(Matched with:',matches,')');
						}
					}
				}
			}
			if (filter.options.matchName) {
				for (var name in Users) {
					var user = Users[name];
					if (user.hasTag(ID)) continue;
					var matches = user.matchNodes(filter.keywords, 'username');
					if (matches && matches.length) {
						payload[ID].users.push(user.id);
						user.addTag(ID);
						console.log('Added',user.id,'to',ID,'(Matched with:',matches,')');
					}
				}
			}
		}
		
		return payload;
	},
	apply: function (data) {
		// show/hide by applying filter options (it's faster this way)
		for (var name in Users) {
			Users[name].apply(data);
		}
		for (var id in Submissions) {
			Submissions[id].apply(data);
		}
	},
	main: function (data, reply) {
		Page.cacheFilters(data.filters);
		Page.updateTags(Filters);
		if (data.options.enabled) {
			if (Page.INITIAL_LOAD || data.options.alwaysScan) {
				reply(Page.scanContent(Filters));
				Page.INITIAL_LOAD = false;
			}
			Page.apply(data);
		} else {
			Page.backToNormal();
		}
		$Window.refresh();
	},
	load: function () {
		console.log('Loading filters');
		Messenger.send('runtime', 'apply');
	},
	addTargetToFilter: function (target, ID) {
		target.addTag(ID);
		Messenger.send('runtime', 'add-to-filter', {
			filter: ID,
			target: target.id,
			type: target.type
		});
		Page.load.defer();
	},
	removeTargetFromFilter: function (target, ID) {
		target.removeTag(ID);
		Messenger.send('runtime', 'remove-from-filter', {
			filter: ID,
			target: target.id,
			type: target.type
		});
		Page.load.defer();
	},
	addTargetsToFilter: function (targets, ID) {
		var type;
		for (var id in targets) {
			targets[id].addTag(ID);
			type = targets[id].type;
		}
		Messenger.send('runtime', 'add-all-to-filter', {
			filter: ID,
			targets: Object.keys(targets),
			type: type
		});
		Page.load.defer();
	},
	removeTargetsFromFilter: function (targets, ID) {
		var type;
		for (var id in targets) {
			targets[id].removeTag(ID);
			type = targets[id].type;
		}
		Messenger.send('runtime', 'remove-all-from-filter', {
			filter: ID,
			targets: Object.keys(targets),
			type: type
		});
		Page.load.defer();
	},
	addTargetToFilters: function (target, IDs) {
		IDs.forEach(function (ID) {
			target.addTag(ID);
		});
		Messenger.send('runtime', 'add-to-filters', {
			filters: IDs,
			target: target.id,
			type: target.type
		});
		Page.load.defer();
	},
	removeTargetFromFilters: function (target, IDs) {
		IDs.forEach(function (ID) {
			target.removeTag(ID);
		});
		Messenger.send('runtime', 'remove-from-filters', {
			filter: IDs,
			target: target.id,
			type: target.type
		});
		Page.load.defer();
	},
	inspectObject: function (obj) {
		console.log(obj);
	}
};

/*
	Draggable window showing a table of all users/submissions currently found on the page
*/
var $Window = (function () {
	var $title  = html('h2', {id: 'app-title', 'data-i18n': 'pageContentsTitle'}).addClassName('drag-handle');
	var $remove = html('button', {id: 'app-hide-window'}, '✖').addClassName('red');
	var $header = html('div', {id: 'app-header'}, [$title, $remove]).addClassName('drag-handle');
	var $body   = List.create();
	var $window = html('div', {id: 'app-window'}, [$header, $body]).addClassName('draggable').addClassName('drag-parent');
	
	Object.extend($window, {
		HOVER_DURATION: 1500,
		targetCache: null,
		update: function (targets) {
			$window.targetCache = targets;
			List.update(targets);
			$window.show();
		},
		refresh: function () {
			if ($window.targetCache) {
				$window.update($window.targetCache);
			}
		}
	});
	
	// hide window when the 'x' is clicked
	$remove.whenClicked(function (e) {
		DragHandler.stop();
		$window.targetCache = null;
		$window.hide();
	});
	$window.hide();
	
	// Add a root element for the app window and button
	var $showWindow = html('button', {id: 'app-show-window', 'data-i18n': 'pageShowWindowTitle,title;pageShowWindowText'});
	$showWindow.whenClicked(function (e) {
		$window.goto(e.target);
		$window.update(Users);
	});
	var $App = html('div', {id: 'app'}, [$showWindow, $window]);
	document.body.appendChild($App);
	i18n.localizeDocument($App);
	return $window;
})();

// final setup
Messenger.context = 'tabs';
Messenger.addListener('apply-reply', Page.main);
Messenger.addListener('update-context-menu-reply', Page.handleContextMenuClick);
window.addEventListener('focus', Page.load);
Page.init();
