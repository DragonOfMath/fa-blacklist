var List = {
	searchBar: null,
	searchBarContainer: null,
	usersTitle: null,
	usersAddAllDropdown: null,
	usersRemoveAllDropdown: null,
	usersGlobalContainer: null,
	usersTable: null,
	subsTitle: null,
	subsAddAllDropdown: null,
	subsRemoveAllDropdown: null,
	subsGlobalContainer: null,
	subsTable: null,
	mainContainer: null,
	
	create: function ($root) {
		$root = $root || document.body;

		List.mainContainer = html('div', {id: 'list'}, [
			List.searchBarContainer = html('div', {id: 'search'}, [
				List.searchBar = html('input', {type: 'textbox', id: 'searchbar', 'data-i18n': 'searchPlaceholder,placeholder'})
			]),
			List.usersGlobalContainer = html('div', {id: 'users-global'}, [
				List.usersTitle             = html('h3', {'data-i18n': 'users'}),
				List.usersAddAllDropdown    = html('select', {id: 'users-add-all'}), 
				List.usersRemoveAllDropdown = html('select', {id: 'users-remove-all'})
			]),
			List.usersTable = html('div', {id: 'users'}).addClassName('group'),
			List.subsGlobalContainer = html('div', {id: 'submissions-global'}, [
				List.subsTitle              = html('h3', {'data-i18n': 'submissions'}), 
				List.subsAddAllDropdown     = html('select', {id: 'submissions-add-all'}), 
				List.subsRemoveAllDropdown  = html('select', {id: 'submissions-remove-all'})
			]),
			List.subsTable = html('div', {id: 'submissions'}).addClassName('group')
		]);
		
		List.addEventHandlers();
		
		if ($root) {
			$root.appendChild(List.mainContainer);
		}
		return List.mainContainer;
	},
	initFromDocument: function ($root) {
		$root = $root || document.body;
		
		List.mainContainer      = $root.querySelector('#list');
		List.searchBarContainer = List.mainContainer.querySelector('#search');
		List.searchBar          = List.searchBarContainer.querySelector('#searchbar');
		List.usersGlobalContainer   = List.mainContainer.querySelector('#users-global');
		List.usersTitle             = List.usersGlobalContainer.querySelector('h3');
		List.usersAddAllDropdown    = List.usersGlobalContainer.querySelector('select#users-add-all');
		List.usersRemoveAllDropdown = List.usersGlobalContainer.querySelector('select#users-remove-all');
		List.usersTable         = List.mainContainer.querySelector('#users');
		List.subsGlobalContainer   = List.mainContainer.querySelector('#submissions-global');
		List.subsTitle             = List.subsGlobalContainer.querySelector('h3');
		List.subsAddAllDropdown    = List.subsGlobalContainer.querySelector('select#submissions-add-all');
		List.subsRemoveAllDropdown = List.subsGlobalContainer.querySelector('select#submissions-remove-all');
		List.subsTable          = List.mainContainer.querySelector('#submissions');
		
		List.addEventHandlers();
		
		return List.mainContainer;
	},
	addEventHandlers: function () {
		// update table when keys are entered in the search bar
		List.searchBar.whenKeyPressed(function (e) {
			List.search(e.target.value);
		});
		// handle global dropdown changes
		List.usersAddAllDropdown.whenChanged(function (e) {
			var ID = e.target.value;
			if (ID) {
				Page.addTargetsToFilter(Users, ID);
				e.target.value = '';
			}
		});
		List.usersRemoveAllDropdown.whenChanged(function (e) {
			var ID = e.target.value;
			if (ID) {
				Page.removeTargetsFromFilter(Users, ID);
				e.target.value = '';
			}
		});
		List.subsAddAllDropdown.whenChanged(function (e) {
			var ID = e.target.value;
			if (ID) {
				Page.addTargetsToFilter(Submissions, ID);
				e.target.value = '';
			}
		});
		List.subsRemoveAllDropdown.whenChanged(function (e) {
			var ID = e.target.value;
			if (ID) {
				Page.removeTargetsFromFilter(Submissions, ID);
				e.target.value = '';
			}
		});
	},
	init: function (users, submissions) {
		List.usersTable.removeChildren();
		List.subsTable.removeChildren();
		
		for (var name in users) {
			createTableRow(List.usersTable, users[name]);
		}
		for (var id in submissions) {
			createTableRow(List.subsTable, submissions[id]);
		}
		
		function createTableRow($table, target) {
			var $link      = target.createLink();
			var $container = target.tagsContainer;
			var $dropdown  = html('select', {}).addClassName('add-tag').whenChanged(function (e,t) {
				var f = e.target.value;
				if (f) {
					Page.addTargetToFilter(t,f);
					e.target.value = '';
				}
			}, target);
			var $row = html('div', {id: target.id}, [$link, $container, $dropdown]).addClassName('row');
			
			$table.appendChild($row);
			return $row;
		}
		
		// placeholders
		if (!List.usersTable.firstElementChild) {
			List.usersTable.appendChild(html('span', {id: 'user-placeholder', 'data-i18n': 'usersPlaceholder'}));
		}
		if (!List.subsTable.firstElementChild) {
			List.subsTable.appendChild(html('span', {id: 'submission-placeholder', 'data-i18n': 'submissionsPlaceholder'}));
		}
	},
	update: function () {
		var messageAdd = i18n.get('listAddAll');
		var messageRem = i18n.get('listRemoveAll');
		Utils.populateDropdown(List.usersAddAllDropdown, Filters, messageAdd);
		Utils.populateDropdown(List.usersRemoveAllDropdown, Filters, messageRem);
		Utils.populateDropdown(List.subsAddAllDropdown, Filters, messageAdd);
		Utils.populateDropdown(List.subsRemoveAllDropdown, Filters, messageRem);
		
		List.usersTable.childElements().invoke('hide');
		List.subsTable.childElements().invoke('hide');
		
		var usersShowing = 0;
		var subsShowing = 0;
		
		$A(arguments).forEach(processTarget);
		
		if (!usersShowing) {
			$('user-placeholder').show();
		}
		if (!subsShowing) {
			$('submission-placeholder').show();
		}
		
		function processTarget(target) {
			if (target instanceof User) {
				processUser(target);
			} else if (target instanceof Submission) {
				processSubmission(target);
			} else if (typeof target === 'object') {
				for (var id in target) {
					processTarget(target[id]);
				}
			}
		}
		function processUser(user) {
			usersShowing++;
			updateRow(List.usersTable, user);
			for (var sid in user.submissions) {
				subsShowing++;
				updateRow(List.subsTable, user.submissions[sid]);
			}
		}
		function processSubmission(submission) {
			subsShowing++;
			updateRow(List.subsTable, submission);
			if (submission.user) {
				usersShowing++;
				updateRow(List.usersTable, submission.user);
			}
		}
		function updateRow($table, target) {
			var $row      = $table.querySelector('[id="'+target.id+'"]');
			var $dropdown = $row.querySelector('select.add-tag');
			var filters = {};
			for (var ID in Filters) {
				if (target.hasTag(ID)) {
					var $tag = target.getTagElement(ID);
					if (!$tag) continue;
					var $remove = $tag.querySelector('button.remove');
					if (!$remove) {
						$remove = html('button', {}, 'x').addClassName('remove').whenClicked(function (e,t,f) {
							Page.removeTargetFromFilter(t,f);
						}, target, ID);
						$tag.appendChild($remove);
					}
				} else {
					// populate tag dropdown
					filters[ID] = Filters[ID];
				}
			}
			Utils.populateDropdown($dropdown, filters, '+');
			$row.show();
		}
	},
	search: function (text) {
		text = String(text).toLowerCase();
		List.usersTable.childElements().forEach(function ($row) {
			var user = Users[$row.id];
			if (!text || user.id.indexOf(text) > -1) {
				$row.show();
			} else {
				$row.hide();
			}
		});
		List.subsTable.childElements().forEach(function ($row) {
			var submission = Submissions[$row.id];
			if (!submission) return;
			var title = submission.getTitle();
			if (!text || submission.id.indexOf(text) > -1 || (title && title.toLowerCase().indexOf(text) > -1)) {
				$row.show();
			} else {
				$row.hide();
			}
		});
	}
};

var Utils = {
	populateDropdown: function ($d, filters, defaultText) {
		var $cancel = html('option', {value: ''}, defaultText || '(cancel)');
		$d.removeChildren();
		$d.appendChild($cancel);
		for (var ID in filters) {
			var $option = html('option', {value: filters[ID].id}, filters[ID].name);
			$d.appendChild($option);
		}
		$d.value = defaultText ? '' : 'unselected';
		return $d;
	}
};
