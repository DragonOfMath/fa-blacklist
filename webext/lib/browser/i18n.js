var i18n = {
	locale: browser.i18n.getUILanguage(),
	get: function (messageID, substitutions, defaultString) {
		var localizedMessage = browser.i18n.getMessage(messageID, substitutions);
		if (!localizedMessage) {
			console.error('Unknown i18n message',messageID,'for the locale',i18n.locale);
			return defaultString;
		}
		return localizedMessage;
	},
	localizeElement: function ($node) {
		// localMessageID,attribute;localMessageID,attribute;...
		var i18nData = $node.getAttribute('data-i18n');
		if (!i18nData) return;
		i18nData.split(';').forEach(function (attr) {
			if (!attr) return;
			var data = attr.split(',');
			var message = i18n.get(data[0]);
			if (message) {
				if (data[1]) {
					$node.setAttribute(data[1], message);
				} else {
					$node.textContent = message;
				}
			}
		});
	},
	localizeDocument: function ($root) {
		if (!$root) $root = document.body;
		$root.select('[data-i18n]').forEach(i18n.localizeElement);
	}
};
