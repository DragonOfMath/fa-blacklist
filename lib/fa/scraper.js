/*	scraper.js
	finds and returns users and submissions on the current FA web document
*/

if (!(User && Submission)) {
	throw 'Missing User and Submission.';
}

if (window.location.hostname !== 'www.furaffinity.net') {
	throw 'This is not a FurAffinity webpage.';
}

function scrape() {
	var users        = {};
	var submissions  = {};
	var loggedInName = '';
	var loggedInUser = null;
	var profileName  = '';
	var profileUser  = null;
	
	var USER_DIRS = ['user','commissions','gallery','scraps','journals','favorites','newpm'];
	var URL = parseURL(window.location.href);
	var SUBMISSION_LINK = 'a[href*="/view/"]';
	var USER_LINK       = 'a[href*="/user/"]';
	
	var body = document.body;
	
	function parseURL(url) {
		return url.match(/[^\\\/:#?]+/g);
	}
	function resolveUsername(object) {
		if (!object || (Object.isElement(object) && !object.href)) return '';
		var temp = parseURL(object.href||object.src||object);
		if (temp && USER_DIRS.includes(temp[2])) {
			return sanitizeUsername(temp[3]);
		}
		return '';
	}
	function resolveSubmission(object){
		if (!object || (Object.isElement(object) && !object.href)) return '';
		var id = object.href || object.src || object;
		try {
			return id.match(/\/view\/(\d+)/)[1];
		} catch (e) {
			return '';
		}
	}
	function sanitizeUsername(name) {
		return name.replace(/[^a-z0-9\~\-\.]/gi,'').toLowerCase();
	}
	function getUser(id) {
		return id in users ? users[id] : (users[id] = new User(id));
	}
	function getSubmission(id) {
		return id in submissions ? submissions[id] : (submissions[id] = new Submission(id));
	}
	
	function processLinks($link) {
		if (/[?#@]/.test($link.href) || ($link.innerHTML == 'News and Updates')) return;
		try {
			var name = resolveUsername($link);
			var id = resolveSubmission($link);
			if (name) {
				// create the User object or get it if it exists
				var user = getUser(name);
				
				// skip this element if it includes an avatar
				var $avatar = $link.firstElementChild;
				if (!($avatar && $avatar.hasClassName('avatar'))) {
					user.addNode($link, 'username');
				}
			} else if (id) {
				var sub = getSubmission(id);
				var $thumb = $link.querySelector('img');
				if ($thumb) {
					sub.addNode($link, 'link');
					sub.addNode($thumb, 'thumbnail');
				}
			}
		} catch (e) {
			console.error('Invalid link:', $link, e);
		}
	}
	function processThings($thing) {
		try {
			var name = sanitizeUsername($thing.textContent);
			users[name].addNode($thing, 'username');
		} catch (e) {
			console.error('Invalid username container:', $thing, e);
		}
	}
	function processAvatars($avatar) {
		try {
			var name = resolveUsername($avatar.parentElement);
			users[name].addNode($avatar, 'avatar');
		} catch (e) {
			console.error('Invalid avatar:', $avatar, e);
		}
	}
	function processComments($comment) {
		try {
			var name = resolveUsername($comment.querySelector('a'));
			// avoid using a large swath of the dom as the hover parent
			users[name].addNode($comment.firstElementChild, 'comment');
		} catch (e) {
			console.error('Invalid comment:', $comment, e);
		}
	}
	function processGalleryFigures($figure) {
		try {
			var $caption   = $figure.querySelector('figcaption');
			var $thumbnail = $figure.querySelector('img');//.parentElement;
			var $title     = $caption.querySelector(SUBMISSION_LINK);
			var id         = resolveSubmission($title);
			var submission = submissions[id];
			submission.addNode($thumbnail, 'thumbnail');
			submission.addNode($title, 'title');
			
			var $name = $caption.querySelector(USER_LINK);
			var name  = resolveUsername($name);
			var user  = users[name];
			user.addSubmission(submission);
		} catch (e) {
			console.error('Invalid figure:', $figure, e);
		}
	}
	function processProfileFigures($figure) {
		var $a = $figure.querySelector(SUBMISSION_LINK);
		var id = resolveSubmission($a);
		var submission = submissions[id];
		submission.addNode($figure, 'thumbnail', true);
		var $parent = $figure.parentElement;
		if ($parent.id == 'gallery-latest-favorites' || $parent.hasClassName('userpage-first-favorite')) {
			// faved submissions currently do not have an explicit artist name with them unfortunately
			//console.log($figure,'is a faved submission');
		} else if (profileUser) {
			// profile submissions belong to the profile user
			profileUser.addSubmission(submission);
			//console.log($figure,'is a user submission');
		}
	}
	function processSubmissionFigures($figure) {
		var $thumbnail = $figure.querySelector('img');
		var $a = $figure.querySelector(SUBMISSION_LINK);
		var id = resolveSubmission($a);
		var submission = getSubmission(id);
		submission.addNode($thumbnail, 'thumbnail', true);
		if (profileUser) {
			profileUser.addSubmission(submission);
		}
	}
	
	// build user and submission tables using the links
	body.select('a').forEach(processLinks);
	
	// parse things that aren't links but contain one's username
	body.select('li>div.info>span','b.replyto-name').forEach(processThings);
	
	// parse avatar images (all usernames should exist in the table); avatars are always wrapped in links
	body.select('img.avatar','img.comment_useravatar','a.iconusername>img').forEach(processAvatars);
	
	// parse comments and shouts (all usernames should exist in the table)
	body.select('table[id*="shout"]','table.container-comment','div.comment_container').forEach(processComments);
	
	// parse content figures
	var $contentItems = body.select('figure','b[id*="sid_"]','div.preview-gallery-container');
	switch(URL[2]) {
		case 'gallery':
		case 'scraps':
		case 'favorites':
			profileName = URL[3];
			profileUser = users[profileName];
		case undefined: // front page
		case 'browse':
		case 'search':
		case 'msg':
			// submissions with titles/by creators
			$contentItems.forEach(processGalleryFigures);
			break;
		case 'user':
			profileName = URL[3];
			profileUser = users[profileName];
			var $featuredSubmission  = body.select('td#featured-submission','div.aligncenter>'+SUBMISSION_LINK+'>img')[0];
			var $profileIdSubmission = body.select('td#profilepic-submission','div.section-submission')[0];
			var $firstSubmission     = body.select('center.userpage-first-submission>b')[0];
			var $firstFaveSubmission = body.select('center.userpage-first-favorite>b')[0];
			
			// profile submissions and favorites
			$contentItems.forEach(processProfileFigures);
			if ($featuredSubmission) {
				var $a = $featuredSubmission.querySelector('a') || $featuredSubmission.parentElement;
				var id = resolveSubmission($a);
				var submission = submissions[id];
				submission.addNode($featuredSubmission, 'thumbnail');
				profileUser.addSubmission(submission);
			}
			if ($profileIdSubmission) {
				var $a = $profileIdSubmission.querySelector(SUBMISSION_LINK) || $profileIdSubmission.parentElement;
				var id = resolveSubmission($a);
				var submission = submissions[id];
				submission.addNode($profileIdSubmission, 'thumbnail');
				profileUser.addSubmission(submission);
			}
			if ($firstSubmission) {
				var $a = $firstSubmission.querySelector(SUBMISSION_LINK);
				var id = resolveSubmission($a);
				var submission = submissions[id];
				submission.firstItem = true;
				submission.addNode($firstSubmission, 'thumbnail');
				profileUser.addSubmission(submission);
			}
			if ($firstFaveSubmission) {
				// TODO: find an easier way to hide this item more permanently
				var $thumbnail = $firstFaveSubmission.querySelector('img').parentElement;
				var $title     = $firstFaveSubmission.querySelector('span');//.firstChild
				var $a         = $firstFaveSubmission.querySelector(SUBMISSION_LINK);
				var id = resolveSubmission($a);
				var submission = submissions[id];
				submission.firstItem = true;
				submission.addNode($thumbnail, 'thumbnail');
				submission.addNode($title, 'title');
				
				var $name = $firstFaveSubmission.querySelector(USER_LINK);
				var name = resolveUsername($name);
				var user = users[name];
				user.addSubmission(submission);
			}
			break;
		case 'view':
		case 'full':
			var $submissionImg  = $('submissionImg');
			var $submissionTags = $('keywords');
			var id = URL[3];
			var submission = getSubmission(id);
			submission.addNode($submissionImg, 'thumbnail', true);
			submission.addNode($submissionTags, 'link');
			
			var $submissionOwner = body.select('td.cat>'+USER_LINK,'div.submission-title>span>a')[0];
			profileName = resolveUsername($submissionOwner);
			profileUser = users[profileName];
			profileUser.addSubmission(submission);
			
			// submission previews
			$contentItems.forEach(processSubmissionFigures);
			break;
	}
	
	var $loggedInUser = body.querySelector('a#my-username.hideonmobile,a#my-username');
	loggedInName  = resolveUsername($loggedInUser);
	
	// exclude logged in user from the main user list (it is still accessible)
	if (loggedInName) {
		loggedInUser = users[loggedInName];
		delete users[loggedInName];
		
		// exclude own submissions as well
		for (var sID in loggedInUser.submissions) {
			delete submissions[sID]
		}
	}
	
	//console.log(users, submissions, loggedInUser);
	
	return {
		users: users,
		submissions: submissions,
		logged_in_user: loggedInUser
	};
}
