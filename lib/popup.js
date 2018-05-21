var MANIFEST = browser.runtime.getManifest();

$('version').textContent = MANIFEST.version;

var $powerButton   = $('power-button');
var $newFilter     = $('new-filter');
var $openOptions   = $('open-options');
var $filterSearch  = $('searchbar');
var $filterSort    = $('sort-filters');
var $filterResults = $('search-results');
var $filterTable   = $(document.querySelector('#filters>tbody'));

var Filters = {}; // cache

var Popup = {
	title: document.title,
	getSearch: function () {
		return $filterSearch.value;
	},
	apply: function (data) {
		Filters = data.filters;
		$filterTable.removeChildren();
		for (var ID in data.filters) {
			$filterTable.append(Popup.createTableRow(data.filters[ID]));
		}
		if (!$filterTable.firstElementChild) {
			// table is empty
			$filterTable.append(Popup.createTableRow());
		}
		if (data.options) {
			Popup.updateToggle(data.options.enabled);
		}
	},
	search: function (query) {
		var matches = [];
		$A($filterTable.children).forEach(function ($row) {
			var name = $row.querySelector('span.text').textContent;
			var id   = $row.getAttribute('id');
			if (!query || name.include(query)) {
				$row.removeClassName('hidden');
				matches.push(id);
			} else {
				$row.addClassName('hidden');
			}
		});
		return matches;
	},
	updateSearchResults: function () {
		var matches = search(Popup.getSearch().toLowerCase());
		/*
		if (matches) {
			$filterResults.textContent = matches.length;
			$filterResults.parentElement.removeClassName('hidden');
		} else {
			$filterResults.parentElement.addClassName('hidden');
		}
		*/
	},
	sort: function () {
		var sortByKey = $filterSort.value;
		var _keys = Object.keys(Filters).sort(function (ID1, ID2) {
			var val1, val2;
			if (sortByKey == 'size') {
				val1 = Filters[ID1].users.length + Filters[ID1].submissions.length;
				val2 = Filters[ID2].users.length + Filters[ID2].submissions.length;
			} else {
				val1 = Filters[ID1][sortByKey];
				val2 = Filters[ID2][sortByKey];
			}
			return (val1 > val2) ? 1 : (val1 < val2) ? -1 : 0;
		});
		var _Filters = {};
		_keys.forEach(function (ID) {
			_Filters[ID] = Filters[ID];
		});
		Popup.apply({filters: _Filters});
	},
	updateToggle: function (enabled) {
		if (enabled) {
			$('power-button').removeClassName('disabled');
		} else {
			$('power-button').addClassName('disabled');
		}
	},
	createTableRow: function (filter) {
		var $nameColumn    = html('td');
		var $enabledColumn = html('td');
		var $optionsColumn = html('td');
		var $filterRow = html('tr', {}, [$nameColumn, $enabledColumn, $optionsColumn]);
		if (filter) {
			var $tag = (new Filter(filter)).createTag()
			.whenClicked(function (e) {
				Popup.edit(filter.id);
			});
			var $enabledInput = Switch('round', filter.options.enabled || undefined)
			.whenChanged(function (e) {
				Popup.toggle(filter.id);
				$tag.toggleClassName('disabled');
			});
			var $deleteFilter = html('button', {}, '✖')
			.addClassName('remove')
			.addClassName('red')
			.whenClicked(function (e) {
				Popup.delete(filter.id);
				$filterRow.remove();
			});
			$nameColumn.appendChild($tag);
			$enabledColumn.appendChild($enabledInput);
			$optionsColumn.appendChild($deleteFilter);
		} else {
			var $placeholder = html('tr', {'colspan': 3}, 'Hmm, nothing here...').addClassName('grey');
			$nameColumn.appendChild($placeholder);
		}
		return $filterRow;
	},
	toggleApp: function () {
		Messenger.send('runtime', 'toggle-app');
		$powerButton.toggleClassName('disabled');
	},
	toggle: function (ID) {
		Messenger.send('runtime', 'toggle-filter', ID);
	},
	edit: function (ID) {
		window.open(browser.runtime.getURL('editor.html') + (ID ? '#' + ID : ''), '_blank');
	},
	'delete': function (ID) {
		if (confirm('Are you sure you want to delete this filter?')) {
			Messenger.send('runtime', 'delete-filter', ID);
		}
	},
	options: function () {
		window.open(browser.runtime.getURL('options.html'), '_blank');
	}
};

$powerButton.whenClicked(Popup.toggleApp);
$newFilter.whenClicked(function () {Popup.edit()});
$openOptions.whenClicked(Popup.options);
$filterSearch.whenKeyPressed(Popup.updateSearchResults);
$filterSort.whenChanged(Popup.sort);

Messenger.context = 'runtime';
Messenger.addListener('apply-reply', Popup.apply);

Messenger.send('runtime', 'apply');

