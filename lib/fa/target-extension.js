var TypeNode = Class.create({
	initialize: function (element, type, target, useSelf) {
		this.node = $(element);
		this.type = type;
		this.target = target;
		this.text = this.node.textContent; 
		this.hoverTarget = useSelf ? this.node : this.node.parentElement;
	},
	hide: function () {
		this.node.hide();
		return this;
	},
	show: function () {
		this.node.show();
		return this;
	},
	remove: function () {
		this.node.remove();
		return this;
	}
});

Target.addMethods({
	initialize: function (id) {
		this.id = id;
		this.tags = [];
		this.tagsContainer = html('span', {id: 'tags'});
		
		this.nodes = [];
		this.marked = false;
		this.hidden = false;
		this.blacklisted = false;
		this.whitelisted = false;
	},
	hasNode: function (node) {
		return this.nodes.some(function ($n) {
			return $n.node === node || $n === node;
		});
	},
	addNode: function (node, type, useSelf) {
		if (this.hasNode(node)) return;
		if (Object.isElement(node)) {
			node = new TypeNode(node, type, this, useSelf);
		}
		this.nodes.push(node);
		return node;
	},
	getNodes: function (type) {
		return this.nodes.filter(function (node) {
			switch (typeof type) {
				case 'string':
					return node.type == type;
				case 'object':
					return type.includes(node.type);
			}
			return true;
		});
	},
	updateNodes: function (options) {
		options = options || {};
		this.nodes.forEach(function (node) {
			if (options[node.type]) {
				node.hide();
			} else {
				node.show();
			}
		});
	},
	showNodes: function () {
		this.nodes.invoke('show');
	},
	hideNodes: function () {
		this.nodes.invoke('hide');
	},
	matchNodes: function (keywords, type) {
		if (!keywords.length) return;
		var regex = new RegExp(keywords.join('|'), 'i');
		return this.getNodes(type).pluck('text').reduce(function (matches, text) {
			var _matches = text.match(regex);
			if (_matches) {
				matches.push(Array.isArray(_matches) ? _matches[0] : _matches);
			}
			return matches;
		}, []);
	},
	
	mark: function (x) {
		if (!this.marked) {
			this.marked = true;
			this.hidden = (x === 'hidden');
			this.blacklisted = (typeof x === 'boolean') && x;
			this.whitelisted = (typeof x === 'boolean') && !x;
		}
		return this;
	},
	unmark: function () {
		this.marked = false;
		this.hidden = false;
		this.blacklisted = false;
		this.whitelisted = false;
		return this;
	},
	
	apply: function (data) {
		this.unmark();
		var options = {thumbnail:0,title:0,username:0,avatar:0,comment:0,link:0};
		if ('firstItem' in this && data.options.firstItem) {
			this.mark('hidden');
		} else {
			for (var ID in data.filters) {
				var filter = data.filters[ID];
				
				// skip disabled filters
				if (!filter.options.enabled || !this.hasTag(ID)) continue;
				
				// combine options
				for (var o in options) {
					options[o] |= filter.options[o];
				}
				
				if (filter.type) {
					this.mark(false);
					break; // whitelists take priority over blacklists to prevent ambiguity
				} else {
					this.mark(true);
				}
			}
		}
		
		if (this.blacklisted) {
			this.updateNodes(options);
		} else if (this.hidden) {
			this.hideNodes();
		} else {
			this.showNodes();
		}
	}
});

Submission.addMethods({
	getTitle: function () {
		try {
			return this.getNodes('title')[0].text;
		} catch (e) {
			// if no title node exists, use the ID
			return '#' + this.id;
		}
	}
});
