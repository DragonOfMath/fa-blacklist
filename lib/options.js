convertCheckboxesToSwitches();

var $optionsForm  = $('options');
var $options      = $A($optionsForm.querySelectorAll('input'));
var $resetOptions = $('reset-options');
var $resetApp     = $('reset-app');

var $importAppData = $('import-app-data');
var $exportAppData = $('export-app-data');
var $appDataImporter = $('app-importer');

var Options = {
	serialize: function () {
		var options = {};
		$options.forEach(function ($o) {
			options[$o.id] = !!$o.checked;
		});
		return options;
	},
	update: function (options) {
		//console.log('Got options:',options);
		$options.forEach(function ($o) {
			$o.checked = !!options[$o.id];
		});
	},
	save: function () {
		var options = Options.serialize();
		//console.log('Setting options:',options);
		Messenger.send('runtime', 'set-options', options);
	},
	load: function () {
		Messenger.send('runtime', 'get-options');
	},
	reset: function () {
		Messenger.send('runtime', 'reset-options');
	},
	resetApp: function () {
		if (confirm(i18n.get('confirmEraseData'))) {
			Messenger.send('runtime', 'reset-app');
		}
	},
	_import: function () {
		$appDataImporter.click();
	},
	import: function () {
		importFile($appDataImporter.files[0], function (contents) {
			var data;
			try {
				try {
					data = JSON.parse(contents);
				} catch (e) {
					data = contents;
				}
				Messenger.send('import', data);
			} catch (e) {
				alert(e);
			}
		});
	},
	_export: function () {
		Messenger.send('runtime', 'export');
	},
	export: function (data) {
		exportFile('fa-blacklist_export_'+(new Date()).toLocaleString()+'.json', data);
	},
	reload: function () {
		window.reload_page();
	}
};

Messenger.context = 'tabs';
Messenger.addListener('get-options-reply', Options.update);
Messenger.addListener('reset-options-reply', Options.update);
Messenger.addListener('reset-app-reply', Options.reload);
Messenger.addListener('export-reply', Options.export);
Messenger.addListener('import-reply', Options.reload);

$optionsForm.addEventListener('change', Options.save, false);
$resetOptions.addEventListener('click', Options.reset, false);
$resetApp.addEventListener('click', Options.resetApp, false);
$appDataImporter.observe('change', Options.import);
$importAppData.addEventListener('click', Options._import, false);
$exportAppData.addEventListener('click', Options._export, false);

window.addEventListener('load', Options.load);
window.addEventListener('focus', Options.load);

i18n.localizeDocument();
