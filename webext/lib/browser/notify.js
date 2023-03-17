var NOTIFICATION_NATIVE_SUPPORT = browser && 'notifications' in browser;
var NOTIFICATION_WEB_SUPPORT    = window  && 'Notification'  in window;

function Notify(title, message, iconUrl) {
	if (NOTIFICATION_NATIVE_SUPPORT) {
		// https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/notifications/NotificationOptions
		return browser.notifications.create({
			type: 'basic',
			title: title,
			message: message,
			iconUrl: iconUrl
		}).then(function (id) {
			setTimeout(function () {
				browser.notifications.clear(id);
			}, 10000);
		});
		
	} else if (NOTIFICATION_WEB_SUPPORT) {
		// https://developer.mozilla.org/en-US/docs/Web/API/notification
		if (Notification.permission == 'granted') {
			return new Notification(title, {
				body: message,
				icon: iconUrl
			});
		} else if (Notification.permission != 'denied') {
			Notification.requestPermission(function (permission) {
				return Notify(title, message, iconUrl);
			});
		}
	} else {
		console.log('Notifications are not supported.');
	}
}

if (NOTIFICATION_WEB_SUPPORT) {
	Notification.requestPermission();
}
