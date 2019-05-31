// ==UserScript==
// @author      DragonOfMath
// @name        FA Blacklist
// @namespace   FABlacklist
// @description UserScript implementation of the FA blacklist web extension.
// @include     http://www.furaffinity.net/*
// @include     https://www.furaffinity.net/*
// @version     2.00
// @grant       GM.setValue
// @grant       GM.getValue
// @grant       GM.deleteValue
// @grant       GM.listValues
// @require     https://ajax.googleapis.com/ajax/libs/prototype/1.7.3.0/prototype.js
// ==/UserScript==

var VERSION = '2.00';
var SOURCE_URL = 'https://github.com/DragonOfMath/fa-blacklist-webext';

// ===== Prototype Extensions =====

Object.extend(Object, (function () {
	function has(object, prop) {
		return prop in object && Object.prototype.hasOwnProperty.call(object, prop);
	}
	function is(object, type) {
		return typeof object === type;
	}
	function isInstanceOf(object, Class) {
		return object instanceof Class;
	}
	
	function isNull(object) {
		return object === null;
	}
	function isObject(object) {
		return is(object, 'object') && !isNull(object);
	}
	function isDefined(object) {
		return !Object.isUndefined(object) && !isNull(object);
	}
	function isConstructor(object) {
		return Object.isFunction(object) && object.prototype && object.prototype.constructor === object;
	}
	function isPrototype(object) {
		return isObject(object) && object.constructor && object.constructor.prototype === object;
	}
	function isEnumerable(object) {
		return Object.isArray(object) || Object.isString(object) || isObject(object);
	}
	
	function getConstructor(srcObj) {
		if (isConstructor(srcObj)) {
			return srcObj;
		} else if (isPrototype(srcObj) || isObject(srcObj)) {
			return srcObj.constructor;
		} else {
			return null;
		}
	}
	function getSuper(srcClass) {
		srcClass = getConstructor(srcClass);
		if (isNull(srcClass)) {
			return Prototype.K;
		} else {
			return srcClass.prototype.__proto__.constructor;
		}
	}
	function getPrototype(srcObj) {
		if (isConstructor(srcObj)) {
			return Object.getPrototypeOf(srcObj);
		} else if (isPrototype(srcObj)) {
			return srcObj;
		} else if(isObject(srcObj)) {
			return srcObj.prototype;
		} else {
			return {};
		}
	}
	function setPrototype(destObj, srcObj) {
		var obj = getConstructor(destObj);
		var proto = getPrototype(srcObj);
		//obj.__proto__ = proto; // I'm told not to do this...
		Object.setPrototypeOf(obj, proto);
		return destObj;
	}
	
	return {
		has:           has,
		is:            is,
		isInstanceOf:  isInstanceOf,
		
		isNull:        isNull,
		isObject:      isObject,
		isDefined:     isDefined,
		isConstructor: isConstructor,
		isPrototype:   isPrototype,
		isEnumerable:  isEnumerable,
		
		getConstructor: getConstructor,
		getSuper:       getSuper,
		getPrototype:   getPrototype,
		setPrototype:   setPrototype
	};
})());
Object.extend(Function, (function () {
	var slice = Array.prototype.slice;
	// returns the rest parameters for a function's arguments object
	function rest(args) {
		return slice.call(args, args.callee.length);
	}
	// "spreads" all array arguments and returns a flattened array
	function spread(args) {
		var single = [];
		for (var i = 0, len = args.length; i < len; ++i) {
			if (Object.isArray(args[i])) {
				single = single.concat(args[i]);
			} else {
				single.push(args[i]);
			}
		}
		return single;
	}
	// curry the function using array arguments
	function spreadify(fn) {
		return Function.prototype.curry.apply(fn, spread(rest(arguments)));
	}
	
	return {
		rest:      rest,
		spread:    spread,
		spreadify: spreadify
	};
})());
Object.extend(Array, (function () {
	function flatten() {
		return $A(arguments).flatten();
	}
	
	return {
		flatten: flatten
	};
})());
Object.extend(Array.prototype, (function () {
	var uniq      = Array.prototype.uniq;
	var compact   = Array.prototype.compact;
	var intersect = Array.prototype.intersect;
	var without   = Array.prototype.without;
	var include   = Array.prototype.include;
	
	function union() {
		var array = Array.flatten($A(arguments));
		var u = this.slice();
		array.forEach(function (e) {
			if (!u.includes(e)) u.push(e);
		});
		return u;
	}
	function remove(x) {
		this.splice(x,1);
		return this;
	}
	function count(callback) {
		var c = 0;
		for (var i in this) {
			if (Object.has(this, i) && callback(this[i])) c++;
		}
		return c;
	}
	function invoke(callback) {
		var args = Function.rest(arguments);
		this.forEach(function (elem, idx) {
			elem[callback] && elem[callback].apply(elem, args);
		});
		return this;
	}
	function pluck(prop) {
		return this.map(function (elem) {
			return elem[prop];
		});
	}
	function reduce(callback, accumulator) {
		this.forEach(function(x, i) {
			var temp = callback.call(this, accumulator, x, i);
			if (temp) accumulator = temp;
		});
		return accumulator;
	}
	function swap(a,b) {
		var temp = this[a];
		this[a] = this[b];
		this[b] = temp;
		return this;
	}
	
	return {
		unique:   uniq,
		purify:   compact,
		common:   intersect,
		diff:     without,
		union:    union,
		includes: include,
		
		remove:   remove,
		count:    count,
		invoke:   invoke,
		pluck:    pluck,
		reduce:   reduce,
		swap:     swap
	};
})());
Object.extend(Math, (function () {
	function minmax(x, min, max) {
		return Math.max(min || 0, Math.min(x, max));
	}
	function randflt(min, max) {
		return min + (max - min) * Math.random();
	}
	function randint(min, max) {
		return Math.round(min + (max - min) * Math.random());
	}
	
	return {
		minmax:  minmax,
		randflt: randflt,
		randint: randint
	};
})());
Object.extend(Element.prototype, (function () {
	var fire    = Element.prototype.fire;
	var observe = Element.prototype.observe;
	
	// nevermind, these already exist
	function show() {
		return this.style.display = '';
	}
	function hide() {
		return this.style.display = 'none';
	}
	function find(selector) {
		return this.select(selector)[0];
	}
	function enable() {
		this.removeAttribute('disabled');
	}
	function disable() {
		this.setAttribute('disabled','');
	}
	function append() {
		var e = this;
		$A(arguments).forEach(function(x) {
			if (Object.isElement(x)) {
				e.appendChild(x);
			} else if (Object.isObject(x) && x.tag) {
				e.appendChild(html(x));
			} else {
				e.appendChild(text(x));
			}
		});
		return this;
	}
	function prepend() {
		var e = this;
		$(arguments).forEach(function(x) {
			if (Object.isElement(x)) {
				e.insertBefore(x,e.firstElementChild);
			} else if (Object.isObject(x) && x.tag) {
				e.insertBefore(html(x),e.firstElementChild);
			} else {
				e.insertBefore(text(x),e.firstElementChild);
			}
		});
		return this;
	}
	function appendTo(e) {
		this.remove();
		e.append(this);
		return this;
	}
	function removeChildren() {
		while (this.lastChild) {
			this.lastChild.remove();
		}
		return this;
	}
	function destroy() {
		this.purge();
		this.remove();
		return this;
	}
	
	function setInnerHTML(x) {
		this.innerHTML = x;
		return this;
	}
	function setTextContent(x) {
		this.textContent = x;
		return this;
	}
	function setProperty(k, v) {
		if (k == 'style' && Object.isObject(v)) {
			for (var c in v) {
				this.setStyleProperty(c,v[c]);
			}
		} else {
			this.setAttribute(k, v);
		}
		return this;
	}
	function setProperties(keys) {
		for (var k in keys) {
			this.setProperty(k,keys[k]);
		}
		return this;
	}
	function setStyleProperty(k, v, noVendor) {
		this.style[k] = v;
		if (!noVendor) {
			this.style['-o-'+k] = v;
			this.style['-ms-'+k] = v;
			this.style['-moz-'+k] = v;
			this.style['-webkit-'+k] = v;
		}
		return this;
	}
	function appendAsProperty(k, e) {
		return this.setProperty(k, e).append(e);
	}
	function replaceClassName(c0, c1) {
		this.removeClassName(c0);
		this.addClassName(c1);
		return this;
	}
	function serialize() {
		var o = {};
		if (this.childNodes.length > 0) {
			var temp = o;
			if (this.id) {
				temp = o[this.id] = {};
			}
			Object.extend(temp, this.childNodes.map(function(e) {
				return e.serialize();
			}));
		} else if (this.id) {
			o[this.id] = this.data || this.checked || this.value || this.textContent;
		}
		return o;
	}
	
	function position(noScrollOffset) {
		var pos = {x: 0, y: 0};
		if (this.offsetParent) {
			(pos = this.offsetParent.position());
		}
		pos.x += this.offsetLeft;
		pos.y += this.offsetTop;
		if (noScrollOffset) {
			pos.x -= window.scrollX;
			pos.y -= window.scrollY;
		}
		//console.log(this,pos);
		return pos;
	}
	function move(dx, dy) {
		var pos = this.position();
		this.style.left = (pos.x + dx) + 'px';
		this.style.top  = (pos.y + dy) + 'px';
		return this;
	}
	function goto(pos, noScrollOffset) {
		if (Object.isElement(pos)) {
			pos = pos.position(noScrollOffset);
		}
		this.style.position = 'fixed';
		this.style.left = pos.x + 'px';
		this.style.top  = pos.y + 'px';
		return this;
	}
	function isOffScreen() {
		var rect = this.getBoundingClientRect();
		return ((rect.x+rect.width)<0||(rect.y+rect.height)<0||(rect.x>window.innerWidth||rect.y>window.innerHeight));
	}
	function keepOnScreen() {
		var rect = this.getBoundingClientRect();
		var dx = (rect.left < 0) ? -rect.left : Math.min(0, window.innerWidth - rect.right);
		var dy = (rect.top  < 0) ? -rect.top  : Math.min(0, window.innerHeight - rect.bottom);
		return this.move(dx,dy);
	}
	function addScrollBars(maxw ,maxh) {
		if (maxw) {
			this.style.overflowX = 'scroll';
			this.style.maxWidth  = '' + maxw + 'px';
		}
		if (maxh) {
			this.style.overflowY = 'scroll';
			this.style.maxHeight = '' + maxh + 'px';
		}
		return this;
	}
	
	function makeHandler(context, callback, args) {
		return Function.spreadify(callback.bindAsEventListener, context, args).call(callback);
	}
	function whenSubmitted(callback) {
		var args = Function.rest(arguments);
		return this.observe('submit', makeHandler(this, callback, args));
	}
	function whenClicked(callback) {
		var args = Function.rest(arguments);
		return this.observe('click', makeHandler(this, callback, args));
	}
	function whenRightClicked(callback) {
		var args = Function.rest(arguments);
		callback = makeHandler(this, callback, args);
		return this.observe('click', function (e) {
			if (('which' in e && e.which == 3) || ('button' in e && e.button == 2)) {
				callback(e);
			}
		});
	}
	function whenChanged(callback) {
		var args = Function.rest(arguments);
		return this.observe('change', makeHandler(this, callback, args));
	}
	function whenInputChanged(callback) {
		var args = Function.rest(arguments);
		return this.observe('input', makeHandler(this, callback, args));
	}
	function whenKeyPressed(callback) {
		var args = Function.rest(arguments);
		return this.observe('keyup', makeHandler(this, callback, args));
	}
	function whenMouseEnter(callback) {
		var args = Function.rest(arguments);
		return this.observe('mouseenter', makeHandler(this, callback, args));
	}
	function whenMouseExit(callback) {
		var args = Function.rest(arguments);
		return this.observe('mouseleave', makeHandler(this, callback, args));
	}
	function whenMouseDown(callback) {
		var args = Function.rest(arguments);
		return this.observe('mousedown', makeHandler(this, callback, args));
	}
	function whenMouseMove(callback) {
		var args = Function.rest(arguments);
		return this.observe('mousemove', makeHandler(this, callback, args));
	}
	function whenMouseUp(callback) {
		var args = Function.rest(arguments);
		return this.observe('mouseup', makeHandler(this, callback, args));
	}
	function whenFocused(callback) {
		var args = Function.rest(arguments);
		return this.observe('focus', makeHandler(this, callback, args));
	}
	function whenBlurred(callback) {
		var args = Function.rest(arguments);
		return this.observe('blur', makeHandler(this, callback, args));
	}
	// custom event listener for when cursor hovers over an element for a set time without moving
	function whenHovered(delay, callback) {
		var $e = this;
		var timeoutID;
		var inside = false;
		this.whenMouseEnter(function (e) {
			inside = true;
		});
		this.whenMouseExit(function (e) {
			clearTimeout(timeoutID);
			inside = false;
		});
		this.whenMouseMove(function (e) {
			clearTimeout(timeoutID);
			timeoutID = setTimeout(function () {
				callback.call($e, e);
			}, delay);
		});
		return this;
	}
	
	function addStyleTransition(event, style, time, transitionType, x0, x1) {
		var e = this;
		var t0 = function() {
			e.style[style] = x0;
		};
		var t1 = function() {
			e.style[style] = x1;
		};
		this.setStyleProperty(style,x0);
		this.setStyleProperty('transition',style + ' ' + time + 'ms ' + transitionType);
		switch (event) {
			case 'focus':
				this.whenFocused(t1).whenBlurred(t0);
				break;
			case 'hover': 
				this.whenMouseEnter(t1).whenMouseExit(t0);
				break;
			case 'active':
				this.whenMouseDown(t1).whenMouseUp(t0);
				break;
			case 'checked':
				this.whenChanged(function() {
					if (this.checked || this.value) t1();
					else t0();
				});
				break;
			case 'disabled':
				break;
			case 'empty':
				break;
		}
		return this;
	}
	function addFocusStyleTransition(style, time, transitionType, x0, x1) {
		return this.addStyleTransition('focus',style,time,transitionType,x0,x1);
	}
	function addHoverStyleTransition(style, time, transitionType, x0, x1) {
		return this.addStyleTransition('hover',style,time,transitionType,x0,x1);
	}
	function addActiveStyleTransition(style, time, transitionType, x0, x1) {
		return this.addStyleTransition('active',style,time,transitionType,x0,x1);
	}
	function addCheckedStyleTransition(style, time, transitionType, x0, x1) {
		return this.addStyleTransition('checked',style,time,transitionType,x0,x1);
	}
	
	return {
		find:             find,
		enable:           enable,
		disable:          disable,
		append:           append,
		prepend:          prepend,
		appendTo:         appendTo,
		removeChildren:   removeChildren,
		destroy:          destroy,
		setInnerHTML:     setInnerHTML,
		setTextContent:   setTextContent,
		setProperty:      setProperty,
		setProperties:    setProperties,
		appendAsProperty: appendAsProperty,
		replaceClassName: replaceClassName,
		serialize:        serialize,
		
		position:         position,
		move:             move,
		goto:             goto,
		isOffScreen:      isOffScreen,
		keepOnScreen:     keepOnScreen,
		addScrollBars:    addScrollBars,
		
		emit:             fire,
		when:             observe,
		whenSubmitted:    whenSubmitted,
		whenClicked:      whenClicked,
		whenRightClicked: whenRightClicked,
		whenChanged:      whenChanged,
		whenInputChanged: whenInputChanged,
		whenKeyPressed:   whenKeyPressed,
		whenMouseEnter:   whenMouseEnter,
		whenMouseExit:    whenMouseExit,
		whenMouseMove:    whenMouseMove,
		whenMouseDown:    whenMouseDown,
		whenMouseUp:      whenMouseUp,
		whenFocused:      whenFocused,
		whenBlurred:      whenBlurred,
		whenHovered:      whenHovered,
		
		addStyleTransition:        addStyleTransition,
		addFocusStyleTransition:   addFocusStyleTransition,
		addHoverStyleTransition:   addHoverStyleTransition,
		addActiveStyleTransition:  addActiveStyleTransition,
		addCheckedStyleTransition: addCheckedStyleTransition
	};
})());


// ===== Locales =====

var LOCALES = {
	'en-us': {
		"extensionName": {
			"message": "FurAffinity Blacklist",
			"description": "Name of the extension."
		},
		"extensionDescription": {
			"message": "Interface modules for filtering content across FurAffinity",
			"description": "Description of the extension."
		},
		
		"blacklist": {
			"message": "Blacklist",
			"description": "Generic use word for 'blacklist'."
		},
		"whitelist": {
			"message": "Whitelist",
			"description": "Generic use word for 'whitelist'."
		},
		"filters": {
			"message": "Filters",
			"description": "Generic use word for 'filter'."
		},
		"users": {
			"message": "Users",
			"description": "Generic use word for 'users'."
		},
		"submissions": {
			"message": "Submissions",
			"description": "Generic use word for 'submissions'."
		},
		"keywords": {
			"message": "Keywords",
			"description": "Generic use word for 'keywords'."
		},
		"options": {
			"message": "Options",
			"description": "Generic use word for 'options'."
		},
		"random": {
			"message": "Random",
			"description": "Generic use word for 'random'."
		},
		
		"searchPlaceholder": {
			"message": "🔎 Search...",
			"description": "Placeholder text for any search bar."
		},
		"filtersPlaceholder": {
			"message": "No filters found...",
			"description": "Placeholder text when there are no filters to display."
		},
		"usersPlaceholder": {
			"message": "No users found...",
			"description": "Placeholder text when there are no users to display."
		},
		"submissionsPlaceholder": {
			"message": "No submissions found...",
			"description": "Placeholder text when there are no submissions to display."
		},
		
		"confirmDiscard": {
			"message": "Changes you made to $filter$ are unsaved. Save now?",
			"description": "Confirmation dialog text when a filter has changes but is not saved.",
			"placeholders": {
				"filter": {
					"content": "$1",
					"default": "this filter"
				}
			}
		},
		"confirmDelete": {
			"message": "Are you sure you want to delete $filter$? This action cannot be undone.",
			"description": "Confirmation dialog text when the user clicks a delete button for a filter.",
			"placeholders": {
				"filter": {
					"content": "$1",
					"default": "this filter"
				}
			}
		},
		"confirmEraseData": {
			"message": "Are you sure you want to erase all data for this extension?",
			"description": "Confirmation dialog text when the user wants to purge all extension data."
		},
		"promptUsername": {
			"message": "Enter a username:",
			"description": ""
		},
		
		"popupTitle": {
			"message": "FurAffinity Blacklist ",
			"description": "Title text of the popup."
		},
		"popupToggleApp": {
			"message": "Toggle this extension on/off",
			"description": "Title text for the popup power button."
		},
		"popupNewFilter": {
			"message": "+ New Filter",
			"description": "Text for the popup filter button."
		},
		"popupMasterList": {
			"message": "Master List",
			"description": "Text for the popup master list button."
		},
		"popupOptions": {
			"message": "Options",
			"description": "Text for the popup options button."
		},
		"popupLove": {
			"message": "Made with ❤",
			"description": "Text for the popup footer."
		},
		"popupToggleFilter": {
			"message": "Toggle $filter$ on/off",
			"description": "Title text for toggle switches on the popup.",
			"placeholders": {
				"filter": {
					"content": "$1",
					"default": "this filter"
				}
			}
		},
		"popupRemoveFilter": {
			"message": "Remove $filter$",
			"description": "Title text for the delete button next to each filter on the popup.",
			"placeholders": {
				"filter": {
					"content": "$1",
					"default": "this filter"
				}
			}
		},
		
		"editorNewText": {
			"message": "New",
			"description": "Text on new filter button in the editor."
		},
		"editorNewTitle": {
			"message": "Make a new filter",
			"description": "Tooltip text for the new filter button in the editor."
		},
		"editorSaveText": {
			"message": "Save",
			"description": "Text on save filter button in the editor."
		},
		"editorSaveTitle": {
			"message": "Save current filter",
			"description": "Tooltip text for the save filter button in the editor."
		},
		"editorCopyText": {
			"message": "Save as Copy",
			"description": "Text on copy filter button in the editor."
		},
		"editorCopyTitle": {
			"message": "Save a copy of the current filter",
			"description": "Tooltip text for the copy filter button in the editor."
		},
		"editorLoadText": {
			"message": "Load",
			"description": "Text on load filter button in the editor."
		},
		"editorLoadTitle": {
			"message": "Load a saved filter",
			"description": "Tooltip text for the load filter button in the editor."
		},
		"editorDeleteText": {
			"message": "Delete",
			"description": "Text on delete filter button in the editor."
		},
		"editorDeleteTitle": {
			"message": "Delete the current filter and clear the editor",
			"description": "Tooltip text for the delete filter button in the editor."
		},
		"editorImportText": {
			"message": "📤 Import",
			"description": "Text on import filter button in the editor."
		},
		"editorImportTitle": {
			"message": "Import a filter from your computer",
			"description": "Tooltip text for the import filter button in the editor."
		},
		"editorExportText": {
			"message": "📥 Export",
			"description": "Text on export filter button in the editor."
		},
		"editorExportTitle": {
			"message": "Export this filter to your computer",
			"description": "Tooltip text for the export filter button in the editor."
		},
		"editorSelectFilter": {
			"message": "Select a filter...",
			"description": "Text preceding the filter selection dropdown in the editor."
		},
		"editorTitle": {
			"message": "Filter Editor",
			"description": "Title text of the filter editor main container."
		},
		"editorIDText": {
			"message": "ID:",
			"description": "Label text for the ID field of the editor."
		},
		"editorIDTitle": {
			"message": "Filter ID",
			"description": "Tooltip text for the ID field of the editor."
		},
		"editorNameText": {
			"message": "Name:",
			"description": "Label text for the name field of the editor."
		},
		"editorNameTitle": {
			"message": "Filter name",
			"description": "Tooltip text for the name field of the editor."
		},
		"editorNamePlaceholder": {
			"message": "untitled",
			"description": "Placeholder text for the name field of the editor."
		},
		"editorTypeText": {
			"message": "Type:",
			"description": "Label text for the type field of the editor."
		},
		"editorTypeTitle": {
			"message": "Filter type",
			"description": "Tooltip text for the type field of the editor."
		},
		"editorColorText": {
			"message": "Color:",
			"description": "Label text for the color field of the editor."
		},
		"editorColorTitle": {
			"message": "Filter tag color",
			"description": "Tooltip text for the color field of the editor."
		},
		"editorTextColorText": {
			"message": "Text Color:",
			"description": "Label text for the text color field of the editor."
		},
		"editorTextColorTitle": {
			"message": "Filter text tag color",
			"description": "Tooltip text for the text color field label of the editor."
		},
		"editorColorPicker": {
			"message": "Pick a color",
			"description": "Tooltip text for the color inputs of the editor."
		},
		"editorEnableText": {
			"message": "Enabled:",
			"description": "Label text for the enable field of the editor."
		},
		"editorEnableTitle": {
			"message": "Enable this filter",
			"description": "Tooltip text for the enable field of the editor."
		},
		"editorPreviewText": {
			"message": "Preview:",
			"description": "Label text for the tag preview of the editor."
		},
		"editorPreviewTitle": {
			"message": "Live tag preview",
			"description": "Tooltip text for the tag preview of the editor."
		},
		"editorUsersText": {
			"message": "Artists, art collectors, and everyone else have their names listed here.",
			"description": "Description of what the users textarea box is for."
		},
		"editorCleanup": {
			"message": "Clean and Sort",
			"description": "Text on the button that organizes the entries in a textarea box."
		},
		"editorLength": {
			"message": "Length: ",
			"description": "Label text for the number of entries in a textarea box."
		},
		"editorSubmissionsText": {
			"message": "Each submission is identified by an ID number.",
			"description": "Description of what the submissions textarea box is for."
		},
		"editorImportWatchlist": {
			"message": "Import Watchlist",
			"description": "Text on the button that retrieves one's watchlist and merges it with the users."
		},
		"editorImportGallery": {
			"message": "Import Gallery",
			"description": "Text on the button that retrieves one's gallery and adds it to the submissions."
		},
		"editorImportFavorites": {
			"message": "Import Favorites",
			"description": "Text on the button that retrieves one's favorites and adds it to the submissions."
		},
		"editorKeywordsText": {
			"message": "These can help identify content on a document that can be filtered out automatically.",
			"description": "Description of the use of keywords."
		},
		"editorScanTitlesTitle": {
			"message": "Scan submission titles",
			"description": "Tooltip text for the option to scan the titles of submissions."
		},
		"editorScanTitlesText": {
			"message": "Scan submission titles for keywords:",
			"description": "Label text for the option to scan the titles of submissions."
		},
		"editorScanUsernamesTitle": {
			"message": "Scan usernames",
			"description": "Tooltip text for the option to scan the names of users."
		},
		"editorScanUsernamesText": {
			"message": "Scan usernames for keywords:",
			"description": "Label text for the option to scan the names of users."
		},
		"editorPreferenceTitle": {
			"message": "Filter a user instead",
			"description": "Tooltip text for the option to filter by user when scanning submissions."
		},
		"editorPreferenceText": {
			"message": "If a submission is matched, prefer filtering its creator instead:",
			"description": "Label text for the option to filter by user when scanning submissions."
		},
		"editorKeywordSupport": {
			"message": "Keywords support regular expression syntax.",
			"description": "Link text that tells the client that keywords can be any regular expressions."
		},
		"editorOptionsTitle": {
			"message": "Blacklist Options",
			"description": "Title text for the blacklisting options category of the editor."
		},
		"editorOptionsText": {
			"message": "Hide the following types of elements when users/submissions are blacklisted:",
			"description": "Description of the blacklisting options category of the editor."
		},
		"editorOptionAvatarText": {
			"message": "Avatars:",
			"description": "Label text for the avatar option."
		},
		"editorOptionAvatarTitle": {
			"message": "This hides the profile pictures of users",
			"description": "Tooltip text for the avatar option."
		},
		"editorOptionUsernameText": {
			"message": "Usernames/Mentions:",
			"description": "Label text for the username option."
		},
		"editorOptionUsernameTitle": {
			"message": "This hides instances of the user's name",
			"description": "Tooltip text for the username option."
		},
		"editorOptionCommentText": {
			"message": "Comments/Shouts:",
			"description": "Label text for the comment option."
		},
		"editorOptionCommentTitle": {
			"message": "This hides comments and shouts made by the user",
			"description": "Tooltip text for the comment option."
		},
		"editorOptionThumbnailText": {
			"message": "Thumbnails/Graphics:",
			"description": "Label text for the thumbnail option."
		},
		"editorOptionThumbnailTitle": {
			"message": "This hides submission thumbnails, images, flashes, etc.",
			"description": "Tooltip text for the thumbnail option."
		},
		"editorOptionTitleText": {
			"message": "Titles:",
			"description": "Label text for the title option."
		},
		"editorOptionTitleTitle": {
			"message": "This hides submission titles, if they are found",
			"description": "Tooltip text for the title option."
		},
		"editorOptionLinkText": {
			"message": "Other Links:",
			"description": "Label text for the link option."
		},
		"editorOptionLinkTitle": {
			"message": "This hides any other kind of link that goes to a submission",
			"description": "Tooltip text for the label option."
		},
		
		"optionsTitle": {
			"message": "Extension Options",
			"description": "Title for the extension options page."
		},
		"optionsLocale": {
			"message": "Language:",
			"description": "Label text for the language selector."
		},
		"optionsEnable": {
			"message": "Enable this extension",
			"description": "Text for the option to toggle the extension on or off."
		},
		"optionsScan": {
			"message": "Scan a webpage each time the tab is loaded or switched to",
			"description": "Text for the option to make webpage scanning happen more than once."
		},
		"optionsSort": {
			"message": "Automatically sort the contents of filters",
			"description": "Text for the option to auto-sort filter contents."
		},
		"optionsCleanup": {
			"message": "Remove the submission previews on profile pages.",
			"description": "Text for the option to cleanup profile pages."
		},
		"optionsNotifications": {
			"message": "Use browser notifications",
			"description": "Text for the option to show browser notifications."
		},
		"optionsReset": {
			"message": "Reset Options",
			"description": "Text for the button that resets extension options."
		},
		"optionsPurgeData": {
			"message": "Purge Data",
			"description": "Text for the button that removes all app data."
		},
		"optionsImportAppData": {
			"message": "Import Data",
			"description": "Text for the button that imports app data."
		},
		"optionsExportAppData": {
			"message": "Export Data",
			"description": "Text for the button taht exports app data."
		},
		
		"listTitle": {
			"message": "Master List",
			"description": "Title of the master list page."
		},
		"listAddAll": {
			"message": "Add All...",
			"description": "Label for add-all dropdown used on master list and content pages."
		},
		"listRemoveAll": {
			"message": "Remove All...",
			"description": "Label for remove-all dropdown used on master list and content pages."
		},
		
		"pageContentsTitle": {
			"message": "Page Contents",
			"description": "Title of the page contents window."
		},
		"pageShowWindowText": {
			"message": "Blacklist",
			"description": "Text on the button that shows the page contents window."
		},
		"pageShowWindowTitle": {
			"message": "Display page contents in list form",
			"description": "Title text for the button that shows the page contents window."
		},
		
		"mainScanResults": {
			"message": "Scanning Results",
			"description": "Notification title text for the results of scanning a webpage."
		}
	},
	'ru-ru': {
		"extensionName": {
			"message": "FurAffinity Blacklist",
			"description": "Name of the extension."
		},
		"extensionDescription": {
			"message": "Модули интерфейса для фильтрации контента на FurAffinity",
			"description": "Description of the extension."
		},
		
		"blacklist": {
			"message": "Черный список",
			"description": "Generic use word for 'blacklist'."
		},
		"whitelist": {
			"message": "Белый список",
			"description": "Generic use word for 'whitelist'."
		},
		"filters": {
			"message": "Фильтры",
			"description": "Generic use word for 'filter'."
		},
		"users": {
			"message": "Пользователи",
			"description": "Generic use word for 'users'."
		},
		"submissions": {
			"message": "Контент FA",
			"description": "Generic use word for 'submissions'."
		},
		"keywords": {
			"message": "Ключевые слова",
			"description": "Generic use word for 'keywords'."
		},
		"options": {
			"message": "Настройки",
			"description": "Generic use word for 'options'."
		},
		"random": {
			"message": "Случайный цвет",
			"description": "Generic use word for 'random'."
		},
		
		"searchPlaceholder": {
			"message": "🔎 Поиск...",
			"description": "Placeholder text for any search bar."
		},
		"filtersPlaceholder": {
			"message": "Фильтры не найдены...",
			"description": "Placeholder text when there are no filters to display."
		},
		"usersPlaceholder": {
			"message": "Пользователи не найдены...",
			"description": "Placeholder text when there are no users to display."
		},
		"submissionsPlaceholder": {
			"message": "Контент не найден...",
			"description": "Placeholder text when there are no submissions to display."
		},
		
		"confirmDiscard": {
			"message": "Изменения $filter$ не сохранены. Сохранить?",
			"description": "Confirmation dialog text when a filter has changes but is not saved.",
			"placeholders": {
				"filter": {
					"content": "$1",
					"default": "this filter"
				}
			}
		},
		"confirmDelete": {
			"message": "Вы точно хотите удалить $filter$? Это действие нельзя отменить.",
			"description": "Confirmation dialog text when the user clicks a delete button for a filter.",
			"placeholders": {
				"filter": {
					"content": "$1",
					"default": "this filter"
				}
			}
		},
		"confirmEraseData": {
			"message": "Вы уверены что хотите удалить все данные этого расширения?",
			"description": "Confirmation dialog text when the user wants to purge all extension data."
		},
		"promptUsername": {
			"message": "Введите имя пользователя:",
			"description": ""
		},
		
		"popupTitle": {
			"message": "FurAffinity Blacklist ",
			"description": "Title text of the popup."
		},
		"popupToggleApp": {
			"message": "Включить/выключить расширение",
			"description": "Title text for the popup power button."
		},
		"popupNewFilter": {
			"message": "+ Добавить фильтр",
			"description": "Text for the popup filter button."
		},
		"popupMasterList": {
			"message": "Главный список",
			"description": "Text for the popup master list button."
		},
		"popupOptions": {
			"message": "Настройки",
			"description": "Text for the popup options button."
		},
		"popupLove": {
			"message": "Сделано с ❤",
			"description": "Text for the popup footer."
		},
		"popupToggleFilter": {
			"message": "Включить/выключить $filter$",
			"description": "Title text for toggle switches on the popup.",
			"placeholders": {
				"filter": {
					"content": "$1",
					"default": "this filter"
				}
			}
		},
		"popupRemoveFilter": {
			"message": "Удалить $filter$",
			"description": "Title text for the delete button next to each filter on the popup.",
			"placeholders": {
				"filter": {
					"content": "$1",
					"default": "this filter"
				}
			}
		},
		
		"editorNewText": {
			"message": "Добавить",
			"description": "Text on new filter button in the editor."
		},
		"editorNewTitle": {
			"message": "Создать новый фильтр",
			"description": "Tooltip text for the new filter button in the editor."
		},
		"editorSaveText": {
			"message": "Сохранить",
			"description": "Text on save filter button in the editor."
		},
		"editorSaveTitle": {
			"message": "Сохранить текущий фильтр",
			"description": "Tooltip text for the save filter button in the editor."
		},
		"editorCopyText": {
			"message": "Сохранить как копию",
			"description": "Text on copy filter button in the editor."
		},
		"editorCopyTitle": {
			"message": "Сохранить копию текущего фильтра",
			"description": "Tooltip text for the copy filter button in the editor."
		},
		"editorLoadText": {
			"message": "Загрузить",
			"description": "Text on load filter button in the editor."
		},
		"editorLoadTitle": {
			"message": "Загрузить сохраненный фильтр",
			"description": "Tooltip text for the load filter button in the editor."
		},
		"editorDeleteText": {
			"message": "Удалить",
			"description": "Text on delete filter button in the editor."
		},
		"editorDeleteTitle": {
			"message": "Удалить текущий фильтр",
			"description": "Tooltip text for the delete filter button in the editor."
		},
		"editorImportText": {
			"message": "📤 Импортировать",
			"description": "Text on import filter button in the editor."
		},
		"editorImportTitle": {
			"message": "Импортировать фильтр с ПК",
			"description": "Tooltip text for the import filter button in the editor."
		},
		"editorExportText": {
			"message": "📥 Экспортировать",
			"description": "Text on export filter button in the editor."
		},
		"editorExportTitle": {
			"message": "Экспортировать на ПК",
			"description": "Tooltip text for the export filter button in the editor."
		},
		"editorSelectFilter": {
			"message": "Выберите фильтр...",
			"description": "Text preceding the filter selection dropdown in the editor."
		},
		"editorTitle": {
			"message": "Настройка фильтра",
			"description": "Title text of the filter editor main container."
		},
		"editorIDText": {
			"message": "ID:",
			"description": "Label text for the ID field of the editor."
		},
		"editorIDTitle": {
			"message": "ID фильтра",
			"description": "Tooltip text for the ID field of the editor."
		},
		"editorNameText": {
			"message": "Имя:",
			"description": "Label text for the name field of the editor."
		},
		"editorNameTitle": {
			"message": "Имя фильтра",
			"description": "Tooltip text for the name field of the editor."
		},
		"editorNamePlaceholder": {
			"message": "безымянный",
			"description": "Placeholder text for the name field of the editor."
		},
		"editorTypeText": {
			"message": "По типу:",
			"description": "Label text for the type field of the editor."
		},
		"editorTypeTitle": {
			"message": "Тип фильтра",
			"description": "Tooltip text for the type field of the editor."
		},
		"editorColorText": {
			"message": "Цвет:",
			"description": "Label text for the color field of the editor."
		},
		"editorColorTitle": {
			"message": "Цвет бирки фильтра",
			"description": "Tooltip text for the color field of the editor."
		},
		"editorTextColorText": {
			"message": "Цвет текста:",
			"description": "Label text for the text color field of the editor."
		},
		"editorTextColorTitle": {
			"message": "Цвет текста бирки",
			"description": "Tooltip text for the text color field label of the editor."
		},
		"editorColorPicker": {
			"message": "Выберите цвет",
			"description": "Tooltip text for the color inputs of the editor."
		},
		"editorEnableText": {
			"message": "Включен:",
			"description": "Label text for the enable field of the editor."
		},
		"editorEnableTitle": {
			"message": "Включение фильтра",
			"description": "Tooltip text for the enable field of the editor."
		},
		"editorPreviewText": {
			"message": "Предпросмотр:",
			"description": "Label text for the tag preview of the editor."
		},
		"editorPreviewTitle": {
			"message": "Предпросмотр бирки фильтра",
			"description": "Tooltip text for the tag preview of the editor."
		},
		"editorUsersText": {
			"message": "Имена художников, писателей и прочих людей находятся тут.",
			"description": "Description of what the users textarea box is for."
		},
		"editorCleanup": {
			"message": "Отчистить и отсортировать",
			"description": "Text on the button that organizes the entries in a textarea box."
		},
		"editorLength": {
			"message": "Количество: ",
			"description": "Label text for the number of entries in a textarea box."
		},
		"editorSubmissionsText": {
			"message": "У каждого файла на FA свой ID.",
			"description": "Description of what the submissions textarea box is for."
		},
		"editorImportWatchlist": {
			"message": "Импортировать подписки",
			"description": "Text on the button that retrieves one's watchlist and merges it with the users."
		},
		"editorImportGallery": {
			"message": "Импортировать галерею",
			"description": "Text on the button that retrieves one's gallery and adds it to the submissions."
		},
		"editorImportFavorites": {
			"message": "Импортировать избранное",
			"description": "Text on the button that retrieves one's favorites and adds it to the submissions."
		},
		"editorKeywordsText": {
			"message": "Ключевые слова помогают в идентификации и фильтрации контента.",
			"description": "Description of the use of keywords."
		},
		"editorScanTitlesTitle": {
			"message": "Сканируют заголовок контента на наличие ключевых слов",
			"description": "Tooltip text for the option to scan the titles of submissions."
		},
		"editorScanTitlesText": {
			"message": "Сканирование названия работы:",
			"description": "Label text for the option to scan the titles of submissions."
		},
		"editorScanUsernamesTitle": {
			"message": "Сканирует имена пользователей на наличие ключевых слов",
			"description": "Tooltip text for the option to scan the names of users."
		},
		"editorScanUsernamesText": {
			"message": "Сканировать имя пользователей:",
			"description": "Label text for the option to scan the names of users."
		},
		"editorPreferenceTitle": {
			"message": "Фильтрует пользователей",
			"description": "Tooltip text for the option to filter by user when scanning submissions."
		},
		"editorPreferenceText": {
			"message": "Если нашлось совпадение в контенте, фильтруем по пользователю:",
			"description": "Label text for the option to filter by user when scanning submissions."
		},
		"editorKeywordSupport": {
			"message": "Ключевые слова поддерживают стандартный синтаксис выражений.",
			"description": "Link text that tells the client that keywords can be any regular expressions."
		},
		"editorOptionsTitle": {
			"message": "Настройки черного списка",
			"description": "Title text for the blacklisting options category of the editor."
		},
		"editorOptionsText": {
			"message": "Скрывать данные элементы если пользователь/контент находятся в черном списке:",
			"description": "Description of the blacklisting options category of the editor."
		},
		"editorOptionAvatarText": {
			"message": "Аватарка:",
			"description": "Label text for the avatar option."
		},
		"editorOptionAvatarTitle": {
			"message": "Скрывает аватарку пользователя",
			"description": "Tooltip text for the avatar option."
		},
		"editorOptionUsernameText": {
			"message": "Имя пользователя:",
			"description": "Label text for the username option."
		},
		"editorOptionUsernameTitle": {
			"message": "Скрывает имя пользователя",
			"description": "Tooltip text for the username option."
		},
		"editorOptionCommentText": {
			"message": "Комментарии:",
			"description": "Label text for the comment option."
		},
		"editorOptionCommentTitle": {
			"message": "Скрывает комментарии пользователя в черном списке",
			"description": "Tooltip text for the comment option."
		},
		"editorOptionThumbnailText": {
			"message": "Превью контента:",
			"description": "Label text for the thumbnail option."
		},
		"editorOptionThumbnailTitle": {
			"message": "Скрывает превью контента (картинки)",
			"description": "Tooltip text for the thumbnail option."
		},
		"editorOptionTitleText": {
			"message": "Заголовки:",
			"description": "Label text for the title option."
		},
		"editorOptionTitleTitle": {
			"message": "Скрывает название контента",
			"description": "Tooltip text for the title option."
		},
		"editorOptionLinkText": {
			"message": "Другие ссылки:",
			"description": "Label text for the link option."
		},
		"editorOptionLinkTitle": {
			"message": "Скрывает любые ссылки ведущие к контенту в черном списке",
			"description": "Tooltip text for the label option."
		},
		
		"optionsTitle": {
			"message": "Настройки расширения",
			"description": "Title for the extension options page."
		},
		"optionsLocale": {
			"message": "Language:",
			"description": "Label text for the language selector."
		},
		"optionsEnable": {
			"message": "Включить расширение",
			"description": "Text for the option to toggle the extension on or off."
		},
		"optionsScan": {
			"message": "Сканировать вкладку каждый при переключении на нее или ее загрузке",
			"description": "Text for the option to make webpage scanning happen more than once."
		},
		"optionsSort": {
			"message": "Автоматически сортировать фильтры",
			"description": "Text for the option to auto-sort filter contents."
		},
		"optionsCleanup": {
			"message": "Очищать превью контента на странице профиля",
			"description": "Text for the option to cleanup profile pages."
		},
		"optionsNotifications": {
			"message": "Использовать уведомления браузера",
			"description": "Text for the option to show browser notifications."
		},
		"optionsReset": {
			"message": "Сбросить настройки до заводских",
			"description": "Text for the button that resets extension options."
		},
		"optionsPurgeData": {
			"message": "Удалить все данные",
			"description": "Text for the button that removes all app data."
		},
		"optionsImportAppData": {
			"message": "Импортировать данные",
			"description": "Text for the button that imports app data."
		},
		"optionsExportAppData": {
			"message": "Экспортировать данные",
			"description": "Text for the button that exports app data."
		},
		
		"listTitle": {
			"message": "Главный список",
			"description": "Title of the master list page."
		},
		"listAddAll": {
			"message": "Добавить все...",
			"description": "Label for add-all dropdown used on master list and content pages."
		},
		"listRemoveAll": {
			"message": "Удалить все...",
			"description": "Label for remove-all dropdown used on master list and content pages."
		},
		
		"pageContentsTitle": {
			"message": "Содержание страницы",
			"description": "Title of the page contents window."
		},
		"pageShowWindowText": {
			"message": "Черный список",
			"description": "Text on the button that shows the page contents window."
		},
		"pageShowWindowTitle": {
			"message": "Вывод содержания страницы в виде списка",
			"description": "Title text for the button that shows the page contents window."
		},
		
		"mainScanResults": {
			"message": "Результаты сканирования",
			"description": "Notification title text for the results of scanning a webpage."
		}
	}
};


// ===== Style =====

var STYLE = html('style', null, `
/* https://www.w3schools.com/howto/howto_css_switch.asp */
/* The switch - the box around the slider */
.switch {
	position: relative;
	display:  inline-block;
	width:    50px;
	height:   28px;
	margin:   0;
}
/* Hide default HTML checkbox */
.switch input {
	display: none;
}
/* The slider */
.slider {
	position: absolute;
	cursor:   pointer;
	top:      0;
	left:     0;
	right:    0;
	bottom:   0;
	background-color:    #ccc;
	border: 2px inset #ccc;
	transition:         .3s;
	-webkit-transition: .3s;
	-moz-transition:    .3s;
}
.slider:before {
	position: absolute;
	content: "";
	height: 20px;
	width:  20px;
	left: 2px;
	bottom: 2px;
	background-color: white;
	-webkit-transition: .3s;
	transition: .3s;
}
input:checked + .slider {
	background-color: #2196F3;
}
input:focus + .slider {
	box-shadow: 0 0 1px #2196F3;
}
input:checked + .slider:before {
	-webkit-transform: translateX(22px);
	-ms-transform: translateX(22px);
	transform: translateX(22px);
}
/* Rounded sliders */
.slider.round {
	border-radius: 28px;
}
.slider.round:before {
	border-radius: 50%;
}
@charset "utf-8";
#app {
	width: 260px !important;
	background-color: #2e3b41;
	color: #cfcfcf;
	font-family: Verdana, sans-serif;
	font-size: 8pt;
}
#app #power-button {
	display: block;
	margin: 10px;
	width: 64px;
	height: 64px;
	border-radius: 50%;
	background-image: url('https://raw.githubusercontent.com/DragonOfMath/fa-blacklist-webext/master/static/fabl-128.png');
	background-size: 100%;
	background-repeat: no-repeat;
	background-position: center;
	background-color: transparent;
	/* box-shadow: 0px 0px 20px black; */
}
#app #power-button.disabled {
	filter: grayscale(100%);
	-webkit-filter: grayscale(100%);
}
#app #version {
	margin-left: 6px;
}
#app button.remove {
	border: none;
	font-size: 12pt;
	border-radius: 12px;
	background-color: transparent;
	color: inherit;
	margin: 2px 0px 2px 4px;
	padding: 0px;
	width: 24px;
	height: 24px;
	cursor: pointer;
}
#app button..remove:hover {
	border-width: 1px;
	border-style: outset;
}
#app h1 {
	margin: 5px;
}
#app h2 {
	margin: 5px 0px 5px 2px;
}
#app h3 {
	display: inline-block;
	margin: 5px;
}
#app table {
	border-spacing: 0px;
}
#app tr {
	width: 100%;
	padding: 10px 0px;
}
#app td {
	padding: 5px;
}
#app textarea,
#app button,
#app select,
#app input {
	border: none;
	font-family: inherit;
	font-size: inherit;
	background-color: inherit;
	color: #cfcfcf;
}
#app textarea {
	display: block;
	box-sizing: border-box;
	padding: 5px;
	width: 100%;
	height: 98px;
	resize: vertical;
}
#app button,
#app select,
#app input {
	display: inline-block;
	height: 24px;
}
#app button {
	/* border-radius: 10px; */
	margin: 0px 1px 4px 0px;
	cursor: pointer;
}
#app select {
	/*min-width: 30px;*/
	cursor: pointer;
}
#app input[type=color] {
	width: 100px;
	padding: 0;
	margin: 0px 10px 0px 0px;
	vertical-align: top;
	cursor: pointer;
}
#app input[type=textbox] {
	width: 100%;
	box-sizing: border-box;
	padding: 4px;
}
#app textarea:hover,
#app textarea:focus,
#app button:hover,
#app input:focus {
	background-color: #404a52;
}
#app select:focus {
	background-color: #2e3b41;
}
#app code {
	margin: 4px;
}
#app a {
	text-decoration: none;
	color: inherit;
	font-weight: bold;
}
#app a:hover {
	text-decoration: underline;
}
#app p {
	margin: 5px;
}
#app .group {
	padding: 0;
	border-bottom: 2px inset #2e3b41;
}
#app .fixed-height {
	max-height: 300px;
	overflow-y: auto;
}
#app .row {
	margin: 2px 0px 2px 4px;
}
#app #list .row {
	vertical-align: top;
}
#app .row:hover {
	background-color: #404a52;
}
#app .lightmode {
	background-color: #d4dce8;
	border-color: #d4dce8;
	color: #2e2e2e;
}
#app .dummy {
	font-size: 10pt;
}
#app .grey {
	color: #9b9b9b;
}
#app .red:hover {
	background-color: red !important;
	border-color: red !important;
	color: white !important;
}
#app .green:hover {
	background-color: #2a2 !important;
	border-color: #262 !important;
	color: white !important;
}
#app .blue:hover {
	background-color: blue !important;
	border-color: blue !important;
	color: white !important;
}
#app .hidden {
	display: none !important;
}
#app .drag-handle {
	background-color: #202224;
	cursor: pointer;
}
#app #topnav {
	position: fixed;
	margin-top: -60px;
	width: 378px;
	background-color: #2e3b41;
	z-index: 999;
}
#app #filter-info {
	margin-top: 60px;
}
#app a {
	margin: 2px 10px 2px 2px;
}
#app select {
	/*background-image: none;*/
}
#app .add-tag {
	width: 50px;
}
#app #users-add-all,
#app #users-remove-all,
#app #submissions-add-all,
#app #submissions-remove-all {
	width: auto;
}
/*
#app #users, #app #submissions {
	max-height: 300px;
	overflow-x: hidden;
	overflow-y: auto;
}
*/
#app #hide-app-window {
	font-size: 12pt;
	float: right;
	margin: 0;
}
#app #app-window {
	position: fixed;
	background-color: #2e3b41;
	color: #cfcfcf;
	z-index: 999;
	width: 400px;
	margin: auto;
	opacity: 0.5;
	box-shadow: 1px 1px 1px 1px black;
	transition: opacity 200ms ease;
}
#app #app-window:hover {
	opacity: 1;
	box-shadow: 2px 2px 2px 2px black;
}
#app #icon {
	width: 24px;
	height: 24px;
	margin: 4px;
	padding: 0;
}
#app #window-title {
	display: inline-block;
	vertical-align: top;
}
#app #tabs {
	background-color: #202224;
}
#app .tab {
	margin: 0;
	padding: 6px 10px;
	/*font-weight: bold;*/
	cursor: pointer;
	display: inline-block;
}
#app .tab:hover:not(.active) {
	background-color: #262a32;
}
#app .tab.active {
	background-color: #2e3b41;
}
#app #tabs-contents {
	max-height: 600px;
	overflow-y: auto;
}
.tag {
	display: inline-block;
	border-radius: 6px;
	border-width: 2px;
	border-style: outset;
	margin: 1px;
	padding: 2px;
	cursor: pointer;
}
.tag.disabled {
	background-color: grey !important;
	border-color: grey !important;
	color: white !important;
}
.tag .text {
	font-size: 7.5pt;
	margin: 0;
	padding: 2px;
	/* filter: invert(100%);
	-o-filter: invert(100%);
	-webkit-filter: invert(100%); */
}
.tag.auto:not(.disabled) .text::after {
	content: '🔎';
}
.tag .remove {
	border: none;
	font-size: 9pt;
	border-radius: 8px;
	background-color: transparent;
	color: #333;
	margin: 2px 0px 2px 4px;
	padding: 0;
	width: 16px !important;
	height: 16px !important;
	cursor: pointer;
}
.tag .remove:hover {
	background-color: red !important;
	border-color: red !important;
	color: white !important;
}`);

var LIST = parseHTML(`
<div id="list">
	<div id="search">
		<input type="textbox" id="searchbar" data-i18n="searchPlaceholder,placeholder">
	</div>
	<div id="users-global">
		<h3 data-i18n="users"></h3>
		<select id="users-add-all"></select>
		<select id="users-remove-all"></select>
	</div>
	<div id="users" class="group">
	</div>
	<div id="submissions-global">
		<h3 data-i18n="submissions"></h3>
		<select id="submissions-add-all"></select>
		<select id="submissions-remove-all"></select>
	</div>
	<div id="submissions" class="group">
	</div>
</div>
`);

var FILTERS = parseHTML(`
<div id="popup">
	<div id="popup-header" class="group">
		<center>
			<button id="power-button" data-i18n="popupToggleApp,title"></button>
		</center>
	</div>
	<div id="popup-body" class="group">
		<div>
			<input type="textbox" id="searchbar" data-i18n="searchPlaceholder,placeholder">
			<!--<span class="results small hidden"><span id="search-results">0</span> results</span>-->
		</div>
		<div class="fixed-height">
			<table id="filters">
				<thead>
				</thead>
				<tbody>
				</tbody>
			</table>
		</div>
	</div>
	<div id="popup-footer" class="group">
		<center>
			<p class="small"><span data-i18n="popupLove"></span> | <a id="source">GitHub</a> | <a href="${SOURCE_URL}/LICENSE">MIT License</a></p>
		</center>
	</div>
</div>
`);

var EDITOR = parseHTML(`
<div id="editor">
	<div class="group buttons" id="topnav">
		<center>
			<button id="new-filter" class="control" data-i18n="editorNewTitle,title;editorNewText"></button>
			<button id="save-filter" class="control" data-i18n="editorSaveTitle,title;editorSaveText"></button>
			<button id="copy-filter" class="control" data-i18n="editorCopyTitle,title;editorCopyText"></button>
			<button id="load-filter" class="control" data-i18n="editorLoadTitle,title;editorLoadText"></button>
			<select id="filter-dropdown" value="" style="display:none;"></select>
			<button id="delete-filter" class="control" data-i18n="editorDeleteTitle,title;editorDeleteText"></button><br>
			<button id="import-filter" class="control" data-i18n="editorImportTitle,title;editorImportText"></button>
			<button id="export-filter" class="control" data-i18n="editorExportTitle,title;editorExportText"></button>
			<input id="import" type="file" class="hidden">
		</center>
	</div>
	<div id="filter-info" class="group">
		<table>
			<tr class="row" data-i18n="editorIDTitle,title">
				<td data-i18n="editorIDText"></td>
				<td><code id="id"></code></td>
			</tr>
			<tr class="row" data-i18n="editorNameTitle,title">
				<td data-i18n="editorNameText"></td>
				<td><input type="textbox" id="name" data-i18n="editorNamePlaceholder,placeholder"></td>
			</tr>
			<tr class="row" data-i18n="editorTypeTitle,title">
				<td data-i18n="editorTypeText"></td>
				<td>
					<select id="type" value="0">
						<option value="0" data-i18n="blacklist"></option>
						<option value="1" data-i18n="whitelist"></option>
					</select>
				</td>
			</tr>
			<tr class="row" data-i18n="editorColorTitle,title">
				<td data-i18n="editorColorText"></td>
				<td>
					<input type="color" id="color" value="#ff0000" data-i18n="editorColorPicker,title">
					<button id="random-color" data-i18n="random"></button>
				</td>
			</tr>
			<tr class="row" data-i18n="editorTextColorTitle,title">
				<td data-i18n="editorTextColorText"></td>
				<td>
					<input type="color" id="color-text" value="#ffffff" data-i18n="editorColorPicker,title">
					<button id="random-text-color" data-i18n="random"></button>
				</td>
			</tr>
			<tr class="row" data-i18n="editorEnableTitle,title">
				<td><label for="active" data-i18n="editorEnableText"></label></td>
				<td>
					<input type="checkbox" id="active" checked="">
				</td>
			</tr>
			<tr class="row" data-i18n="editorPreviewTitle,title">
				<td data-i18n="editorPreviewText"></td>
				<td>
					<span id="tag-preview" class="tag"><span class="text"></span><span class="remove">x</span></span>
				</td>
			</tr>
		</table>
	</div>
	<div id="filter-contents" class="group">
		<div id="filter-contents-users">
			<h2 data-i18n="users"></h2>
			<p data-i18n="editorUsersText"></p>
			<div class="buttons">
				<button id="clean-sort-users" data-i18n="editorCleanup"></button>
				<button id="get-watchlist" data-i18n="editorImportWatchlist"></button>
			</div>
			<textarea id="users"></textarea>
			<div class="small grey">
				<span data-i18n="editorLength"></span>
				<span id="content-length-users">0</span>
			</div>
		</div>
		<div id="filter-contents-submissions">
			<h2 data-i18n="submissions"></h2>
			<p data-i18n="editorSubmissionsText"></p>
			<div class="buttons">
				<button id="clean-sort-submissions" data-i18n="editorCleanup"></button>
				<button id="get-submissions" data-i18n="editorImportGallery"></button>
				<button id="get-favorites" data-i18n="editorImportFavorites"></button>
			</div>
			<textarea id="submissions"></textarea>
			<div class="small grey">
				<span data-i18n="editorLength"></span>
				<span id="content-length-submissions">0</span>
			</div>
		</div>
		<div id="filter-contents-keywords">
			<h2 data-i18n="keywords"></h2>
			<p data-i18n="editorKeywordsText"></p>
			<table>
				<tr class="row" data-i18n="editorScanTitlesTitle,title">
					<td><label for="matchTitle" data-i18n="editorScanTitlesText"></label></td>
					<td><input type="checkbox" id="matchTitle"></td>
				</tr>
				<tr class="row" data-i18n="editorScanUsernamesTitle,title">
					<td><label for="matchName" data-i18n="editorScanUsernamesText"></label></td>
					<td><input type="checkbox" id="matchName"></td>
				</tr>
				<tr class="row" data-i18n="editorPreferenceTitle,title">
					<td><label for="sensitive" data-i18n="editorPreferenceText"></label></td>
					<td><input type="checkbox" id="sensitive"></td>
				</tr>
			</table>
			<textarea id="keywords"></textarea>
			<div>
				<a href="https://regex101.com" target="_blank" data-i18n="editorKeywordSupport"></a>
			</div>
		</div>
	</div>
	<div id="filter-options" class="group">
		<h2 data-i18n="options"></h2>
		<p data-i18n="editorOptionsText"></p>
		<table>
			<tr class="row" data-i18n="editorOptionAvatarTitle,title">
				<td><label for="avatar" data-i18n="editorOptionAvatarText"></label></td>
				<td><input type="checkbox" id="avatar" checked=""></td>
			</tr>
			<tr class="row" data-i18n="editorOptionUsernameTitle,title">
				<td><label for="username" data-i18n="editorOptionUsernameText"></label></td>
				<td><input type="checkbox" id="username" checked=""></td>
			</tr>
			<tr class="row" data-i18n="editorOptionCommentTitle,title">
				<td><label for="comment" data-i18n="editorOptionCommentText"></label></td>
				<td><input type="checkbox" id="comment" checked=""></td>
			</tr>
			<tr class="row" data-i18n="editorOptionThumbnailTitle,title">
				<td><label for="thumbnail" data-i18n="editorOptionThumbnailText"></label></td>
				<td><input type="checkbox" id="thumbnail" checked=""></td>
			</tr>
			<tr class="row" data-i18n="editorOptionTitleTitle,title">
				<td><label for="title" data-i18n="editorOptionTitleText"></label></td>
				<td><input type="checkbox" id="title" checked=""></td>
			</tr>
			<tr class="row" data-i18n="editorOptionLinkTitle,title">
				<td><label for="link" data-i18n="editorOptionLinkText"></label></td>
				<td><input type="checkbox" id="link" checked=""></td>
			</tr>
		</table>
	</div>
</div>
`);

var OPTIONS = parseHTML(`
<div id="options" class="group">
	<table>
		<tr class="row">
			<td data-i18n="optionsLocale"></td>
			<td><select id="locale" class="option" value="en-us">
				<option value="en-us">English (US)</option>
				<option value="ru-ru">Русский</option>
			</select></td>
		</tr>
		<tr class="row">
			<td><label for="enabled" data-i18n="optionsEnable"></label></td>
			<td><input type="checkbox" class="option" id="enabled"></td>
		</tr>
		<tr class="row">
			<td><label for="alwaysScan" data-i18n="optionsScan"></label></td>
			<td><input type="checkbox" class="option" id="alwaysScan"></td>
		</tr>
		<tr class="row">
			<td><label for="autoSort" data-i18n="optionsSort"></label></td>
			<td><input type="checkbox" class="option" id="autoSort"></td>
		</tr>
		<tr class="row">
			<td><label for="firstItem" data-i18n="optionsCleanup"></label></td>
			<td><input type="checkbox" class="option" id="firstItem"></td>
		</tr>
		<tr class="row">
			<td><label for="notifications" data-i18n="optionsNotifications"></label></td>
			<td><input type="checkbox" class="option" id="notifications"></td>
		</tr>
	</table>
	<div>
		<button id="export-app-data" data-i18n="optionsExportAppData"></button>
		<button id="import-app-data" data-i18n="optionsImportAppData"></button>
		<button id="reset-options" data-i18n="optionsReset"></button>
		<button id="reset-app" class="red" data-i18n="optionsPurgeData"></button>
		<input id="app-importer" type="file" class="hidden">
	</div>
</div>
`);

// ===== Misc Utilities =====

function identity(x) {
	return x;
}
function defaults(x, val) {
	return Object.isUndefined(x) || typeof x !== typeof val ? val : x;
}
function text(x) {
	return document.createTextNode(x);
}
function html(tag, attr, children) {
	if (arguments.length == 1 && Object.isObject(arguments[0])) {
		children = arguments[0].children;
		attr     = arguments[0].attr;
		tag      = arguments[0].tag;
	}
	tag      = defaults(tag, 'div');
	attr     = defaults(attr, {});
	if (!Array.isArray(children)) {
		children = [].slice.call(arguments, 2);
	}
	var e = document.createElement(tag);
	e.setProperties(attr);
	return Element.prototype.append.apply(e, children);
}
function parseHTML(string) {
	var $temp = document.createElement('div');
	$temp.insertAdjacentHTML('beforeend', string);
	return $temp.firstElementChild;
}
function click(element) {
	if (document.createEvent) {
		var evt = document.createEvent("MouseEvents");
		evt.initEvent("click",true,true);
		evt.synthetic = true;
		element.dispatchEvent(evt,true);
	} else if (element.fireEvent) {
		var evt = document.createEventObject();
		evt.synthetic = true;
		element.fireEvent("onclick",evt);
	} else {
		element.click();
	}
}
function reload() {
	window.reload_page();
}
function onOff(x) {
	if (typeof x === 'boolean') return x;
	return x == 'on';
}

var Utils = {
	cssColor: function (color) {
		return '#' + color.toString(16).padStart(6, '0');
	},
	sanitizeUsername: function (name) {
		try {
			return name.replace(/[^a-z0-9\~\-\.]/gi,'').toLowerCase().trim();
		} catch (e) {
			return '';
		}
	},
	sanitizeSubmissionID: function (id) {
		try {
			return id.match(/\/view\/(\d+)/)[1];
		} catch (e) {
			return '';
		}
	},
	getHash: function () {
		return window.location.hash ? window.location.hash.substring(1) : '';
	},
	setHash: function (x) {
		window.location.hash = '#' + x;
	},
	populateDropdown: function ($d, filters, placeholder) {
		$d.removeChildren();
		if (placeholder) {
			if (typeof(placeholder) === 'string') {
				placeholder = html('option', {value: '', disabled: '', selected: ''}, placeholder);
			} else if (placeholder instanceof Element) {
				placeholder.setAttribute('value', '');
				placeholder.setAttribute('disabled', '');
				placeholder.setAttribute('selected', '');
			}
			$d.appendChild(placeholder);
		}
		for (var ID in filters) {
			var $option = html('option', {value: ID}, filters[ID].name);
			$d.appendChild($option);
		}
		$d.value = '';
		return $d;
	},
	getUsername: function () { 
		var message = i18n.get('promptUsername');
		return Utils.sanitizeUsername(prompt(message));
	}
};

var DragHandler = {
	x: 0,
	y: 0,
	oldx: 0,
	oldy: 0,
	dx: 0,
	dy: 0,
	dragging: null,
	initialize: function () {
		DragHandler.x = 0;
		DragHandler.y = 0;
		DragHandler.oldx = 0;
		DragHandler.oldy = 0;
		DragHandler.dx = 0;
		DragHandler.dy = 0;
		DragHandler.dragging = null;
	},
	goto: function (x,y) {
		DragHandler.oldx = DragHandler.x;
		DragHandler.oldy = DragHandler.y;
		DragHandler.x = x;
		DragHandler.y = y;
		DragHandler.dx = DragHandler.x - DragHandler.oldx;
		DragHandler.dy = DragHandler.y - DragHandler.oldy;
	},
	move: function (e) {
		if (DragHandler.dragging) {
			e.preventDefault();
			DragHandler.dragging.move(DragHandler.dx, DragHandler.dy);//.keepOnScreen();
		}
	},
	start: function ($e) {
		DragHandler.dragging = $e;
	},
	stop: function () {
		DragHandler.dragging = null;
	},
	listen: function (evt, fn) {
		document.addEventListener(evt, function (e) {
			fn.call(DragHandler, e);
		}, false);
	}
};

DragHandler.listen('mousedown', function (e) {
	if (e.target.hasClassName('drag-handle')) {
		e.preventDefault();
		this.start(e.target.closest('.drag-parent'));
	} else if (e.target.hasClassName('draggable')) {
		e.preventDefault();
		this.start(e.target);
	}
});
DragHandler.listen('mouseup', function (e) {
	//console.log(e);
	if (this.dragging) {
		this.stop();
	}
});
DragHandler.listen('mousemove', function (e) {
	//console.log(e);
	var scroll = {
		x: document.documentElement.scrollLeft || document.body.scrollLeft,
		y: document.documentElement.scrollTop  || document.body.scrollTop
	};
	this.goto(
		e.PageX ? e.PageX : e.clientX + scroll.x,
		e.PageY ? e.PageY : e.clientY + scroll.y
	);
	this.move(e);
});

// "Switch" input
function $Switch(type, $checkbox) {
	if (typeof ($checkbox) !== 'object') {
		$checkbox = html('input', {type: 'checkbox', checked: $checkbox||undefined});
	}
	var $switch = html('label').addClassName('switch');
	var $slider = html('span').addClassName('slider').addClassName(type||'round');
	var $parent = $checkbox.parentElement;
	if ($parent) {
		$parent.replaceChild($switch, $checkbox);
	}
	$switch.appendChild($checkbox);
	$switch.appendChild($slider);
	return $switch;
}
function convertCheckboxesToSwitches(type, $root) {
	if (arguments.length == 1) {
		$root = type;
		type = 'round';
	}
	$root = $root || document;
	$A($root.querySelectorAll('input[type="checkbox"]')).forEach(function ($i) {
		$Switch(type, $i);
	});
}

// tab controls
function $TabControl(tabs) {
	var $tabs      = html('div', {id: 'tabs'});
	var $contents  = html('div', {id: 'tabs-contents'});
	var $container = html('div', {id: 'tabs-container'}, [$tabs, $contents]);
	
	$container.$active = null;
	
	function activate($tab) {
		$tab.classList.add('active');
		$tab.content.show();
	}
	function deactivate($tab) {
		$tab.classList.remove('active');
		$tab.content.hide();
	}
	function switchTo($tab) {
		if (typeof $tab === 'string') {
			$tab = $tabs.querySelector($tab);
		}
		if ($tab != $container.$active) {
			if ($container.$active) {
				deactivate($container.$active);
			}
			$container.$active = $tab;
			activate($container.$active);
		}
	}
	
	var first = true;
	for (var tabID in tabs) {
		var $tab     = tabs[tabID].tab;
		var $content = tabs[tabID].content;
		if (typeof $tab === 'string') {
			$tab = html('span', {class: 'tab', id: tabID}, $tab);
		} else {
			$tab.setAttribute('id', tabID);
			$tab.addClassName('tab');
		}
		$tab.content = $content;
		$content.tab = $tab;
		if (first) {
			$container.$active = $tab;
			activate($tab);
			first = false;
		} else {
			deactivate($tab);
		}
		$tab.addEventListener('click', function (e) {
			e.stopPropagation();
			switchTo(e.target);
		}, false);
		$tabs.appendChild($tab);
		$contents.appendChild($content);
	}

	$container.activate = activate;
	$container.deactivate = deactivate;
	$container.switchTo = switchTo;
	
	return $container;
}

// https://stackoverflow.com/a/30106551
function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode(parseInt(p1, 16));
    }));
}
function b64DecodeUnicode(str) {
    return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

// file I/O
function exportFile(filename, data) {
	var json = typeof(data) === 'object';
	var type;
	if (json) {
		data = JSON.stringify(data, null, '\t');
		type = 'application/json';
	} else {
		data = String(data);
		type = 'text/plain';
	}
	click(html('a', {
		href: 'data:' + type + ';base64,' + b64EncodeUnicode(data),
		download: filename
	}));
}
function importFile(file, callback) {
	var f = new FileReader();
	f.onload = function(e) {
		callback(e.target.result);
	};
	f.readAsText(file);
}
function openFileDialog(callback) {
	var fd = html('input',{type:'file'});
	fd.onchange = callback;
	click(fd);
}

// API requests (faexport.boothale.net)
function getWatchlist(e) {
	var username = Utils.getUsername();
	if (!username) return;
	
	var $btn = e.target;
	var text = $btn.textContent;
	$btn.textContent = 'Fetching...';
	
	var wl = Editor.getUsers();
	function getPage(p) {
		// thank god this exists
		return fetch('http://faexport.boothale.net/user/' + username + '/watching.json' + (p>1?'?page='+p:''))
		.then(function (x) {return x.json()})
		/* DEPRECATED
		return fetch('https://www.furaffinity.net/watchlist/by/'+username+(p>1?'/'+p+'/':''))
		.then(function (x) {return x.text()})
		.then(function (x) {return x.html()})
		.then(function ($dom) {return $A($dom.querySelectorAll('#userpage-budlist>tbody>tr>td>a,div.watch-row>a')).pluck('textContent')})
		*/
		.then(function (users) {
			$btn.textContent = 'Fetching (page ' + p + ')...';
			console.log('Got page ' + p + ' of ' + username + '\'s watchlist, ' + users.length + ' items');
			if (users.length) {
				users = users.map(Utils.sanitizeUsername);
				wl = wl.concat(users);
				return getPage(p+1);
			} else {
				Editor.setUsers(wl.uniq());
			}
		})
		.catch(function (e) {
			console.error(e);
			alert(e);
		})
		.then(function () {
			$btn.textContent = text;
		});
	}
	getPage(1);
}
function getGallery(e) {
	var username = Utils.getUsername();
	if (!username) return;
	
	var $btn = e.target;
	var text = $btn.textContent;
	$btn.textContent = 'Fetching...';
	
	var items = Editor.getSubmissions();
	function getPage(p) {
		return fetch('http://faexport.boothale.net/user/' + username + '/gallery.json' + (p>1?'?page='+p:''))
		.then(function (x) {return x.json()})
		.then(function (submissions) {
			$btn.textContent = 'Fetching (page ' + p + ')...';
			console.log('Got page ' + p + ' of ' + username + '\'s gallery, ' + submissions.length + ' items');
			if (submissions.length) {
				items = items.concat(submissions);
				return getPage(p+1);
			} else {
				Editor.setSubmissions(items.uniq());
			}
		})
		.catch(function (e) {
			console.error(e);
			alert(e);
		})
		.then(function () {
			$btn.textContent = text;
		});
	}
	getPage(1);
}
function getFavorites(e) {
	var username = Utils.getUsername();
	if (!username) return;
	
	var $btn = e.target;
	var text = $btn.textContent;
	$btn.textContent = 'Fetching...';
	
	var items = Editor.getSubmissions();
	function getPage(p) {
		return fetch('http://faexport.boothale.net/user/' + username + '/favorites.json' + (p>1?'?page='+p:''))
		.then(function (x) {return x.json()})
		.then(function (favorites) {
			$btn.textContent = 'Fetching (page ' + p + ')...';
			console.log('Got page ' + p + ' of ' + username + '\'s favorites, ' + favorites.length + ' items');
			if (favorites.length) {
				items = items.concat(favorites);
				return getPage(p+1);
			} else {
				Editor.setSubmissions(items.uniq());
			}
		})
		.catch(function (e) {
			console.error(e);
			alert(e);
		})
		.then(function () {
			$btn.textContent = text;
		});
	}
	getPage(1);
}

// Notifications
function Notify(title, message, iconUrl) {
	try {
		// https://developer.mozilla.org/en-US/docs/Web/API/notification
		if (Notification.permission == 'granted') {
			return new Notification(title, {
				body: message,
				icon: iconUrl
			});
		} else if (Notification.permission != 'denied') {
			Notification.requestPermission(function (permission) {
				return Notify.apply(null, arguments);
			});
		}
	} catch (e) {
		console.error(e);
		console.log('Notifications are not supported.');
	}
}

Notification.requestPermission();

// Storage (temp placeholder)
if (typeof GM === 'undefined') {
	GM = {
		data: {},
		getValue: function (id, defaultValue) {
			console.log('[TEMP] getValue:', id);
			return Promise.resolve(this.data[id] || defaultValue);
		},
		setValue: function (id, value) {
			console.warn('The Greasemonkey storage API is not supported. Data you save will be deleted when the page is closed!');
			console.log('[TEMP] setValue:',id, value);
			return Promise.resolve(this.data[id] = value);
		},
		deleteValue: function (id) {
			console.log('[TEMP] deleteValue:', id);
			return Promise.resolve(delete this.data[id]);
		},
		listValues: function () {
			console.log('[TEMP] listValues');
			return Promise.resolve(Object.keys(this.data));
		}
	};
}


// ===== Internationalization =====

var i18n = {
	locale: 'en-us',
	DEFAULT_LOCALE: 'en-us',
	get: function (messageID, substitutions) {
		var messageObj = LOCALES[i18n.locale][messageID];
		if (messageObj) {
			var localizedMessage = messageObj.message;
			var placeholders = messageObj.placeholders;
			if (placeholders) {
				for (var key in placeholders) {
					var missingSubs = false;
					var content = placeholders[key].content.replace(/\$(\d+)/g, function (match, i) {
						i = Number(i) - 1;
						if (typeof (substitutions[i]) === 'undefined') {
							missingSubs = true;
							return '';
						}
						return substitutions[i];
					});
					if (missingSubs) content = placeholders[key].default;
					localizedMessage = localizedMessage.replace('$' + key + '$', content);
				}
			}
			return localizedMessage;
		} else {
			console.error('Unknown i18n message',messageID,'for the locale',i18n.locale);
			return messageID;
		}
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
		$root = $root || document.body;
		$root.select('[data-i18n]').forEach(i18n.localizeElement);
	}
};


// ===== Filter =====

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
		if (typeof(data.options.enabled) === 'boolean') {
			this.options.active = data.options.enabled;
		}
	},
	size: function () {
		return this.users.length + this.submissions.length;
	},
	createTag: function () {
		var $text = html('span', {}, this.name).addClassName('text');
		var $tag = html('span', {}, $text);
		return this.updateTag($tag);
	},
	updateTag: function ($tag) {
		if ($tag == null) return this.createTag();
		
		var enabled = this.options.active;
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
	active:    true,  // enables the filter
	
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


// ===== Target Classes =====

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
		var regex = new RegExp('\\b' + keywords.join('|') + '\\b', 'i');
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
				if (!filter.options.active || !this.hasTag(ID)) continue;
				
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


// ===== Scraper =====

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
			return Utils.sanitizeUsername(temp[3]);
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
			var name = Utils.sanitizeUsername($thing.textContent);
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
			try {
				var $submissionImg  = $('submissionImg');
				var $submissionTags = $('keywords');
				var id = URL[3];
				var submission = getSubmission(id);
				submission.addNode($submissionImg, 'thumbnail', true);
				submission.addNode($submissionTags, 'link');
				
				var $submissionOwner = body.select('div.classic-submission-title>'+USER_LINK,'div.submission-title>span>a')[0];
				profileName = resolveUsername($submissionOwner);
				profileUser = users[profileName];
				profileUser.addSubmission(submission);
				
				// submission previews
				$contentItems.forEach(processSubmissionFigures);
			} catch (e) {
				console.error(e);
			}
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
function findSearchBox() {
	var $searchBar = document.querySelector('.search-box-container');
	if (!$searchBar) {
		// beta design
		$searchBar = document.querySelector('#searchbox').parentElement;
	}
	return $searchBar;
}


// ===== Editor =====

var Editor = {
	$container: null,
	$newFilter: null,
	$saveFilter: null,
	$copyFilter: null,
	$loadFilter: null,
	$deleteFilter: null,
	$exportFilter: null,
	$importFilter: null,
	$fileImporter: null,
	$filterDropdown: null,
	$filterName: null,
	$filterID: null,
	$filterColor: null,
	$filterTextColor: null,
	$filterType: null,
	$filterTagPreview: null,
	$filterUsers: null,
	$filterUsersLength: null,
	$filterSubmissions: null,
	$filterSubmissionsLength: null,
	$filterKeywords: null,
	$filterOptions: null,
	$filterEnabled: null,
	initFromDocument($root) {
		$root = $root || document.body;
		//console.log('Initializing Editor from root:',$root);

		Editor.$container = $root;
		Editor.$newFilter    = $($root.querySelector('#new-filter'));
		Editor.$saveFilter   = $($root.querySelector('#save-filter'));
		Editor.$copyFilter   = $($root.querySelector('#copy-filter'));
		Editor.$loadFilter   = $($root.querySelector('#load-filter'));
		Editor.$deleteFilter = $($root.querySelector('#delete-filter'));
		Editor.$exportFilter = $($root.querySelector('#export-filter'));
		Editor.$importFilter = $($root.querySelector('#import-filter'));
		Editor.$fileImporter = $($root.querySelector('#import'));
		Editor.$filterDropdown = $($root.querySelector('#filter-dropdown'));
		Editor.$filterName       = $($root.querySelector('#name'));
		Editor.$filterID         = $($root.querySelector('#id'));
		Editor.$filterColor      = $($root.querySelector('#color'));
		Editor.$filterTextColor  = $($root.querySelector('#color-text'));
		Editor.$filterType       = $($root.querySelector('#type'));
		Editor.$filterTagPreview = $($root.querySelector('#tag-preview'));
		Editor.$filterUsers             = $($root.querySelector('#users'));
		Editor.$filterUsersLength       = $($root.querySelector('#content-length-users'));
		Editor.$filterSubmissions       = $($root.querySelector('#submissions'));
		Editor.$filterSubmissionsLength = $($root.querySelector('#content-length-submissions'));
		Editor.$filterKeywords          = $($root.querySelector('#keywords'));
		Editor.$filterOptions = $A($root.querySelectorAll('input[type="checkbox"]'));
		Editor.$filterEnabled = $($root.querySelector('#active'));
		
		Editor.addEventHandlers();
		
		return Editor.$container;
	},
	addEventHandlers: function () {
		//console.log('Adding event handlers to Editor');
		Editor.$container.addEventListener('keydown', function (e) {
			// check for shortcuts, i.e. Ctrl+S (save), Ctrl+E (export), Ctrl+I (import)
			if (e.ctrlKey || e.metaKey) {
				switch (e.key.toLowerCase()) {
					case 's':
						e.preventDefault();
						e.stopPropagation();
						if (e.altKey) {
							Editor.saveAsCopy();
						} else {
							Editor.save();
						}
						break;
					case 'q':
						e.preventDefault();
						e.stopPropagation();
						window.close();
						break;
					case 'x':
						e.preventDefault();
						e.stopPropagation();
						Editor.delete();
						break;
					case 'e':
						e.preventDefault();
						e.stopPropagation();
						Editor.export();
						break;
					case 'i':
						e.preventDefault();
						e.stopPropagation();
						Editor._import();
						break;
					// TODO: add more shortcuts?
				}
			}
		});
		Editor.$container.whenChanged(Editor.changeHappened).whenKeyPressed(Editor.changeHappened);
		Editor.$newFilter.whenClicked(Editor.reset);
		Editor.$saveFilter.whenClicked(Editor.save);
		Editor.$copyFilter.whenClicked(Editor.saveAsCopy);
		Editor.$loadFilter.whenClicked(Editor.listFiltersInDropdown);
		Editor.$deleteFilter.whenClicked(Editor.delete);
		Editor.$exportFilter.whenClicked(Editor.export);
		Editor.$importFilter.whenClicked(Editor._import);
		Editor.$fileImporter.observe('change', Editor.import);
		Editor.$filterDropdown.whenChanged(Editor.loadSelectedFilter);
		Editor.$filterUsers.whenKeyPressed(Editor.updateUserContentLength);
		Editor.$filterSubmissions.whenKeyPressed(Editor.updateSubmissionContentLength);
		$(Editor.$container.querySelector('#clean-sort-users')).whenClicked(Editor.cleanAndSortUserContents);
		$(Editor.$container.querySelector('#clean-sort-submissions')).whenClicked(Editor.cleanAndSortSubmissionContents);
		$(Editor.$container.querySelector('#get-watchlist')).whenClicked(getWatchlist);
		$(Editor.$container.querySelector('#get-submissions')).whenClicked(getGallery);
		$(Editor.$container.querySelector('#get-favorites')).whenClicked(getFavorites);
		Editor.$filterName.whenKeyPressed(Editor.updateTagPreview);
		Editor.$filterColor.whenChanged(Editor.updateTagPreview);
		Editor.$filterTextColor.whenChanged(Editor.updateTagPreview);
		$(Editor.$container.querySelector('#random-color')).whenClicked(Editor.randomColor, Editor.$filterColor);
		$(Editor.$container.querySelector('#random-text-color')).whenClicked(Editor.randomColor, Editor.$filterTextColor);
		Editor.$filterEnabled.whenChanged(Editor.updateTagPreview);
		$(Editor.$container.querySelector('#matchName')).whenChanged(Editor.updateTagPreview);
		$(Editor.$container.querySelector('#matchTitle')).whenChanged(Editor.updateTagPreview);
	},
	
	changesSaved: true,
	changeHappened: function (e) {
		Editor.changesSaved = false;
	},
	changeWasSaved: function () {
		Editor.changesSaved = true;
	},
	getID: function () {
		return Editor.$filterID.textContent;
	},
	setID: function (id) {
		Editor.$filterID.textContent = id;
	},
	getName: function () {
		return Editor.$filterName.value || Editor.$filterName.placeholder;
	},
	setName: function (name) {
		Editor.$filterName.value = name;
	},
	getType: function () {
		return Number(Editor.$filterType.value);
	},
	setType: function (type) {
		Editor.$filterType.value = Number(type);
	},
	getColor: function () {
		return Editor.$filterColor.value;
	},
	setColor: function (color) {
		Editor.$filterColor.value = color;
	},
	getTextColor: function () {
		return Editor.$filterTextColor.value;
	},
	setTextColor: function (color) {
		Editor.$filterTextColor.value = color;
	},
	getUsers: function () {
		var value = Editor.$filterUsers.value.trim();
		return value ? value.split('\n').map(Utils.sanitizeUsername).compact() : [];
	},
	setUsers: function (users) {
		Editor.$filterUsers.value = Object.isArray(users) ? users.join('\n')  : users || '';
		Editor.updateUserContentLength();
	},
	getSubmissions: function () {
		var value = Editor.$filterSubmissions.value.trim();
		return value ? value.split('\n').map(Utils.sanitizeSubmissionID).compact() : [];
	},
	setSubmissions: function (submissions) {
		Editor.$filterSubmissions.value = Object.isArray(submissions) ? submissions.join('\n')  : submissions || '';
		Editor.updateSubmissionContentLength();
	},
	getKeywords: function () {
		var value = Editor.$filterKeywords.value.trim();
		return value ? value.split('\n').compact() : [];
	},
	setKeywords: function (keywords) {
		Editor.$filterKeywords.value = Object.isArray(keywords) ? keywords.join('\n')  : keywords || '';
	},
	getEnabled: function () {
		return onOff(Editor.$filterEnabled.checked);
	},
	setEnabled: function (enabled) {
		Editor.$filterEnabled.checked = enabled;
	},
	getOptions: function () {
		var options = {};
		Editor.$filterOptions.forEach(function ($o) {
			options[$o.id] = onOff($o.checked);
		});
		return options;
	},
	setOptions: function (options) {
		Editor.$filterOptions.forEach(function ($o) {
			var id = $o.id;
			$o.checked = id in options ?
				options[id] :
				Filter.DEFAULT_OPTIONS[id];
		});
	},
	update: function (filter, forceChange) {
		//console.log('Updating Editor:',filter,forceChange);
		if (filter && (Editor.changesSaved || forceChange)) {
			if (typeof filter === 'object') {
				Editor.setID(filter.id);
				Editor.setName(filter.name);
				Editor.setColor(filter.color);
				Editor.setTextColor(filter.tcolor);
				Editor.setType(filter.type);
				Editor.setUsers(filter.users);
				Editor.setSubmissions(filter.submissions);
				Editor.setKeywords(filter.keywords);
				Editor.setOptions(filter.options);
			} else if (typeof filter === 'string') {
				Editor.setUsers(filter);
			}
		}
		Utils.setHash(Editor.getID());
		Editor.updateTagPreview();
	},
	updateUserContentLength: function () {
		var value = Editor.getUsers();
		Editor.$filterUsersLength.textContent = value.length;
	},
	updateSubmissionContentLength: function () {
		var value = Editor.getSubmissions();
		Editor.$filterSubmissionsLength.textContent = value.length;
	},
	updateTagPreview: function () {
		//console.log('Updating Tag Preview');
		var name    = Editor.getName();
		var color   = Editor.getColor();
		var tcolor  = Editor.getTextColor();
		var enabled = Editor.getEnabled();
		var auto    = onOff($('matchName').checked) || onOff($('matchTitle').checked);
		Editor.$filterTagPreview.querySelector('span.text').textContent = name;
		if (!enabled) name += ' (disabled)';
		Editor.$filterTagPreview.setAttribute('title', name);
		Editor.$filterTagPreview.setStyle({backgroundColor: color, borderColor: color, color: tcolor});
		if (enabled) {
			Editor.$filterTagPreview.removeClassName('disabled');
			if (auto) {
				Editor.$filterTagPreview.addClassName('auto');
			} else {
				Editor.$filterTagPreview.removeClassName('auto');
			}
		} else {
			Editor.$filterTagPreview.addClassName('disabled');
			Editor.$filterTagPreview.removeClassName('auto');
		}
	},
	cleanAndSortUserContents: function () {
		//console.log('Cleaning and sorting users');
		Editor.setUsers(Editor.getUsers().map(Utils.sanitizeUsername).uniq().sort());
		Editor.updateUserContentLength();
	},
	cleanAndSortSubmissionContents: function () {
		//console.log('Cleaning and sorting submissions');
		Editor.setSubmissions(Editor.getSubmissions().map(Utils.sanitizeSubmissionID).uniq().sort());
		Editor.updateSubmissionContentLength();
	},
	generateID: function () {
		//console.log('Generating new Filter ID');
		Editor.setID(Filter.generateID());
	},
	randomColor: function (e, $color) {
		//console.log('Generating random color');
		var color = (0xFFFFFF * Math.random()) | 0;
		$color.value = Utils.cssColor(color)
		Editor.updateTagPreview();
		Editor.changeHappened();
	},
	reset: function () {
		//console.log('Resetting Editor');
		Editor.setID('');
		Editor.setName('');
		Editor.setColor(Filter.DEFAULT_COLOR);
		Editor.setTextColor(Filter.DEFAULT_TEXT_COLOR);
		Editor.setType(Filter.BLACKLIST);
		Editor.setUsers('');
		Editor.setSubmissions('');
		Editor.setKeywords('');
		Editor.setOptions(Filter.DEFAULT_OPTIONS);
		Editor.changesSaved = false;
		Editor.update();
	},
	serialize: function () {
		//console.log('Serializing Editor');
		return {
			name:        Editor.getName(),
			id:          Editor.getID(),
			color:       Editor.getColor(),
			tcolor:      Editor.getTextColor(),
			type:        Editor.getType(),
			
			users:       Editor.getUsers(),
			submissions: Editor.getSubmissions(),
			keywords:    Editor.getKeywords(),
			
			options:     Editor.getOptions()
		};
	},
	save: function () {
		//console.log('Saving Editor as Filter');
		if (!Editor.getID()) {
			Editor.generateID();
		}
		Utils.setHash(Editor.getID());
		Editor.changeWasSaved();
		App.setFilter(Editor.serialize());
	},
	saveAsCopy: function () {
		//console.log('Creating Copy of Filter');
		Editor.generateID();
		Editor.save();
	},
	load: function (ID) {
		//console.log('Loading Filter:',ID);
		if (!Editor.changesSaved && confirm(i18n.get('confirmDiscard'))) {
			Editor.save();
		}
		Editor.update(Filters[ID], true);
	},
	loadFromHash: function () {
		//console.log('Loading Filter from Hash');
		var id = Utils.getHash();
		if (id) {
			Editor.setID(id);
			// avoid loading an existing filter if there were changes made
			if (!Editor.changesSaved) return;
			Editor.load(id);
		} else {
			Editor.update();
		}
	},
	loadSelectedFilter: function (e) {
		var selected = e.target.value;
		if (selected) {
			Editor.load(selected);
		}
		Editor.$filterDropdown.hide();
	},
	delete: function () {
		//console.log('Deleting loaded Filter');
		var id = Editor.getID();
		var message = i18n.get('confirmDelete', [Editor.getName()||id||undefined]);
		if (id && confirm(message)) {
			App.deleteFilter(id);
			Editor.reset();
		}
	},
	_import: function () {
		Editor.$fileImporter.click();
	},
	import: function () {
		//console.log('Importing Filter');
		importFile(Editor.$fileImporter.files[0], function (contents) {
			var data;
			try {
				try {
					data = JSON.parse(contents);
				} catch (e) {
					data = contents;
				}
				Editor.update(data, true);
				Editor.changeHappened();
			} catch (e) {
				alert(e);
			}
		});
	},
	export: function () {
		//console.log('Exporting Filter');
		exportFile(Editor.getName() + '.json', Editor.serialize());
	},
	listFiltersInDropdown: function () {
		if (Editor.$filterDropdown.style.display == 'none') {
			//console.log('Populating Filter Dropdown');
			Utils.populateDropdown(Editor.$filterDropdown, Filters, i18n.get('editorSelectFilter'));
			Editor.$filterDropdown.show();
		} else {
			Editor.$filterDropdown.hide();
		}
	},
	catchUnsavedChanges: function (e) {
		if (!Editor.changesSaved) {
			return e.returnValue = 'You have unsaved changes! Are you sure you want to close the window?';
		}
	}
};


// ===== Options =====

var Options = {};

var OptionsForm = {
	$container: null,
	$options: null,
	$resetOptions: null,
	$resetApp: null,
	$importAppData: null,
	$appDataImporter: null,
	$exportAppData: null,
	
	initFromDocument: function ($root) {
		$root = $root || document.body;
		//console.log('Initializing Options Form from root:',$root);

		OptionsForm.$container    = $root;
		OptionsForm.$options      = $A($root.querySelectorAll('.option'));
		OptionsForm.$resetOptions = $root.querySelector('#reset-options');
		OptionsForm.$resetApp     = $root.querySelector('#reset-app');
		OptionsForm.$importAppData = $root.querySelector('#import-app-data');
		OptionsForm.$exportAppData = $root.querySelector('#export-app-data');
		OptionsForm.$appDataImporter = $root.querySelector('#app-importer');
		
		OptionsForm.addEventHandlers();
		
		return OptionsForm.$container;
	},
	addEventHandlers: function () {
		//console.log('Adding event handlers to Options Form');
		OptionsForm.$container.addEventListener('change', OptionsForm.save, false);
		OptionsForm.$resetOptions.addEventListener('click', OptionsForm.reset, false);
		OptionsForm.$resetApp.addEventListener('click', OptionsForm.resetApp, false);
		OptionsForm.$exportAppData.addEventListener('click', App.export, false);
		OptionsForm.$importAppData.addEventListener('click', function (e) {
			Options.$appDataImporter.click();
		}, false);
		OptionsForm.$appDataImporter.observe('change', function () {
			importFile(OptionsForm.$appDataImporter.files[0], function (contents) {
				var data;
				try {
					try {
						data = JSON.parse(contents);
					} catch (e) {
						data = contents;
					}
					App.import(data);
					reload.defer();
				} catch (e) {
					alert(e);
				}
			});
		});
	},
	serialize: function () {
		//console.log('Serializing Options');
		var options = {};
		OptionsForm.$options.forEach(function ($o) {
			if ($o.type == 'checkbox') {
				options[$o.id] = onOff($o.checked);
			} else {
				options[$o.id] = $o.value;
			}
		});
		return options;
	},
	update: function () {
		//console.log('Updating Options Form:', Options);
		OptionsForm.$options.forEach(function ($o) {
			if ($o.type == 'checkbox') {
				$o.checked = Options[$o.id];
			} else {
				$o.value = Options[$o.id];
			}
		});
	},
	save: function () {
		var options = OptionsForm.serialize();
		for (var k in options) {
			Options[k] = options[k];
		}
		var localeChanged = Options.locale != i18n.locale;
		//console.log('Saving Options:', Options);
		App.saveOptionsAndUpdate();
		if (localeChanged) {
			App.applyLocalization();
			List.update();
		}
	},
	reset: function () {
		//console.log('Resetting Options Form');
		App.resetOptions();
		App.saveOptionsAndUpdate();
	},
	resetApp: function () {
		//console.log('Confirming App Reset');
		if (confirm(i18n.get('confirmEraseData'))) {
			App.resetApp();
			reload.defer();
		}
	}
};


// ===== User/Submission List =====

var List = {
	$container: null,
	$searchBar: null,
	$searchBarContainer: null,
	$usersTitle: null,
	$usersAddAllDropdown: null,
	$usersRemoveAllDropdown: null,
	$usersGlobalContainer: null,
	$usersTable: null,
	$subsTitle: null,
	$subsAddAllDropdown: null,
	$subsRemoveAllDropdown: null,
	$subsGlobalContainer: null,
	$subsTable: null,
	$usersPlaceholder: null,
	$subsPlaceholder: null,
	$placeholderAddAllUsers: null,
	$placeholderRemoveAllUsers: null,
	$placeholderAddAllSubs: null,
	$placeholderRemoveAllSubs: null,
	
	create: function ($root) {
		$root = $root || document.body;
		//console.log('Creating Target List from root:',$root);

		List.$container = html('div', {id: 'list'}, [
			List.$searchBarContainer = html('div', {id: 'search'}, [
				List.$searchBar = html('input', {type: 'textbox', id: 'searchbar', 'data-i18n': 'searchPlaceholder,placeholder'})
			]),
			List.$usersGlobalContainer = html('div', {id: 'users-global'}, [
				List.$usersTitle             = html('h3', {'data-i18n': 'users'}),
				List.$usersAddAllDropdown    = html('select', {id: 'users-add-all'}), 
				List.$usersRemoveAllDropdown = html('select', {id: 'users-remove-all'})
			]),
			List.$usersTable = html('div', {id: 'users'}).addClassName('group'),
			List.$subsGlobalContainer = html('div', {id: 'submissions-global'}, [
				List.$subsTitle              = html('h3', {'data-i18n': 'submissions'}), 
				List.$subsAddAllDropdown     = html('select', {id: 'submissions-add-all'}), 
				List.$subsRemoveAllDropdown  = html('select', {id: 'submissions-remove-all'})
			]),
			List.$subsTable = html('div', {id: 'submissions'}).addClassName('group')
		]);
		
		List.addEventHandlers();
		
		if ($root) {
			$root.appendChild(List.$container);
		}
		return List.$container;
	},
	initFromDocument: function ($root) {
		$root = $root || document.body;
		//console.log('Initializing Target List from root:',$root);
		
		List.$container              = $root;
		List.$searchBarContainer     = $root.querySelector('#search');
		List.$searchBar              = List.$searchBarContainer.querySelector('#searchbar');
		List.$usersGlobalContainer   = $root.querySelector('#users-global');
		List.$usersTitle             = List.$usersGlobalContainer.querySelector('h3');
		List.$usersAddAllDropdown    = List.$usersGlobalContainer.querySelector('#users-add-all');
		List.$usersRemoveAllDropdown = List.$usersGlobalContainer.querySelector('#users-remove-all');
		List.$usersTable             = $root.querySelector('#users');
		List.$subsGlobalContainer    = $root.querySelector('#submissions-global');
		List.$subsTitle              = List.$subsGlobalContainer.querySelector('h3');
		List.$subsAddAllDropdown     = List.$subsGlobalContainer.querySelector('#submissions-add-all');
		List.$subsRemoveAllDropdown  = List.$subsGlobalContainer.querySelector('#submissions-remove-all');
		List.$subsTable              = $root.querySelector('#submissions');
		
		List.addEventHandlers();
		
		return List.$container;
	},
	addEventHandlers: function () {
		//console.log('Adding event handlers to Target List UI');
		// update table when keys are entered in the search bar
		List.$searchBar.whenKeyPressed(function (e) {
			List.search(e.target.value);
		});
		// handle global dropdown changes
		List.$usersAddAllDropdown.whenChanged(function (e) {
			var ID = e.target.value;
			if (ID) {
				Page.addTargetsToFilter(Users, ID);
				e.target.value = '';
			}
		});
		List.$usersRemoveAllDropdown.whenChanged(function (e) {
			var ID = e.target.value;
			if (ID) {
				Page.removeTargetsFromFilter(Users, ID);
				e.target.value = '';
			}
		});
		List.$subsAddAllDropdown.whenChanged(function (e) {
			var ID = e.target.value;
			if (ID) {
				Page.addTargetsToFilter(Submissions, ID);
				e.target.value = '';
			}
		});
		List.$subsRemoveAllDropdown.whenChanged(function (e) {
			var ID = e.target.value;
			if (ID) {
				Page.removeTargetsFromFilter(Submissions, ID);
				e.target.value = '';
			}
		});
	},
	init: function () {
		//console.log('Initializing Target List');
		List.$usersTable.removeChildren();
		List.$subsTable.removeChildren();
		
		for (var name in Users) {
			createTableRow(List.$usersTable, Users[name]);
		}
		for (var id in Submissions) {
			createTableRow(List.$subsTable, Submissions[id]);
		}
		
		function createTableRow($table, target) {
			var $link      = target.createLink();
			var $container = target.tagsContainer;
			var $dropdown  = html('select', {}).addClassName('add-tag').whenChanged(function (e,t) {
				var f = e.target.value;
				if (f) {
					Page.addTargetToFilter(t,f);
					e.target.value = '';
				}
			}, target);
			var $row = html('div', {id: target.id}, [$link, $container, $dropdown]).addClassName('row');
			
			$table.appendChild($row);
			return $row;
		}
		
		// placeholders
		List.$usersPlaceholder = html('span', {id: 'user-placeholder', 'data-i18n': 'usersPlaceholder'});
		List.$subsPlaceholder  = html('span', {id: 'submission-placeholder', 'data-i18n': 'submissionsPlaceholder'});
		List.$usersTable.appendChild(List.$usersPlaceholder);
		List.$subsTable.appendChild(List.$subsPlaceholder);

		List.$placeholderAddAllUsers    = html('option', {'data-i18n':'listAddAll'}, i18n.get('listAddAll'));
		List.$placeholderRemoveAllUsers = html('option', {'data-i18n':'listRemoveAll'}, i18n.get('listRemoveAll'));
		List.$placeholderAddAllSubs     = html('option', {'data-i18n':'listAddAll'}, i18n.get('listAddAll'));
		List.$placeholderRemoveAllSubs  = html('option', {'data-i18n':'listRemoveAll'}, i18n.get('listRemoveAll'));
	},
	update: function () {
		//console.log('Updating Target List');
		Utils.populateDropdown(List.$usersAddAllDropdown,    Filters, List.$placeholderAddAllUsers);
		Utils.populateDropdown(List.$usersRemoveAllDropdown, Filters, List.$placeholderRemoveAllUsers);
		Utils.populateDropdown(List.$subsAddAllDropdown,     Filters, List.$placeholderAddAllSubs);
		Utils.populateDropdown(List.$subsRemoveAllDropdown,  Filters, List.$placeholderRemoveAllSubss);
		
		List.$usersTable.childElements().invoke('hide');
		List.$subsTable.childElements().invoke('hide');
		
		var usersShowing = 0;
		var subsShowing = 0;

		var args = Array.from(arguments);
		if (args.length == 0) args.push(Users);
		
		args.forEach(processTarget);
		
		if (!usersShowing) {
			List.$usersPlaceholder.show();
		}
		if (!subsShowing) {
			List.$subsPlaceholder.show();
		}
		
		function processTarget(target) {
			if (target instanceof User) {
				processUser(target);
			} else if (target instanceof Submission) {
				processSubmission(target);
			} else if (typeof target === 'object') {
				for (var id in target) {
					processTarget(target[id]);
				}
			}
		}
		function processUser(user) {
			usersShowing++;
			updateRow(List.$usersTable, user);
			for (var sid in user.submissions) {
				subsShowing++;
				updateRow(List.$subsTable, user.submissions[sid]);
			}
		}
		function processSubmission(submission) {
			subsShowing++;
			updateRow(List.$subsTable, submission);
			if (submission.user) {
				usersShowing++;
				updateRow(List.$usersTable, submission.user);
			}
		}
		function updateRow($table, target) {
			var $row      = $table.querySelector('[id="'+target.id+'"]');
			var $dropdown = $row.querySelector('select.add-tag');
			var filters = {};
			for (var ID in Filters) {
				if (target.hasTag(ID)) {
					var $tag = target.getTagElement(ID);
					if (!$tag) continue;
					var $remove = $tag.querySelector('.remove');
					if (!$remove) {
						$remove = html('span', {}, 'x').addClassName('remove').whenClicked(function (e,t,f) {
							Page.removeTargetFromFilter(t,f);
						}, target, ID);
						$tag.appendChild($remove);
					}
				} else {
					// populate tag dropdown
					filters[ID] = Filters[ID];
				}
			}
			Utils.populateDropdown($dropdown, filters, '+');
			$row.show();
		}
	},
	search: function (text) {
		//console.log('Searching Targets:',text);
		text = String(text).toLowerCase();
		List.$usersTable.childElements().forEach(function ($row) {
			var user = Users[$row.id];
			if (!text || (user && user.id.indexOf(text) > -1)) {
				$row.show();
			} else {
				$row.hide();
			}
		});
		List.$subsTable.childElements().forEach(function ($row) {
			var submission = Submissions[$row.id];
			if (!submission) return;
			var title = submission.getTitle();
			if (!text || submission.id.indexOf(text) > -1 || (title && title.toLowerCase().indexOf(text) > -1)) {
				$row.show();
			} else {
				$row.hide();
			}
		});
	}
};


// ==== Filter List =====

var FilterList = {
	$container: null,
	$source: null,
	$powerButton: null,
	$filterSearch: null,
	$filterTable: null,
	initFromDocument: function ($root) {
		$root = $root || document.body;
		//console.log('Initializing Filter List from root:',$root);

		FilterList.$container = $root;
		FilterList.$source = $root.querySelector('#source');
		FilterList.$powerButton = $($root.querySelector('#power-button'));
		FilterList.$filterSearch = $($root.querySelector('#searchbar'));
		//FilterList.$filterSort = $($root.querySelector('#sort-filters'));
		//FilterList.$filterResults = $($root.querySelector('#search-results'));
		FilterList.$filterTable = $($root.querySelector('#filters>tbody'));
		
		FilterList.$source.setAttribute('href', SOURCE_URL);
		
		FilterList.addEventHandlers();
		
		return FilterList.$container;
	},
	addEventHandlers: function () {
		//console.log('Adding event handlers to filter list controls');
		FilterList.$powerButton.whenClicked(FilterList.toggleApp);
		FilterList.$filterSearch.whenKeyPressed(FilterList.updateSearchResults);
		//FilterList.$filterSort.whenChanged(FilterList.sort);
	},
	update: function ()  {
		//console.log('Updating Filter List');
		FilterList.$filterTable.removeChildren();
		for (var ID in Filters) {
			FilterList.$filterTable.append(FilterList.createTableRow(Filters[ID]));
		}
		if (!FilterList.$filterTable.firstElementChild) {
			// table is empty
			FilterList.$filterTable.append(FilterList.createTableRow());
		}
		FilterList.updateToggle(Options.enabled);
	},
	search: function (query) {
		//console.log('Searching Filters:',query);
		var matches = [];
		FilterList.$filterTable.childElements().forEach(function ($row) {
			var name = $row.querySelector('span.text').textContent.toLowerCase();
			var id   = $row.getAttribute('id');
			if (!query || name.indexOf(query) > -1) {
				$row.show();
				matches.push(id);
			} else {
				$row.hide();
			}
		});
		return matches;
	},
	updateSearchResults: function () {
		//console.log('Updating Filter List search results');
		var matches = FilterList.search(FilterList.$filterSearch.value.toLowerCase());
		/*
		if (matches) {
			FilterList.$filterResults.textContent = matches.length;
			FilterList.$filterResults.parentElement.show();
		} else {
			FilterList.$filterResults.parentElement.hide();
		}
		*/
	},
	sort: function () {
		//console.log('Sorting Filters');
		var sortByKey = FilterList.$filterSort.value;
		var _keys = Object.keys(Filters).sort(function (ID1, ID2) {
			var val1, val2;
			if (sortByKey == 'size') {
				val1 = Filters[ID1].size();
				val2 = Filters[ID2].size();
			} else {
				val1 = Filters[ID1][sortByKey];
				val2 = Filters[ID2][sortByKey];
			}
			return (val1 > val2) ? 1 : (val1 < val2) ? -1 : 0;
		});
		var _Filters = {};
		_keys.forEach(function (ID) {
			_Filters[ID] = Filters[ID];
		});
		Filters = _Filters;
		FilterList.update();
	},
	updateToggle: function (enabled) {
		//console.log('Toggling Power Button');
		if (enabled) {
			FilterList.$powerButton.removeClassName('disabled');
		} else {
			FilterList.$powerButton.addClassName('disabled');
		}
	},
	createTableRow: function (filter) {
		//console.log('Creating Table Row for Filter:',filter);
		var $nameColumn    = html('td');
		var $enabledColumn = html('td');
		var $optionsColumn = html('td');
		var $row = html('tr', null, [$nameColumn, $enabledColumn, $optionsColumn]).addClassName('row');
		if (filter) {
			$row.setAttribute('id', filter.id);
			var $tag = filter.createTag()
			.whenClicked(function (e) {
				Editor.load(filter.id);
				$Tabs.switchTo('#editor');
			});
			var $enable = $Switch('round', filter.options.enabled || undefined)
			.whenChanged(function (e) {
				FilterList.toggleFilter(filter.id);
				$tag.toggleClassName('disabled');
			});
			$enable.setAttribute('title', i18n.get('popupToggleFilter', [filter.name]));
			
			var $remove = html('button', {class: 'remove red'}, '✖')
			.whenClicked(function (e) {
				FilterList.delete(filter.id);
			});
			$remove.setAttribute('title', i18n.get('popupRemoveFilter', [filter.name]));
			
			$nameColumn.appendChild($tag);
			$enabledColumn.appendChild($enable);
			$optionsColumn.appendChild($remove);
		} else {
			var $placeholder = html('tr', {'colspan': 3}, i18n.get('filtersPlaceholder')).addClassName('grey');
			$nameColumn.appendChild($placeholder);
		}
		return $row;
	},
	toggleApp: function () {
		//console.log('Toggling App from Filter List');
		App.toggle();
		FilterList.updateToggle(Options.enabled);
	},
	toggleFilter: function (ID) {
		//console.log('Toggling Filter from Filter List:',ID);
		App.toggleFilter(ID);
	},
	delete: function (ID) {
		//console.log('Deleting Filter from Filter List:',ID);
		var name = Filters[ID].name;
		if (confirm(i18n.get('confirmDelete', [name]))) {
			App.deleteFilter(ID);
			FilterList.querySelector('tr[id="'+ID+'"]').remove();
		}
	}
};


// ===== Page Functions =====

var Page = {
	INITIAL_LOAD: true,
	LoggedInUser: null,
	clear: function () {
		//console.log('Clearing Page Caches');
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
	init: function () {
		//console.log('Initializing Page');
		Page.clear();
		//console.log('Scraping Webpage');
		var data = scrape(document);
		Users             = data.users;
		Submissions       = data.submissions;
		Page.LoggedInUser = data.logged_in_user;
		List.init();
		
		// show the app window when any node is hovered over
		Page.addEventHandlers();
	},
	addEventHandlers: function () {
		//console.log('Adding event handlers to page nodes');
		function e(node) {
			node.hoverTarget.whenHovered(1000, function () {
				List.search(node.target.id);
			});
		}
		for (var name in Users) {
			Users[name].nodes.forEach(e);
		}
		for (var id in Submissions) {
			Submissions[id].nodes.forEach(e);
		}
		if (Page.LoggedInUser) {
			Page.LoggedInUser.nodes.forEach(e);
		}
	},
	update: function () {
		//console.log('Updating Page');
		Page.updateTags();
		if (Options.enabled) {
			if (Page.INITIAL_LOAD || Options.alwaysScan) {
				Page.INITIAL_LOAD = false;
				App.updateFilters(Page.scanContent(Filters));
			}
			Page.apply(App.getAppData());
		} else {
			Page.backToNormal();
		}
		List.update();
	},
	updateTags: function () {
		//console.log('Updating Tags');
		for (var name in Users) {
			Users[name].updateTags(Filters);
		}
		for (var id in Submissions) {
			Submissions[id].updateTags(Filters);
		}
	},
	backToNormal: function () {
		//console.log('Resetting page to normal');
		for (var name in Users) {
			Users[name].showNodes();
		}
		for (var id in this.Submissions) {
			Submissions[id].showNodes();
		}
	},
	scanContent: function (filters) {
		//console.log('Scanning page content');
		
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
		//console.log('Applying Filters');
		// show/hide by applying filter options (it's faster this way)
		for (var name in Users) {
			Users[name].apply(data);
		}
		for (var id in Submissions) {
			Submissions[id].apply(data);
		}
	},
	addTargetToFilter: function (target, ID) {
		//console.log('Adding Target to Filter:',target,ID);
		target.addTag(ID);
		App.addToFilter({
			filter: ID,
			target: target.id,
			type: target.type
		});
		Page.update.defer();
	},
	removeTargetFromFilter: function (target, ID) {
		//console.log('Removing Target from Filter:',target,ID);
		target.removeTag(ID);
		App.removeFromFilter({
			filter: ID,
			target: target.id,
			type: target.type
		});
		Page.update.defer();
	},
	addTargetsToFilter: function (targets, ID) {
		//console.log('Adding Targets to Filter:',targets,ID);
		var type;
		for (var id in targets) {
			targets[id].addTag(ID);
			type = targets[id].type;
		}
		App.addAllToFilter({
			filter: ID,
			targets: Object.keys(targets),
			type: type
		});
		Page.update.defer();
	},
	removeTargetsFromFilter: function (targets, ID) {
		//console.log('Removing Targets from Filter:',targets,ID);
		var type;
		for (var id in targets) {
			targets[id].removeTag(ID);
			type = targets[id].type;
		}
		App.removeAllFromFilter({
			filter: ID,
			targets: Object.keys(targets),
			type: type
		});
		Page.update.defer();
	},
	addTargetToFilters: function (target, IDs) {
		//console.log('Adding Target to Filters:',target,IDs);
		IDs.forEach(function (ID) {
			target.addTag(ID);
		});
		App.addToFilters({
			filters: IDs,
			target: target.id,
			type: target.type
		});
		Page.update.defer();
	},
	removeTargetFromFilters: function (target, IDs) {
		//console.log('Removing Target from Filters:',target,IDs);
		IDs.forEach(function (ID) {
			target.removeTag(ID);
		});
		App.removeFromFilters({
			filter: IDs,
			target: target.id,
			type: target.type
		});
		Page.update.defer();
	}
};


// ===== Main Functions =====

var App = {
	$app: null,
	DEFAULT_OPTIONS: {
		'locale': 'en-us',
		'enabled': true,
		'alwaysScan': false,
		'autoSort': false,
		'firstItem': false,
		'notifications': true
	},
	init: function () {
		//console.log('Initializing App');
		Page.init();
		App.load().then(App.applyLocalization);
	},
	update: function () {
		//console.log('Updating App');
		OptionsForm.update();
		FilterList.update();
		Page.update();
	},
	applyLocalization: function () {
		i18n.locale = Options.locale in LOCALES ? Options.locale : i18n.DEFAULT_LOCALE;
		i18n.localizeDocument(App.$app);
	},
	getAppData: function () {
		//console.log('Getting App Data');
		return {filters: Filters, options: Options};
	},
	updateFilters: function (filterChanges) {
		//console.log('Updating Filters:', filterChanges);
		var change = false, users = [], submissions = [];
		for (var ID in filterChanges) {
			var _filter = filterChanges[ID];
			var filter = Filters[ID];
			var newUsers = _filter.users.length > 0;
			var newSubs = _filter.submissions.length > 0;
			change |= newUsers || newSubs;
			if (newUsers) {
				filter.addUsers(_filter.users);
				users = users.concat(_filter.users);
			}
			if (newSubs) {
				filter.addSubmissions(_filter.submissions);
				submissions = submissions.concat(_filter.submissions);
			}
		}
		if (change) {
			// sort the users and submissions arrays of the updated filters
			if (Options.autoSort) {
				for (var ID in filterChanges) {
					var filter = Filters[ID];
					filter.users = filter.users.sort();
					filter.submissions = filter.submissions.sort();
				}
			}
			
			// save changes
			App.saveFilters();
			Page.update();
			
			// notify the user of the changes
			if (Options.notifications) {
				Notify(
					App.TITLE + ' - ' + i18n.get('mainScanResults'),
					(users.length ? ('Users (' + users.length + '):\n' + users.join(', ') + '\n\n') : '') + 
					(submissions.length ? ('Submissions (' + submissions.length + '):\n' + submissions.join(', ')) : ''),
					App.ICON
				);
			}
		}
	},
	getFilters: function (callback) {
		//console.log('Getting Filters');
		if (callback) callback(Filters);
		return Filters;
	},
	setFilters: function (filters) {
		//console.log('Setting Filters:', filters);
		for (var ID in filters) {
			Filters[ID] = new Filter(filters[ID]);
		}
		App.saveFiltersAndUpdate();
	},
	clearFilters: function () {
		//console.log('Clearing Filters')
		for (var id in Filters) {
			delete Filters[id];
		}
	},
	getFilter: function (ID, callback) {
		//console.log('Getting Filter:',ID);
		if (callback) callback(Filters[ID]);
		else return Filters[ID];
	},
	setFilter: function (filter) {
		//console.log('Setting Filter:',filter.id);
		Filters[filter.id] = new Filter(filter);
		App.saveFiltersAndUpdate();
	},
	addToFilter: function (data) {
		//console.log('Adding to Filter:', data);
		if (data.filter in Filters) {
			var filter = Filters[data.filter];
			switch (data.type) {
				case 'user':
					console.log('Added User',data.target,'to Filter',data.filter);
					filter.addUser(data.target);
					break;
				case 'submission':
					console.log('Added Submission',data.target,'to Filter',data.filter);
					filter.addSubmission(data.target);
					break;
			}
			App.saveFiltersAndUpdate();
		} else {
			console.error('Invalid Filter ID:',data.filter);
		}
	},
	removeFromFilter: function (data) {
		//console.log('Removing from filter:',data);
		if (data.filter in Filters) {
			var filter = Filters[data.filter];
			switch (data.type) {
				case 'user':
					console.log('Removed User',data.target,'from Filter',data.filter);
					filter.removeUser(data.target);
					break;
				case 'submission':
					console.log('Removed Submission',data.target,'from Filter',data.filter);
					filter.removeSubmission(data.target);
					break;
			}
			App.saveFiltersAndUpdate();
		} else {
			console.error('Invalid Filter ID:',data.filter);
		}
	},
	addToFilters: function (data) {
		//console.log('Adding to Filters:',data);
		data.filters.forEach(function (ID) {
			try {
				var filter = Filters[ID];
				switch (data.type) {
					case 'user':
						console.log('Added User',data.target,'to Filter',ID);
						filter.addUser(data.target);
						break;
					case 'submission':
						console.log('Added Submission',data.target,'to Filter',ID);
						filter.addSubmission(data.target);
						break;
				}
			} catch (e) {
				console.error('Invalid Filter ID:',ID);
			}
		});
		App.saveFiltersAndUpdate();
	},
	removeFromFilters: function (data) {
		//console.log('Removing from Filters:',data);
		data.filters.forEach(function (ID) {
			try {
				var filter = Filters[ID];
				switch (data.type) {
					case 'user':
						console.log('Removed User',data.target,'from Filter',ID);
						filter.removeUser(data.target);
						break;
					case 'submission':
						console.log('Removed Submission',data.target,'from Filter',ID);
						filter.removeSubmission(data.target);
						break;
				}
			} catch (e) {
				console.error('Invalid Filter ID:',ID);
			}
		});
		App.saveFiltersAndUpdate();
	},
	addAllToFilter: function (data) {
		//console.log('Adding all to Filter:',data);
		if (data.filter in Filters) {
			var filter = Filters[data.filter];
			switch (data.type) {
				case 'user':
					console.log('Added Users',data.targets.join(', '),'to Filter',data.filter);
					filter.addUsers(data.targets);
					break;
				case 'submission':
					console.log('Added Submissions',data.targets.join(', '),'to Filter',data.filter);
					filter.addSubmissions(data.targets);
					break;
			}
			App.saveFiltersAndUpdate();
		} else {
			console.error('Invalid Filter ID:',data.filter);
		}
	},
	removeAllFromFilter: function (data) {
		//console.log('Removing all from filter:',data);
		if (data.filter in Filters) {
			var filter = Filters[data.filter];
			switch (data.type) {
				case 'user':
					console.log('Removed Users',data.targets.join(', '),'from Filter',data.filter);
					filter.removeUsers(data.targets);
					break;
				case 'submission':
					console.log('Removed Submissions',data.targets.join(', '),'from Filter',data.filter);
					filter.removeSubmissions(data.targets);
					break;
			}
			App.saveFiltersAndUpdate();
		} else {
			console.error('Invalid Filter ID:',data.filter);
		}
	},
	toggleFilter: function (ID, callback) {
		//console.log('Toggling Filter:',ID);
		if (ID in Filters) {
			var filter = Filters[ID];
			filter.options.enabled = !filter.options.enabled;
			App.saveFiltersAndUpdate();
			if (callback) callback(null);
		} else {
			console.error('Invalid Filter ID:',ID);
		}
	},
	delete: function (ID) {
		//console.log('Deleting Filter:',ID);
		if (ID in Filters) {
			var filter = Filters[ID];
			delete Filters[ID];
			App.saveFilters();
		} else {
			console.error('Invalid Filter ID:',ID);
		}
	},
	setOptions: function (options) {
		//console.log('Setting Options:',options);
		for (var key in Options) {
			if (key in options) {
				Options[key] = options[key];
			}
		}
	},
	resetOptions: function () {
		//console.log('Resetting Options to default');
		Object.assign(Options, App.DEFAULT_OPTIONS);
	},
	toggle: function () {
		//console.log('Toggling App:', !Options.enabled);
		Options.enabled = !Options.enabled;
		App.saveAndUpdate();
	},
	reset: function () {
		//console.log('Resetting App');
		App.clearFilters();
		App.resetOptions();
		App.saveAndUpdate();
	},
	load: function () {
		//console.log('Loading App Data');
		App.resetOptions();
		App.clearFilters();
		return GM.getValue('bl_options')
		.then(function (options) {
			if (options) {
				options = JSON.parse(options);
				App.setOptions(options);
			}
			return GM.getValue('bl_blacklists')
			.then(function (filters) {
				if (filters) {
					filters = JSON.parse(filters);
					App.setFilters(filters);
				}
				App.update();
			});
		})
		.catch(console.error);
	},
	save: function () {
		//console.log('Saving App Data');
		App.saveOptions();
		App.saveFilters();
	},
	saveAndUpdate: function () {
		App.save();
		App.update();
	},
	saveOptions: function () {
		//console.log('Saving Options');
		return GM.setValue('bl_options', JSON.stringify(Options)).catch(console.error);
	},
	saveOptionsAndUpdate: function () {
		App.saveOptions();
		App.update();
	},
	saveFilters: function () {
		//console.log('Saving Filters');
		return GM.setValue('bl_blacklists', JSON.stringify(Filters)).catch(console.error);
	},
	saveFiltersAndUpdate: function () {
		App.saveFilters();
		App.update();
	},
	import: function (data) {
		//console.log('Importing App Data:', data);
		App.setOptions(data.options);
		App.setFilters(data.filters);
		App.saveAndUpdate();
	},
	export: function () {
		//console.log('Exporting App Data');
		exportFile('fa-blacklist_export_'+(new Date()).toLocaleString()+'.json', App.getAppData());
	}
};


// ===== App UI Setup =====

var $Window = (function () {
	var $title  = html('h2', {id: 'window-title'}, 'FA Blacklist ' + VERSION).addClassName('drag-handle');
	var $icon   = html('img', {src: 'https://raw.githubusercontent.com/DragonOfMath/fa-blacklist-webext/master/static/fabl-32.png', id: 'icon'});
	var $hide   = html('button', {id: 'hide-app-window'}, '✖').addClassName('red');
	var $header = html('div', {id: 'window-header'}, [$icon, $title, $hide]).addClassName('drag-handle');
	var $body   = html('div', {id: 'window-body'});
	var $window = html('div', {id: 'app-window'}, [$header, $body]).addClassName('draggable').addClassName('drag-parent');
	
	$window.body = $body;

	// hide window when the 'x' is clicked
	$hide.whenClicked(function (e) {
		DragHandler.stop();
		$window.hide();
	});
	$window.hide();
	
	// insert a button into the webpage nav container
	var $show = html('li', {id:'show-app-window'}, html('a', {href:'#'}, 'FA Blacklist'));
	$show.whenClicked(function (e) {
		$window.goto({x:20,y:60});
		$window.show();
		List.update();
	});
	var $searchBar = findSearchBox();
	$searchBar.parentElement.insertBefore($show, $searchBar);
	
	return $window;
})();

List.initFromDocument(LIST);
FilterList.initFromDocument(FILTERS);
Editor.initFromDocument(EDITOR);
OptionsForm.initFromDocument(OPTIONS);

var $Tabs = $TabControl({
	'page': {
		'tab': html('span',{'data-i18n':'pageContentsTitle'}),
		'content': List.$container
	},
	'filters': {
		'tab': html('span',{'data-i18n':'filters'}),
		'content': FilterList.$container
	},
	'editor': {
		'tab': html('span',{'data-i18n':'editorTitle'}),
		'content': Editor.$container
	},
	'options': {
		'tab': html('span',{'data-i18n':'options'}),
		'content': OptionsForm.$container
	}
});

convertCheckboxesToSwitches($Tabs);
$Window.body.appendChild($Tabs);

var $App = html('div', {id: 'app'}, [STYLE, $Window]);
document.body.appendChild($App);
App.$app = $App;

window.addEventListener('load', App.init);
window.addEventListener('focus', App.load);
window.addEventListener('beforeunload', Editor.catchUnsavedChanges);

