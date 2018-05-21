convertCheckboxesToSwitches();

var $optionsForm  = $('options');
var $options      = $A($optionsForm.querySelectorAll('input'));
var $resetOptions = $('reset-options');
var $resetApp     = $('reset-app');

var Options = {
	serialize: function () {
		var options = {};
		$options.forEach(function ($o) {
			options[$o.id] = !!$o.checked;
		});
		return options;
	},
	update: function (options) {
		console.log('Got options:',options);
		$options.forEach(function ($o) {
			$o.checked = !!options[$o.id];
		});
	},
	save: function () {
		var options = Options.serialize();
		console.log('Setting options:',options);
		Messenger.send('runtime', 'set-options', options);
	},
	load: function () {
		Messenger.send('runtime', 'get-options');
	},
	reset: function () {
		Messenger.send('runtime', 'reset-options');
	},
	resetApp: function () {
		if (confirm('Are you sure you want to erase all data for this extension?')) {
			Messenger.send('runtime', 'reset-app');
		}
	}
};

Messenger.context = 'tabs';
Messenger.addListener('get-options-reply', Options.update);
Messenger.addListener('reset-options-reply', Options.update);
Messenger.addListener('reset-app-reply', function () {
	window.reload_page();
});

$optionsForm.addEventListener('change', Options.save, false);
$resetOptions.addEventListener('click', Options.reset, false);
$resetApp.addEventListener('click', Options.resetApp, false);

window.addEventListener('load', Options.load);
window.addEventListener('focus', Options.load);
