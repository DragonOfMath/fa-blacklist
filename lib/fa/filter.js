// globals
var Filters = {};

var Filter = Class.create({
	initialize: function (data) {
		data = data || {};
		if (typeof(data.contents) !== 'undefined') {
			data.users = data.contents;
			delete data.contents;
		}
		
		this.id     = typeof(data.id)     === 'string'    ? data.id     : Filter.generateID();
		this.name   = typeof(data.name)   === 'string'    ? data.name   : Filter.DEFAULT_NAME;
		this.color  = typeof(data.color)  === 'string'    ? data.color  : Filter.DEFAULT_COLOR;
		this.tcolor = typeof(data.tcolor) === 'string'    ? data.tcolor : Filter.DEFAULT_TEXT_COLOR;
		this.type   = typeof(data.type)   !== 'undefined' ? data.type   : Filter.BLACKLIST;
		
		if (typeof data.users === 'string') {
			this.users = data.users.split(/\s+/);
		} else if (typeof data.users === 'object' && data.users.length) {
			this.users = data.users;
		} else {
			this.users = [];
		}
		
		if (typeof data.submissions === 'string') {
			this.submissions = data.submissions.split(/\s+/);
		} else if (typeof data.submissions === 'object' && data.submissions.length) {
			this.submissions = data.submissions;
		} else {
			this.submissions = [];
		}
		
		if (typeof data.keywords === 'string') {
			this.keywords = data.keywords.split('\n');
		} else if (typeof data.keywords === 'object' && data.keywords.length) {
			this.keywords = data.keywords;
		} else {
			this.keywords = [];
		}
		
		this.options = {};
		for (var o in Filter.DEFAULT_OPTIONS) {
			this.options[o] = o in data.options ? data.options[o] : Filter.DEFAULT_OPTIONS[o];
		}
	},
	size: function () {
		return this.users.length + this.submissions.length;
	},
	getURL: function () {
		return browser.runtime.getURL('editor.html') + '#' + this.id;
	},
	edit: function () {
		if (browser && browser.tabs) {
			browser.tabs.create({
				url: this.getURL()
			});
		} else {
			window.open(this.getURL(), '_blank');
		}
	},
	createTag: function () {
		var $text = html('span', {}, this.name).addClassName('text');
		var $tag = html('span', {}, $text);
		return this.updateTag($tag);
	},
	updateTag: function ($tag) {
		var enabled = this.options.enabled;
		var auto    = this.options.matchTitle || this.options.matchName;
		var id      = this.id;
		var name    = this.name;
		var color   = this.color;
		var tcolor  = this.tcolor;
		var title   = name + (enabled ? '' : ' (disabled)');
		
		$tag.addClassName('tag');
		$tag.setAttribute('id', id);
		$tag.setAttribute('title', title);
		$tag.setStyle({
			backgroundColor: color,
			borderColor: color,
			color: tcolor
		});
		$tag.querySelector('.text').textContent = name;
		if (enabled) {
			$tag.removeClassName('disabled');
		} else {
			$tag.addClassName('enabled');
		}
		if (enabled && auto) {
			$tag.addClassName('auto');
		} else {
			$tag.removeClassName('auto');
		}
		// a <button.remove> can be appended later
		return $tag;
	},
	
	hasUser: function (user) {
		return this.users.includes(user);
	},
	addUser: function (user) {
		if (!this.hasUser(user)) {
			this.users.push(user);
		}
		return this;
	},
	removeUser: function (user) {
		if (this.hasUser(user)) {
			this.users.splice(this.users.indexOf(user), 1);
		}
		return this;
	},
	addUsers: function (users) {
		var filter = this;
		if (Object.isArray(users)) {
			users.forEach(function (user) {
				filter.addUser(user);
			});
		} else {
			for (var user in users) {
				filter.addUser(user);
			}
		}
		return this;
	},
	removeUsers: function (users) {
		var filter = this;
		if (Object.isArray(users)) {
			users.forEach(function (user) {
				filter.removeUser(user);
			});
		} else {
			for (var user in users) {
				filter.removeUser(user);
			}
		}
		return this;
	},
	
	hasSubmission: function (submission) {
		return this.submissions.includes(submission);
	},
	addSubmission: function (submission) {
		if (!this.hasSubmission(submission)) {
			this.submissions.push(submission);
		}
		return this;
	},
	removeSubmission: function (submission) {
		if (this.hasSubmission(submission)) {
			this.submissions.splice(this.submissions.indexOf(submission), 1);
		}
		return this;
	},
	addSubmissions: function (submissions) {
		var filter = this;
		if (Object.isArray(submissions)) {
			submissions.forEach(function (submission) {
				filter.addSubmission(submission);
			});
		} else {
			for (var submission in submissions) {
				filter.addSubmission(submission);
			}
		}
		return this;
	},
	removeSubmissions: function (submissions) {
		var filter = this;
		if (Object.isArray(submissions)) {
			submissions.forEach(function (submission) {
				filter.removeSubmission(submission);
			});
		} else {
			for (var submission in submissions) {
				filter.removeSubmission(submission);
			}
		}
		return this;
	}	
});
Filter.DEFAULT_NAME       = 'my filter';
Filter.DEFAULT_COLOR      = '#ff0000';
Filter.DEFAULT_TEXT_COLOR = '#ffffff';
Filter.DEFAULT_OPTIONS    = {
	enabled:   true,  // enables the filter
	
	username:  true,  // hide usernames
	avatar:    true,  // hide avatars
	comment:   true,  // hide comments
	thumbnail: true,  // hide thumbnails
	title:     true,  // hide titles
	link:      true,  // hide misc links
	
	matchTitle: false, // enable auto-filtering of submissions based on titles
	matchName:  false, // enable auto-filtering of users based on usernames
	sensitive:  false  // prefer filtering users instead of individual submissions
};
Filter.BLACKLIST = 0;
Filter.WHITELIST = 1;
Filter.generateID = function () {
	return Date.now().toString(16); // TODO: generate a UUID instead?
};
