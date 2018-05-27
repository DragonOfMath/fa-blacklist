var Messenger = {
	context: 'runtime',
	listeners: [],
	addListener: function (event, callback) {
		this.listeners.push({
			event: event,
			callback: callback
		});
	},
	send: function (to, event, payload) {
		var message = {
			context: Messenger.context,
			event: event || 'main',
			timeSent: Date.now(),
			timeReceived: 0,
			data: payload
		};
		switch (to) {
			case 'runtime':
				return browser.runtime.sendMessage(message);
			case 'extension':
				return browser.extension.sendMessage(message);
			case 'tabs':
				return browser.tabs.query({active: true, currentWindow: true}).then(function (tabs) {
					return browser.tabs.sendMessage(tabs[0].id, message);
				});
			case 'window':
				// https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
				window.postMessage(message, '*');
				break;
		}
	},
	receive: function(message, sender, sendResponse) {
		message.timeRecieved = Date.now();
		Messenger.listeners.forEach(function (listener) {
			if (listener.event == message.event) {
				listener.callback.call(Messenger, message.data, function (replyData) {
					Messenger.send(message.context, message.event+'-reply', replyData);
				});
			}
		});
	}
};

function error(response) {
	console.error('WebExt error:', response);
}

browser.runtime.onMessage.addListener(Messenger.receive);
