// globals
var Users       = {};
var Submissions = {};

var Target = Class.create({
	initialize: function (id) {
		this.id = id;
		this.tags = [];
		this.tagsContainer = html('span', {id: 'tags'});
	},
	getTagElement: function (tag) {
		return this.tagsContainer.querySelector('[id="'+tag+'"]');
	},
	hasTag: function (tag) {
		return this.tags.includes(tag);
	},
	addTag: function (tag) {
		//console.log(tag);
		if (this.hasTag(tag)) {
			var $tag = this.getTagElement(tag);
			Filters[tag].updateTag($tag);
			return $tag;
		} else {
			this.tags.push(tag);
			
			var target = this;
			var $tag = Filters[tag].createTag();
			this.tagsContainer.appendChild($tag);
			return $tag;
		}
	},
	removeTag: function (tag) {
		//console.log(tag);
		if (this.hasTag(tag)) {
			this.tags.splice(this.tags.indexOf(tag), 1);
			
			var $tag = this.getTagElement(tag);
			if ($tag) $tag.remove();
			return $tag;
		} else {
			return null;
		}
	},
	updateTags: function (filters) {
		// placeholder
	},
	createLink: function () {
		return html('a', {href: '#'}, this.id); // placeholder
	}
});

var User = Class.create(Target, {
	initialize: function ($super, id) {
		$super(id);
		this.type = 'user';
		this.submissions = {};
	},
	createLink: function () {
		var url = 'http://www.furaffinity.net/user/' + this.id;
		var $a = html('a', {href: url, target: '_blank'}, this.id).addClassName('name');
		return $a;
	},
	updateTags: function (filters) {
		var deletedTags = this.tags.filter(function (ID) {
			return !(ID in filters);
		});
		for (var i = 0; i < deletedTags.length; i++) {
			this.removeTag(deletedTags[i]);
		}
		for (var ID in filters) {
			var filter = filters[ID];
			if (filter.hasUser(this.id)) {
				this.addTag(ID);
			} else {
				this.removeTag(ID);
			}
		}
	},
	hasSubmission: function (sub) {
		return this.submissions.hasOwnProperty(sub.id || sub);
	},
	addSubmission: function (sub) {
		if (!this.hasSubmission(sub)) {
			this.submissions[sub.id] = sub;
			sub.user = this;
		}
	}
});

var Submission = Class.create(Target, {
	initialize: function ($super, id) {
		$super(id);
		this.type = 'submission';
		this.user = null;
	},
	createLink: function () {
		var title = this.getTitle();
		var url = 'http://www.furaffinity.net/view/' + this.id;
		var $a = html('a', {href: url, target: '_blank'}, title).addClassName('name');
		return $a;
	},
	// submissions inherit the tags of their user
	hasTag: function ($super, tag) {
		return $super(tag) || (this.user && this.user.hasTag(tag));
	},
	updateTags: function (filters) {
		var deletedTags = this.tags.filter(function (ID) {
			return !(ID in filters);
		});
		for (var i = 0; i < deletedTags.length; i++) {
			this.removeTag(deletedTags[i]);
		}
		for (var ID in filters) {
			var filter = filters[ID];
			if (filter.hasSubmission(this.id)) {
				this.addTag(ID);
			} else {
				this.removeTag(ID);
			}
		}
	},
	getTitle: function () {
		return '#' + this.id;
	}
});

