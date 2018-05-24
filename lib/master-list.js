List.initFromDocument();

var Page = {
	clear: function () {
		for (var name in Users) {
			delete Users[name];
		}
		for (var id in Submissions) {
			delete Submissions[name];
		}
		for (var ID in Filters) {
			delete Filters[ID];
		}
	},
	update: function (filters) {
		//Page.clear();
		for (var ID in filters) {
			Filters[ID] = new Filter(filters[ID]);
			Filters[ID].users.forEach(function (u) {
				Users[u] = u in Users ? Users[u] : new User(u);
				Users[u].addTag(ID);
			});
			Filters[ID].submissions.forEach(function (s) {
				Submissions[s] = s in Submissions ? Submissions[s] : new Submission(s);
				Submissions[s].addTag(ID);
			});
		}
		List.init(Users, Submissions);
	},
	apply: function (data, reply) {
		if (data) Page.update(data.filters);
		List.update(Users,Submissions);
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
		Page.apply();
		//Page.load.defer(); // avoid massive re-initialization
	},
	removeTargetFromFilter: function (target, ID) {
		target.removeTag(ID);
		Messenger.send('runtime', 'remove-from-filter', {
			filter: ID,
			target: target.id,
			type: target.type
		});
		Page.apply();
		//Page.load.defer(); // avoid massive re-initialization
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
		Page.apply();
		//Page.load.defer(); // avoid massive re-initialization
	},
	removeTargetsFromFilter: function (targets, ID) {
		var type;
		for (var id in targets) {
			targets[id].removeTag(ID);
			type = targets[id].type;
		}
		Messenger.send('runtime', 'remove-all-from-filter', {
			filter: ID,
			targets: Object.keys(targets),
			type: type
		});
		Page.apply();
		//Page.load.defer(); // avoid massive re-initialization
	}
};

Messenger.context = 'tabs';
Messenger.addListener('apply-reply', Page.apply);
window.addEventListener('focus', Page.load);
Page.load();
