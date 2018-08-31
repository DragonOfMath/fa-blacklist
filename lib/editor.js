convertCheckboxesToSwitches();
i18n.localizeDocument();

var $editor = $('editor');
var $newFilter    = $('new-filter');
var $saveFilter   = $('save-filter');
var $copyFilter   = $('copy-filter');
var $loadFilter   = $('load-filter');
var $deleteFilter = $('delete-filter');
var $exportFilter = $('export-filter');
var $importFilter = $('import-filter');
var $fileImporter = $('import');
var $filterDropdown = $('filter-dropdown');
var $filterName       = $('name');
var $filterID         = $('id');
var $filterColor      = $('color');
var $filterTextColor  = $('color-text');
var $filterType       = $('type');
var $filterTagPreview = $('tag-preview');
var $filterUsers             = $('users');
var $filterUsersLength       = $('content-length-users');
var $filterSubmissions       = $('submissions');
var $filterSubmissionsLength = $('content-length-submissions');
var $filterKeywords          = $('keywords');
var $filterOptions = $A($$('input[type="checkbox"]'));
var $filterEnabled = $('enabled');

var Editor = {
	title: document.title,
	changesSaved: true,
	changeHappened: function (e) {
		Editor.changesSaved = false;
		Editor.setTitle();
	},
	changeWasSaved: function () {
		Editor.changesSaved = true;
		Editor.setTitle();
	},
	setTitle: function () {
		document.title = (Editor.changesSaved ? '' : '*') + Editor.getName() + ' - ' + Editor.title;
	},
	getID: function () {
		return $filterID.textContent;
	},
	setID: function (id) {
		$filterID.textContent = id;
	},
	getName: function () {
		return $filterName.value || $filterName.placeholder;
	},
	setName: function (name) {
		$filterName.value = name;
	},
	getType: function () {
		return Number($filterType.value);
	},
	setType: function (type) {
		$filterType.value = Number(type);
	},
	getColor: function () {
		return $filterColor.value;
	},
	setColor: function (color) {
		$filterColor.value = color;
	},
	getTextColor: function () {
		return $filterTextColor.value;
	},
	setTextColor: function (color) {
		$filterTextColor.value = color;
	},
	getUsers: function () {
		var value = $filterUsers.value.trim();
		return value ? value.split('\n').map(Utils.sanitizeUsername).compact() : [];
	},
	setUsers: function (users) {
		$filterUsers.value = Object.isArray(users) ? users.join('\n')  : users || '';
		Editor.updateUserContentLength();
	},
	getSubmissions: function () {
		var value = $filterSubmissions.value.trim();
		return value ? value.split('\n').map(Utils.sanitizeSubmissionID).compact() : [];
	},
	setSubmissions: function (submissions) {
		$filterSubmissions.value = Object.isArray(submissions) ? submissions.join('\n')  : submissions || '';
		Editor.updateSubmissionContentLength();
	},
	getKeywords: function () {
		var value = $filterKeywords.value.trim();
		return value ? value.split('\n').compact() : [];
	},
	setKeywords: function (keywords) {
		$filterKeywords.value = Object.isArray(keywords) ? keywords.join('\n')  : keywords || '';
	},
	getEnabled: function () {
		return $filterEnabled.checked;
	},
	setEnabled: function (enabled) {
		$filterEnabled.checked = enabled;
	},
	getOptions: function () {
		var options = {};
		$filterOptions.forEach(function ($o) {
			options[$o.id] = !!$o.checked;
		});
		return options;
	},
	setOptions: function (options) {
		$filterOptions.forEach(function ($o) {
			var id = $o.id;
			$o.checked = id in options ?
				options[id] :
				Filter.DEFAULT_OPTIONS[id];
		});
	},
	update: function (filter, forceChange) {
		if (filter && (Editor.changesSaved || forceChange)) {
			if (typeof filter === 'object') {
				Editor.setID(filter.id);
				Editor.setName(filter.name);
				Editor.setColor(filter.color);
				Editor.setTextColor(filter.tcolor);
				Editor.setType(filter.type);
				Editor.setUsers(filter.users);
				Editor.setSubmissions(filter.submissions);
				Editor.setKeywords(filter.keywords);
				Editor.setOptions(filter.options);
			} else if (typeof filter === 'string') {
				Editor.setUsers(filter);
			}
		}
		Utils.setHash(Editor.getID());
		Editor.updateTagPreview();
		Editor.setTitle();
	},
	updateUserContentLength: function () {
		var value = Editor.getUsers();
		$filterUsersLength.textContent = value.length;
	},
	updateSubmissionContentLength: function () {
		var value = Editor.getSubmissions();
		$filterSubmissionsLength.textContent = value.length;
	},
	updateTagPreview: function () {
		var name    = Editor.getName();
		var color   = Editor.getColor();
		var tcolor  = Editor.getTextColor();
		var enabled = Editor.getEnabled();
		var auto    = $('matchName').checked || $('matchTitle').checked;
		$filterTagPreview.querySelector('span.text').textContent = name;
		if (!enabled) name += ' (disabled)';
		$filterTagPreview.setAttribute('title', name);
		$filterTagPreview.setStyle({backgroundColor: color, borderColor: color, color: tcolor});
		if (enabled) {
			$filterTagPreview.removeClassName('disabled');
			if (auto) {
				$filterTagPreview.addClassName('auto');
			} else {
				$filterTagPreview.removeClassName('auto');
			}
		} else {
			$filterTagPreview.addClassName('disabled');
			$filterTagPreview.removeClassName('auto');
		}
	},
	cleanAndSortUserContents: function () {
		Editor.setUsers(Editor.getUsers().map(Utils.sanitizeUsername).uniq().sort());
		Editor.updateUserContentLength();
	},
	cleanAndSortSubmissionContents: function () {
		Editor.setSubmissions(Editor.getSubmissions().map(Utils.sanitizeSubmissionID).uniq().sort());
		Editor.updateSubmissionContentLength();
	},
	generateID: function () {
		Editor.setID(Filter.generateID());
	},
	randomColor: function (e, $color) {
		var color = (0xFFFFFF * Math.random()) | 0;
		$color.value = Utils.cssColor(color)
		Editor.updateTagPreview();
		Editor.changeHappened();
	},
	reset: function () {
		Editor.setID('');
		Editor.setName('');
		Editor.setColor(Filter.DEFAULT_COLOR);
		Editor.setTextColor(Filter.DEFAULT_TEXT_COLOR);
		Editor.setType(Filter.BLACKLIST);
		Editor.setUsers('');
		Editor.setSubmissions('');
		Editor.setKeywords('');
		Editor.setOptions(Filter.DEFAULT_OPTIONS);
		Editor.changesSaved = false;
		Editor.update();
	},
	serialize: function () {
		return {
			name:        Editor.getName(),
			id:          Editor.getID(),
			color:       Editor.getColor(),
			tcolor:      Editor.getTextColor(),
			type:        Editor.getType(),
			
			users:       Editor.getUsers(),
			submissions: Editor.getSubmissions(),
			keywords:    Editor.getKeywords(),
			
			options:     Editor.getOptions()
		};
	},
	save: function () {
		if (!Editor.getID()) {
			Editor.generateID();
		}
		Utils.setHash(Editor.getID());
		Editor.changeWasSaved();
		Messenger.send('runtime', 'set-filter', Editor.serialize());
	},
	saveAsCopy: function () {
		Editor.generateID();
		Editor.save();
	},
	load: function (ID) {
		var message = i18n.get('confirmDiscard');
		if (!Editor.changesSaved && confirm(message)) {
			Editor.save();
		}
		Messenger.send('runtime', 'get-filter', ID);
	},
	loadFromHash: function () {
		var id = Utils.getHash();
		if (id) {
			Editor.setID(id);
			// avoid loading an existing filter if there were changes made
			if (!Editor.changesSaved) return;
			Editor.load(id);
		} else {
			Editor.update();
		}
	},
	getFilters: function () {
		Messenger.send('runtime', 'get-filters');
	},
	'delete': function () {
		var id = Editor.getID();
		var message = i18n.get('confirmDelete');
		if (id && confirm(message)) {
			Messenger.send('runtime', 'delete-filter', id);
			Editor.reset();
		}
	},
	'_import': function () {
		$fileImporter.click();
	},
	'import': function () {
		importFile($fileImporter.files[0], function (contents) {
			var data;
			try {
				try {
					data = JSON.parse(contents);
				} catch (e) {
					data = contents;
				}
				Editor.update(data, true);
				Editor.changeHappened();
			} catch (e) {
				alert(e);
			}
		});
	},
	'export': function () {
		exportFile(Editor.getName() + '.json', Editor.serialize());
	},
	listFiltersInDropdown: function (filters, reply) {
		Utils.populateDropdown($filterDropdown, filters);
		$filterDropdown.parentElement.removeClassName('hidden');
		$filterDropdown.focus();
	}
};

var Utils = {
	cssColor: function (color) {
		color = color.toString(16);
		while (color.length < 6) color = '0' + color;
		return '#' + color;
	},
	sanitizeUsername: function (name) {
		try {
			return name.replace(/[^a-z0-9\~\-\.]/gi,'').toLowerCase().trim();
		} catch (e) {
			return '';
		}
	},
	sanitizeSubmissionID: function (id) {
		try {
			return id.match(/\/view\/(\d+)/)[1];
		} catch (e) {
			return '';
		}
	},
	getHash: function () {
		return window.location.hash ? window.location.hash.substring(1) : '';
	},
	setHash: function (x) {
		window.location.hash = '#' + x;
	},
	populateDropdown: function ($d, filters) {
		var $cancel = html('option', {value: ''}, '(cancel)');
		$d.removeChildren();
		$d.appendChild($cancel);
		for (var ID in filters) {
			var $option = html('option', {value: filters[ID].id}, filters[ID].name);
			$d.appendChild($option);
		}
		$d.value = 'unselected';
		return $d;
	},
	getUsername: function () { 
		var message = i18n.get('promptUsername');
		return Utils.sanitizeUsername(prompt(message));
	}
};

// API requests
function getWatchlist(e) {
	var username = Utils.getUsername();
	if (!username) return;
	
	var $btn = e.target;
	var text = $btn.textContent;
	$btn.textContent = 'Fetching...';
	
	var wl = Editor.getUsers();
	function getPage(p) {
		// thank god this exists
		return fetch('http://faexport.boothale.net/user/' + username + '/watching.json' + (p>1?'?page='+p:''))
		.then(function (x) {return x.json()})
		/* DEPRECATED
		return fetch('https://www.furaffinity.net/watchlist/by/'+username+(p>1?'/'+p+'/':''))
		.then(function (x) {return x.text()})
		.then(function (x) {return x.html()})
		.then(function ($dom) {return $A($dom.querySelectorAll('#userpage-budlist>tbody>tr>td>a,div.watch-row>a')).pluck('textContent')})
		*/
		.then(function (users) {
			$btn.textContent = 'Fetching (page ' + p + ')...';
			console.log('Got page ' + p + ' of ' + username + '\'s watchlist, ' + users.length + ' items');
			if (users.length) {
				users = users.map(Utils.sanitizeUsername);
				wl = wl.concat(users);
				return getPage(p+1);
			} else {
				Editor.setUsers(wl.uniq());
			}
		})
		.catch(function (e) {
			console.error(e);
			alert(e);
		})
		.then(function () {
			$btn.textContent = text;
		});
	}
	getPage(1);
}
function getGallery(e) {
	var username = Utils.getUsername();
	if (!username) return;
	
	var $btn = e.target;
	var text = $btn.textContent;
	$btn.textContent = 'Fetching...';
	
	var items = Editor.getSubmissions();
	function getPage(p) {
		return fetch('http://faexport.boothale.net/user/' + username + '/gallery.json' + (p>1?'?page='+p:''))
		.then(function (x) {return x.json()})
		.then(function (submissions) {
			$btn.textContent = 'Fetching (page ' + p + ')...';
			console.log('Got page ' + p + ' of ' + username + '\'s gallery, ' + submissions.length + ' items');
			if (submissions.length) {
				items = items.concat(submissions);
				return getPage(p+1);
			} else {
				Editor.setSubmissions(items.uniq());
			}
		})
		.catch(function (e) {
			console.error(e);
			alert(e);
		})
		.then(function () {
			$btn.textContent = text;
		});
	}
	getPage(1);
}
function getFavorites(e) {
	var username = Utils.getUsername();
	if (!username) return;
	
	var $btn = e.target;
	var text = $btn.textContent;
	$btn.textContent = 'Fetching...';
	
	var items = Editor.getSubmissions();
	function getPage(p) {
		return fetch('http://faexport.boothale.net/user/' + username + '/favorites.json' + (p>1?'?page='+p:''))
		.then(function (x) {return x.json()})
		.then(function (favorites) {
			$btn.textContent = 'Fetching (page ' + p + ')...';
			console.log('Got page ' + p + ' of ' + username + '\'s favorites, ' + favorites.length + ' items');
			if (favorites.length) {
				items = items.concat(favorites);
				return getPage(p+1);
			} else {
				Editor.setSubmissions(items.uniq());
			}
		})
		.catch(function (e) {
			console.error(e);
			alert(e);
		})
		.then(function () {
			$btn.textContent = text;
		});
	}
	getPage(1);
}

/* Event handling */

document.addEventListener('keydown', function (e) {
	// check for shortcuts, i.e. Ctrl+S (save), Ctrl+E (export), Ctrl+I (import)
	if (e.ctrlKey || e.metaKey) {
		switch (e.key.toLowerCase()) {
			case 's':
				e.preventDefault();
				e.stopPropagation();
				if (e.altKey) {
					Editor.saveAsCopy();
				} else {
					Editor.save();
				}
				break;
			case 'q':
				e.preventDefault();
				e.stopPropagation();
				window.close();
				break;
			case 'x':
				e.preventDefault();
				e.stopPropagation();
				Editor.delete();
				break;
			case 'e':
				e.preventDefault();
				e.stopPropagation();
				Editor.export();
				break;
			case 'i':
				e.preventDefault();
				e.stopPropagation();
				Editor._import();
				break;
			// TODO: add more shortcuts?
		}
	}
});
$editor.whenChanged(Editor.changeHappened).whenKeyPressed(Editor.changeHappened);
$newFilter.whenClicked(Editor.reset);
$saveFilter.whenClicked(Editor.save);
$copyFilter.whenClicked(Editor.saveAsCopy);
$loadFilter.whenClicked(Editor.getFilters);
$deleteFilter.whenClicked(Editor.delete);
$exportFilter.whenClicked(Editor.export);
$importFilter.whenClicked(Editor._import);
$fileImporter.observe('change', Editor.import);
$filterDropdown.whenChanged(function () {
	var selected = $filterDropdown.value;
	if (selected && selected != 'unselected') {
		Editor.load(selected);
	}
	$filterDropdown.parentElement.addClassName('hidden');
});
$filterUsers.whenKeyPressed(Editor.updateUserContentLength);
$filterSubmissions.whenKeyPressed(Editor.updateSubmissionContentLength);
$('clean-sort-users').whenClicked(Editor.cleanAndSortUserContents);
$('clean-sort-submissions').whenClicked(Editor.cleanAndSortSubmissionContents);
$('get-watchlist').whenClicked(getWatchlist);
$('get-submissions').whenClicked(getGallery);
$('get-favorites').whenClicked(getFavorites);
$filterName.whenKeyPressed(Editor.updateTagPreview);
$filterColor.whenChanged(Editor.updateTagPreview);
$filterTextColor.whenChanged(Editor.updateTagPreview);
$('random-color').whenClicked(Editor.randomColor, $filterColor);
$('random-text-color').whenClicked(Editor.randomColor, $filterTextColor);
$filterEnabled.whenChanged(Editor.updateTagPreview);
$('matchName').whenChanged(Editor.updateTagPreview);
$('matchTitle').whenChanged(Editor.updateTagPreview);

Messenger.context = 'tabs';
Messenger.addListener('get-filter-reply', function (filter, reply) {
	Editor.update(filter, true);
});
Messenger.addListener('get-filters-reply', Editor.listFiltersInDropdown);

window.addEventListener('load', Editor.loadFromHash);
window.addEventListener('focus', Editor.loadFromHash);
window.addEventListener('beforeunload', function (e) {
	if (!Editor.changesSaved) {
		return e.returnValue = 'You have unsaved changes! Are you sure you want to close the window?';
	}
});

