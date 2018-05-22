var TypeNode = Class.create({
	initialize: function (element, type, target, useSelf) {
		this.node = $(element);
		this.type = type;
		this.text = this.node.textContent; 
		this.target = target;
		//this.dummy = html('span', {});
		
		var that = this;
		function updatePageWindow(e) {
			//$Window.goto(that.node, true); // this got annoying quickly
			$Window.update(that.target);
		}
		
		if (useSelf) {
			// TODO: create a placeholder to replace the element when it is hidden
			this.node.whenHovered(1500, updatePageWindow);
		} else {
			this.node.parentElement.whenHovered(1500, updatePageWindow);
		}
	},
	hide: function () {
		this.node.addClassName('hidden');
		return this;
	},
	show: function () {
		this.node.removeClassName('hidden');
		return this;
	},
	remove: function () {
		this.node.remove();
		return this;
	}
});
var Target = Class.create({
	initialize: function (id) {
		this.id = id;
		this.nodes = [];
		this.tags = [];
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
		return this;
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
	
	hasTag: function (tag) {
		return this.tags.includes(tag.id||tag);
	},
	addTag: function (tag) {
		if (!this.hasTag(tag)) {
			this.tags.push(tag.id||tag);
		}
	},
	removeTag: function (tag) {
		if (this.hasTag(tag)) {
			this.tags.splice(this.tags.indexOf(tag.id||tag), 1);
		}
	},
	updateTags: function (filters) {
		// placeholder
	},
	
	createLink: function () {
		return html('a', {href: '#'}, this.id); // placeholder
	},
	createTagElement: function (ID) {
		var target = this;
		var $tag = Filters[ID].createTag().whenClicked(function () {
			Filters[ID].edit();
		});
		var $remove = html('button', {}, 'x').addClassName('remove').whenClicked(function (e) {
			e.stopPropagation();
			$tag.remove();
			delete $tag;
			Page.removeTargetFromFilter(target, ID);
		});
		$tag.append($remove);
		return $tag;
	},
	createTagContainer: function () {
		var target = this;
		var $container = html('span', {id: 'tags'});
		this.tags.forEach(function (ID) {
			var $tag = target.createTagElement(ID);
			$container.appendChild($tag);
		});
		return $container;
	},
	createTableRow: function ($table) {
		var target = this;
		var $link      = this.createLink().addClassName('name');
		var $container = this.createTagContainer();
		var $dropdown  = html('select', {});
		
		var filters = {};
		for (var ID in Filters) {
			if (this.tags.includes(ID)) continue;
			filters[ID] = Filters[ID];
		}
		Utils.populateDropdown($dropdown, filters, '+');
		
		$dropdown.whenChanged(function () {
			var ID = $dropdown.value;
			if (ID) {
				// it's already gonna update the list so...
				//var $tag = target.createTagElement(ID);
				//$container.appendChild($tag);
				Page.addTargetToFilter(target, ID);
			}
			$dropdown.value = 'unselected';
		});
		var $row = html('div', {id: this.id}, [$link, $container, $dropdown]).addClassName('row');
		
		$table.appendChild($row);
		return $row;
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
				
				options = Utils.combine(options, filter.options);
				if (filter.type == Filter.WHITELIST) {
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
var User = Class.create(Target, {
	initialize: function ($super, id) {
		$super(id);
		this.type = 'user';
		this.submissions = {};
	},
	createLink: function () {
		var title = this.id;
		var url = window.location.protocol + '//' + window.location.hostname + '/user/' + this.id;
		var $a = html('a', {href: url, target: '_blank'}, title);
		return $a;
	},
	updateTags: function (filters) {
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
		return sub.id in this.submissions;
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
		var url = window.location.protocol + '//' + window.location.hostname + '/view/' + this.id;
		var $a = html('a', {href: url, target: '_blank'}, title);
		return $a;
	},
	// submissions inherit the tags of their user
	hasTag: function ($super, tag) {
		return $super(tag) || (this.user && this.user.hasTag(tag));
	},
	updateTags: function (filters) {
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
		try {
			return this.getNodes('title')[0].text;
		} catch (e) {
			// if no title node exists, use the ID
			return '#' + this.id;
		}
	}
});

var Users       = {};
var Submissions = {};
var Filters     = {}; // cache

var Page = {
	INITIAL_LOAD: true,
	LOGGED_IN_USER: null,
	USER_DIRS: [
		'user',
		'commissions',
		'gallery',
		'scraps',
		'journals',
		'favorites',
		'newpm'
	],
	clear: function () {
		for (var name in Users) {
			delete Users[name];
		}
		for (var id in Submissions) {
			delete Submissions[id];
		}
		for (var ID in Filters) {
			delete Filters[ID];
		}
	},
	getUser: function (name) {
		return name in Users ? Users[name] : (Users[name] = new User(name));
	},
	getSubmission: function (id) {
		return id in Submissions ? Submissions[id] : (Submissions[id] = new Submission(id));
	},
	/*
		traverse the document and find all of the useful nodes
	*/
	init: function () {
		function resolveUsername(object) {
			if (!object || (Object.isElement(object) && !object.href)) return '';
			var temp = Utils.parseURL(object.href||object.src||object);
			if (temp && Page.USER_DIRS.includes(temp[2])) return Utils.sanitizeUsername(temp[3]) || '';
			return '';
		}
		function resolveSubmission(object){
			if (!object || (Object.isElement(object) && !object.href)) return '';
			return Utils.sanitizeSubmissionID(object.href||object.src||object) || '';
		}
		function getFigureById(id) {
			return document.querySelector('figure[id="sid-'+id+'"]');
		}
		
		Page.clear();
		
		// build user and submission tables using the links
		$A(document.querySelectorAll('a')).filter(function (a) {
			return !(/[?#@]/.test(a.href) || (a.innerHTML == 'News and Updates'));
		}).forEach(function ($link) {
			try {
				var name = resolveUsername($link);
				var id = resolveSubmission($link);
				if (name) {
					// create the User object or get it if it exists
					var user = Page.getUser(name);
					
					// skip this element if it includes an avatar
					var $avatar = $link.firstElementChild;
					if (!($avatar && $avatar.hasClassName('avatar'))) {
						user.addNode($link, 'username');
					}
				} else if (id) {
					var sub = Page.getSubmission(id);
					var $thumb = $link.querySelector('img');
					if ($thumb) {
						sub.addNode($link, 'link');
						sub.addNode($thumb, 'thumbnail');
					}
				}
			} catch (e) {
				console.error('Invalid link:', $link, e);
			}
		});
		
		// parse things that aren't links but contain one's username
		$A(document.querySelectorAll('li>div.info,b.replyto-name')).forEach(function ($thing) {
			try {
				var name = Utils.sanitizeUsername($thing.textContent);
				Users[name].addNode($thing, 'username');
			} catch (e) {
				console.error('Invalid username container:', $thing, e);
			}
		});
		
		// parse avatar images (all usernames should exist in the table); avatars are always wrapped in links
		$A(document.querySelectorAll('img.avatar,img.comment_useravatar,a.iconusername>img')).forEach(function ($avatar) {
			try {
				var name = resolveUsername($avatar.parentElement);
				Users[name].addNode($avatar, 'avatar');
			} catch (e) {
				console.error('Invalid avatar:', $avatar, e);
			}
		});
		
		// parse comments and shouts (all usernames should exist in the table)
		$A(document.querySelectorAll('table[id*=\'shout\'],table.container-comment,div.comment_container')).forEach(function ($comment) {
			try {
				var name = resolveUsername($comment.querySelector('a'));
				// avoid using a large swath of the document as the hover parent
				Users[name].addNode($comment.firstElementChild, 'comment');
			} catch (e) {
				console.error('Invalid comment:', $comment, e);
			}
		});
		
		// parse content figures
		var $contentItems  = $A(document.querySelectorAll('figure,b[id*=\'sid_\'],div.preview-gallery-container'));
		switch(Utils.parseURL(window.location.href)[2]) {
			case undefined: // front page
			case 'browse':
			case 'search':
			case 'gallery':
			case 'scraps':
			case 'favorites':
			case 'msg':
				// submissions with titles/by creators
				$contentItems.forEach(function ($figure) {
					try {
						var $thumbnail = $figure.querySelector('img');//.parentElement;
						var $title     = $figure.querySelector('figcaption').querySelector('a[href*=\'view\']');
						var id         = resolveSubmission($title);
						var submission = Submissions[id];
						submission.addNode($thumbnail, 'thumbnail');
						submission.addNode($title, 'title');
						
						var $name = $figure.querySelector('figcaption').querySelector('a[href*=\'user\']');
						var name  = resolveUsername($name);
						var user  = Users[name];
						user.addSubmission(submission);
					} catch (e) {
						console.error('Invalid figure:', $figure, e);
					}
				});
				break;
			case 'user':
				var profileName          = resolveUsername(window.location);
				var profileUser          = Users[profileName];
				var $featuredSubmission  = document.querySelector('td#featured-submission,div.aligncenter>a[href*=\'view\']>img');
				var $profileIdSubmission = document.querySelector('td#profilepic-submission,div.section-submission');
				var $firstSubmission     = document.querySelector('center.userpage-first-submission>b');
				var $firstFaveSubmission = document.querySelector('center.userpage-first-favorite>b');
				
				// profile submissions and favorites
				$contentItems.forEach(function ($figure) {
					var $a = $figure.querySelector('a[href*=\'view\']');
					var id = resolveSubmission($a);
					var submission = Submissions[id];
					submission.addNode($figure, 'thumbnail', true);
					var $parent = $figure.parentElement;
					if ($parent.id == 'gallery-latest-favorites' || $parent.hasClassName('userpage-first-favorite')) {
						// faved submissions currently do not have an explicit artist name with them unfortunately
						//console.log($figure,'is a faved submission');
					} else {
						// profile submissions belong to the profile user
						profileUser.addSubmission(submission);
						//console.log($figure,'is a user submission');
					}
				});
				if ($featuredSubmission) {
					var $a = $featuredSubmission.querySelector('a') || $featuredSubmission.parentElement;
					var id = resolveSubmission($a);
					var submission = Submissions[id];
					submission.addNode($featuredSubmission, 'thumbnail');
					profileUser.addSubmission(submission);
				}
				if ($profileIdSubmission) {
					var $a = $profileIdSubmission.querySelector('a[href*=\'view\']') || $profileIdSubmission.parentElement;
					var id = resolveSubmission($a);
					var submission = Submissions[id];
					submission.addNode($profileIdSubmission, 'thumbnail');
					profileUser.addSubmission(submission);
				}
				if ($firstSubmission) {
					var $a = $firstSubmission.querySelector('a[href*=\'view\']');
					var id = resolveSubmission($a);
					var submission = Submissions[id];
					submission.firstItem = true;
					submission.addNode($firstSubmission, 'thumbnail');
					profileUser.addSubmission(submission);
				}
				if ($firstFaveSubmission) {
					// TODO: find an easier way to hide this item more permanently
					var $thumbnail = $firstFaveSubmission.querySelector('img').parentElement;
					var $title = $firstFaveSubmission.querySelector('span');//.firstChild
					var $a = $firstFaveSubmission.querySelector('a[href*=\'view\']');
					var id = resolveSubmission($a);
					var submission = Submissions[id];
					submission.firstItem = true;
					submission.addNode($thumbnail, 'thumbnail');
					submission.addNode($title, 'title');
					
					var $name = $firstFaveSubmission.querySelector('a[href*=\'user\']');
					var name = resolveUsername($name);
					var user = Users[name];
					user.addSubmission(submission);
				}
				break;
			case 'view':
			case 'full':
				var $submissionImg   = document.querySelector('#submissionImg');
				//var $submissionTags  = document.querySelector('#keywords');
				var id = resolveSubmission(window.location);
				var submission = Page.getSubmission(id);
				submission.addNode($submissionImg, 'thumbnail', true);
				//submission.addNode($submissionTags, 'title');
				
				var $submissionOwner = document.querySelector('td.cat>a[href*=\'user\'],div.submission-title>span>a');
				var name = resolveUsername($submissionOwner);
				var user = Users[name];
				user.addSubmission(submission);
				
				// submission previews
				$contentItems.forEach(function ($figure) {
					var $thumbnail = $figure.querySelector('img');
					var $a = $figure.querySelector('a[href*=\'view\']');
					var id = resolveSubmission($a);
					var submission = Page.getSubmission(id);
					submission.addNode($thumbnail, 'thumbnail', true);
					user.addSubmission(submission);
				});
				break;
		}
		
		var $loggedInUser    = document.querySelector('a#my-username.hideonmobile,a#my-username');
		var loggedInUsername = resolveUsername($loggedInUser);
		
		// exclude logged in user from the main user list (it is still accessible)
		if (loggedInUsername) {
			Page.LOGGED_IN_USER = Users[loggedInUsername];
			delete Users[loggedInUsername];
		}
		
		console.log('Logged in User:',Page.LOGGED_IN_USER);
		console.log('Users:',Users);
		console.log('Submissions:',Submissions);
		
		Page.load();
	},
	updateTags: function (filters) {
		//console.log('Updating existing tags');
		for (var name in Users) {
			Users[name].updateTags(filters);
		}
		for (var id in Submissions) {
			Submissions[id].updateTags(filters);
		}
	},
	cacheFilters: function (filters) {
		//console.log('Caching filters');
		for (var ID in Filters) delete Filters[ID];
		for (var ID in filters) Filters[ID] = new Filter(filters[ID]);
	},
	backToNormal: function () {
		console.log('Resetting page to normal');
		for (name in Users) Users[name].showNodes();
		for (id in Submissions) Submissions[id].showNodes();
	},
	scanContent: function (filters) {
		console.log('Scanning page content');
		
		var payload = {};
		for (var ID in filters) {
			var filter = filters[ID];
			
			// skip disabled filters
			if (!filter.options.enabled) continue;
			
			// do automatic search and filter
			payload[ID] = { users: [], submissions: [] };
			if (filter.options.matchTitle) {
				for (var id in Submissions) {
					var submission = Submissions[id];
					var user = submission.user;
					if (submission.hasTag(ID)) continue;
					var matches = submission.matchNodes(filter.keywords, 'title');
					if (matches && matches.length) {
						if (filter.options.sensitive) {
							payload[ID].users.push(user.id);
							user.addTag(ID);
							console.log('Added',user.id,'to',ID,'(Matched with:',matches,')');
						} else {
							payload[ID].submissions.push(submission.id);
							submission.addTag(ID);
							console.log('Added',submission.id,'to',ID,'(Matched with:',matches,')');
						}
					}
				}
			}
			if (filter.options.matchName) {
				for (var name in Users) {
					var user = Users[name];
					if (user.hasTag(ID)) continue;
					var matches = user.matchNodes(filter.keywords, 'username');
					if (matches && matches.length) {
						payload[ID].users.push(user.id);
						user.addTag(ID);
						console.log('Added',user.id,'to',ID,'(Matched with:',matches,')');
					}
				}
			}
		}
		
		return payload;
	},
	apply: function (data) {
		// show/hide by applying filter options (it's faster this way)
		for (var name in Users) {
			Users[name].apply(data);
		}
		for (var id in Submissions) {
			Submissions[id].apply(data);
		}
	},
	/*
		The main function for marking, hiding, and collecting filtered elements.
		If this is during the initialization, the received filters will apply existing tags to the User and Submission objects.
	*/
	main: function (data, reply) {
		Page.cacheFilters(data.filters);
		Page.updateTags(Filters);
		if (data.options.enabled) {
			if (Page.INITIAL_LOAD || data.options.alwaysScan) {
				reply(Page.scanContent(Filters));
				Page.INITIAL_LOAD = false;
			}
			Page.apply(data);
		} else {
			Page.backToNormal();
		}
		$Window.refresh();
	},
	load: function () {
		console.log('Loading filters');
		Messenger.send('runtime', 'apply');
	},
	addTargetToFilter: function (target, ID) {
		target.addTag(ID);
		Messenger.send('runtime', 'add-to-filter', {
			filter: ID,
			target: target.id,
			type: target.type
		});
		Page.load.defer();
	},
	removeTargetFromFilter: function (target, ID) {
		target.removeTag(ID);
		Messenger.send('runtime', 'remove-from-filter', {
			filter: ID,
			target: target.id,
			type: target.type
		});
		Page.load.defer();
	},
	addTargetsToFilter: function (targets, ID) {
		var type;
		for (var id in targets) {
			targets[id].addTag(ID);
			type = targets[id].type;
		}
		Messenger.send('runtime', 'add-all-to-filter', {
			filter: ID,
			targets: Object.keys(targets),
			type: type
		});
		Page.load.defer();
	},
	removeTargetsFromFilter: function (targets, ID) {
		var type;
		for (var id in targets) {
			targets[id].addTag(ID);
			type = targets[id].type;
		}
		Messenger.send('runtime', 'remove-all-from-filter', {
			filter: ID,
			targets: Object.keys(targets),
			type: type
		});
		Page.load.defer();
	}
};

var Utils = {
	parseURL: function (url) {
		return url.match(/[^\\\/\:]+/g);
	},
	combine: function (dest, src) {
		for (var o in dest) {
			dest[o] |= o in src ? src[o] : dest[o];
		}
		return dest;
	},
	sanitizeUsername: function (name) {
		return name ? name.replace(/[^a-z0-9\~\-\.]/gi,'').toLowerCase() : null;
	},
	sanitizeSubmissionID: function (id) {
		try {
			return id.match(/\/view\/(\d+)/)[1];
		} catch (e) {
			return '';
		}
	},
	populateDropdown: function ($d, filters, defaultText) {
		var $cancel = html('option', {value: ''}, defaultText || '(cancel)');
		$d.removeChildren();
		$d.appendChild($cancel);
		for (var ID in filters) {
			var $option = html('option', {value: filters[ID].id}, filters[ID].name);
			$d.appendChild($option);
		}
		$d.value = defaultText ? '' : 'unselected';
		return $d;
	}
};

/*
	Draggable window showing a table of all users/submissions currently found on the page
	
<div id="app-window">
	<div id="app-header">
		<h2 id="app-title">Page Contents</h2><button class="remove red">X</button>
	</div>
	<div id="app-body" class="group">
		<div id="search">
			<input type="textbox" id="searchbar" placeholder="Search...">
		</div>
		<div id="users-global">
			<h3>Users</h3>
			<select id="users-add-all"></select>
			<select id="users-remove-all"></select>
		</div>
		<div class="group fixed-height">
			<div id="target.id">
				<a class="name" href="/link/to/target">target.name</a>
				<span id="tags">
					...
				</span>
				<select id="tag-dropdown">
			</div>
		<div>
		<div id="submissions-global">
			<h3>Submissions</h3>
			<select id="submissions-add-all"></select>
			<select id="submissions-remove-all"></select>
		</div>
		<div class="group fixed-height">
			...
		<div>
	</div>
</div>
*/
var $Window = (function () {
	var $title  = html('h2', {id: 'app-title'}, 'Page Contents').addClassName('drag-handle');
	var $remove = html('button', {id: 'app-hide-window'}, '✖').addClassName('red');
	
	var $searchBar = html('input', {type: 'textbox', id: 'searchbar', placeholder: '🔎 Search...'});
	var $search    = html('div', {id: 'search'}, $searchBar);
	
	var $usersTitle  = html('h3', {}, 'Users');
	var $subsTitle   = html('h3', {}, 'Submissions');
	
	var $usersAddAllDropdown    = html('select', {id: 'users-add-all'}).whenChanged(function (e) {
		var ID = e.target.value;
		if (ID) {
			Page.addTargetsToFilter(Users, ID);
		}
		e.target.value = '';
	});
	var $usersRemoveAllDropdown = html('select', {id: 'users-remove-all'}).whenChanged(function (e) {
		var ID = e.target.value;
		if (ID) {
			Page.removeTargetsFromFilter(Users, ID);
		}
		e.target.value = '';
	});
	var $subsAddAllDropdown    = html('select', {id: 'submissions-add-all'}).whenChanged(function (e) {
		var ID = e.target.value;
		if (ID) {
			Page.addTargetsToFilter(Submissions, ID);
		}
		e.target.value = '';
	});
	var $subsRemoveAllDropdown = html('select', {id: 'submissions-remove-all'}).whenChanged(function (e) {
		var ID = e.target.value;
		if (ID) {
			Page.removeTargetsFromFilter(Submissions, ID);
		}
		e.target.value = '';
	});
	
	var $usersGlobal = html('div', {id: 'users-global'}, [$usersTitle, $usersAddAllDropdown, $usersRemoveAllDropdown]);
	var $subsGlobal  = html('div', {id: 'submissions-global'}, [$subsTitle, $subsAddAllDropdown, $subsRemoveAllDropdown]);
	
	var $tableUsers       = html('div', {id: 'users'}).addClassName('group').addClassName('fixed-height');
	var $tableSubmissions = html('div', {id: 'submissions'}).addClassName('group').addClassName('fixed-height');
	
	var $header = html('div', {id: 'app-header'}, [$title, $remove]).addClassName('drag-handle');
	var $body   = html('div', {id: 'app-body'},   [$search, $usersGlobal, $tableUsers, $subsGlobal, $tableSubmissions]);
	var $window = html('div', {id: 'app-window'}, [$header, $body]).addClassName('draggable').addClassName('drag-parent');
	
	Object.extend($window, {
		targetCache: null,
		update: function (targets) {
			//console.log(targets);
			$window.targetCache = targets;
			
			Utils.populateDropdown($usersAddAllDropdown, Filters, 'Add all...');
			Utils.populateDropdown($usersRemoveAllDropdown, Filters, 'Remove all...');
			
			Utils.populateDropdown($subsAddAllDropdown, Filters, 'Add all...');
			Utils.populateDropdown($subsRemoveAllDropdown, Filters, 'Remove all...');
			
			$tableUsers.removeChildren();
			$tableSubmissions.removeChildren();
			
			function addRow(obj) {
				if (obj.type == 'user') {
					obj.createTableRow($tableUsers);
					for (var sid in obj.submissions) {
						obj.submissions[sid].createTableRow($tableSubmissions);
					}
				} else {
					obj.createTableRow($tableSubmissions);
					if (obj.user && !$tableUsers.querySelector('tr#'+obj.user.id)) {
						obj.user.createTableRow($tableUsers);
					}
				}
			}
			
			if (targets.type) {
				addRow(targets);
			} else {
				for (var id in targets) {
					addRow(targets[id]);
				}
			}
			
			// placeholder for pages with no users/submissions
			if (!$tableUsers.firstElementChild) {
				$tableUsers.appendChild(html('span', {}, 'No users found...'));
			}
			if (!$tableSubmissions.firstElementChild) {
				$tableSubmissions.appendChild(html('span', {}, 'No submissions found...'));
			}
			
			$window.show();
		},
		refresh: function () {
			if ($window.targetCache) {
				$window.update($window.targetCache);
			}
		},
		search: function (text) {
			text = String(text).toLowerCase();
			$tableUsers.childElements().forEach(function ($row) {
				var user = Users[$row.id];
				if (!text || user.id.indexOf(text) > -1) {
					$row.removeClassName('hidden');
				} else {
					$row.addClassName('hidden');
				}
			});
			$tableSubmissions.childElements().forEach(function ($row) {
				var submission = Submissions[$row.id];
				var title = submission.getTitle();
				if (!text || submission.id.indexOf(text) > -1 || (title && title.toLowerCase().indexOf(text))) {
					$row.removeClassName('hidden');
				} else {
					$row.addClassName('hidden');
				}
			});
		},
		show: function () {
			$window.removeClassName('hidden');
		},
		hide: function () {
			$window.addClassName('hidden');
			$window.targetCache = null;
		}
	});
	
	// hide window when the 'x' is clicked
	$remove.whenClicked(function (e) {
		DragHandler.stop();
		$window.hide();
	});
	// update table when keys are entered in the search bar
	$searchBar.whenKeyPressed(function (e) {
		$window.search($searchBar.value);
	});
	
	$window.hide();
	return $window;
})();
// Add a root element for the app window and button
(function () {
	var $ShowWindowBtn = html('button', {id: 'app-show-window', title: 'Display page contents in list form'}, 'Blacklist')
	.whenClicked(function (e) {
		$Window.goto($ShowWindowBtn);
		$Window.update(Users);
	});
	var $App = html('div', {id: 'app'}, [$ShowWindowBtn, $Window]);
	document.body.appendChild($App);
})();

// final setup
Messenger.context = 'tabs';
Messenger.addListener('apply-reply', Page.main);
window.addEventListener('focus', Page.load);
Page.init();
