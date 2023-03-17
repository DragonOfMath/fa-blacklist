// ==UserScript==
// @author	  DragonOfMath
// @name		FA Blacklist
// @namespace   FABlacklist
// @description UserScript implementation of the FA blacklist web extension.
// @include	 http://www.furaffinity.net/*
// @include	 https://www.furaffinity.net/*
// @version	 2.1.0
// @grant	   GM.setValue
// @grant	   GM.getValue
// @grant	   GM.deleteValue
// @grant	   GM.listValues
// @require	 https://ajax.googleapis.com/ajax/libs/prototype/1.7.3.0/prototype.js
// ==/UserScript==

var meta = {
	NAME: 'FA Blacklist',
	VERSION: '2.1.0',
	SOURCE_URL: 'https://github.com/DragonOfMath/fa-blacklist',
	ROOT: 'https://raw.githubusercontent.com/DragonOfMath/fa-blacklist/master/',
	ICON32_HREF: 'webext/static/fabl-32.png',
	ICON128_HREF: 'webext/static/fabl-128.png',
	LOCALES_HREF: 'webext/_locales/index.json',
	STYLES_HREF: 'userscript/styles.css'
};

// Storage (temp placeholder for testing purposes)
if (typeof GM === 'undefined') {
	GM = {
		data: {},
		getValue: function (id, defaultValue) {
			console.log('[TEMP] getValue:', id);
			return Promise.resolve(this.data[id] || defaultValue);
		},
		setValue: function (id, value) {
			console.warn('The Greasemonkey storage API is not supported. Data you save will be deleted when the page is closed!');
			console.log('[TEMP] setValue:', id, value);
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
		} else if (isObject(srcObj)) {
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
		has: has,
		is: is,
		isInstanceOf: isInstanceOf,
		isNull: isNull,
		isObject: isObject,
		isDefined: isDefined,
		isConstructor: isConstructor,
		isPrototype: isPrototype,
		isEnumerable: isEnumerable,
		getConstructor: getConstructor,
		getSuper: getSuper,
		getPrototype: getPrototype,
		setPrototype: setPrototype
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
		rest: rest,
		spread: spread,
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
	var uniq = Array.prototype.uniq;
	var compact = Array.prototype.compact;
	var intersect = Array.prototype.intersect;
	var without = Array.prototype.without;
	var include = Array.prototype.include;

	function union() {
		var array = Array.flatten($A(arguments));
		var u = this.slice();
		array.forEach(function (e) {
			if (!u.includes(e))
				u.push(e);
		});
		return u;
	}
	function remove(x) {
		this.splice(x, 1);
		return this;
	}
	function count(callback) {
		var c = 0;
		for (var i in this) {
			if (Object.has(this, i) && callback(this[i]))
				c++;
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
		this.forEach(function (x, i) {
			var temp = callback.call(this, accumulator, x, i);
			if (temp)
				accumulator = temp;
		});
		return accumulator;
	}
	function swap(a, b) {
		var temp = this[a];
		this[a] = this[b];
		this[b] = temp;
		return this;
	}

	return {
		unique: uniq,
		purify: compact,
		common: intersect,
		diff: without,
		union: union,
		includes: include,

		remove: remove,
		count: count,
		invoke: invoke,
		pluck: pluck,
		reduce: reduce,
		swap: swap
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
		minmax: minmax,
		randflt: randflt,
		randint: randint
	};
})());
Object.extend(Element.prototype, (function () {
	var fire = Element.prototype.fire;
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
		this.setAttribute('disabled', '');
	}
	function append() {
		var e = this;
		$A(arguments).forEach(function (x) {
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
		$(arguments).forEach(function (x) {
			if (Object.isElement(x)) {
				e.insertBefore(x, e.firstElementChild);
			} else if (Object.isObject(x) && x.tag) {
				e.insertBefore(html(x), e.firstElementChild);
			} else {
				e.insertBefore(text(x), e.firstElementChild);
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
				this.setStyleProperty(c, v[c]);
			}
		} else {
			this.setAttribute(k, v);
		}
		return this;
	}
	function setProperties(keys) {
		for (var k in keys) {
			this.setProperty(k, keys[k]);
		}
		return this;
	}
	function setStyleProperty(k, v, noVendor) {
		this.style[k] = v;
		if (!noVendor) {
			this.style['-o-' + k] = v;
			this.style['-ms-' + k] = v;
			this.style['-moz-' + k] = v;
			this.style['-webkit-' + k] = v;
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
			Object.extend(temp, this.childNodes.map(function (e) {
					return e.serialize();
				}));
		} else if (this.id) {
			o[this.id] = this.data || this.checked || this.value || this.textContent;
		}
		return o;
	}

	function position(noScrollOffset) {
		var pos = {
			x: 0,
			y: 0
		};
		if (this.offsetParent) {
			(pos = this.offsetParent.position());
		}
		pos.x += this.offsetLeft;
		pos.y += this.offsetTop;
		if (noScrollOffset) {
			pos.x -= window.scrollX;
			pos.y -= window.scrollY;
		}
		return pos;
	}
	function move(dx, dy) {
		var pos = this.position();
		this.style.left = (pos.x + dx) + 'px';
		this.style.top = (pos.y + dy) + 'px';
		return this;
	}
	function goto(pos, noScrollOffset) {
		if (Object.isElement(pos)) {
			pos = pos.position(noScrollOffset);
		}
		this.style.position = 'fixed';
		this.style.left = pos.x + 'px';
		this.style.top = pos.y + 'px';
		return this;
	}
	function isOffScreen() {
		var rect = this.getBoundingClientRect();
		return ((rect.x + rect.width) < 0 || (rect.y + rect.height) < 0 || (rect.x > window.innerWidth || rect.y > window.innerHeight));
	}
	function keepOnScreen() {
		var rect = this.getBoundingClientRect();
		var dx = (rect.left < 0) ? -rect.left : Math.min(0, window.innerWidth - rect.right);
		var dy = (rect.top < 0) ? -rect.top : Math.min(0, window.innerHeight - rect.bottom);
		return this.move(dx, dy);
	}
	function addScrollBars(maxw, maxh) {
		if (maxw) {
			this.style.overflowX = 'scroll';
			this.style.maxWidth = '' + maxw + 'px';
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
		var t0 = function () {
			e.style[style] = x0;
		};
		var t1 = function () {
			e.style[style] = x1;
		};
		this.setStyleProperty(style, x0);
		this.setStyleProperty('transition', style + ' ' + time + 'ms ' + transitionType);
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
			this.whenChanged(function () {
				if (this.checked || this.value)
					t1();
				else
					t0();
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
		return this.addStyleTransition('focus', style, time, transitionType, x0, x1);
	}
	function addHoverStyleTransition(style, time, transitionType, x0, x1) {
		return this.addStyleTransition('hover', style, time, transitionType, x0, x1);
	}
	function addActiveStyleTransition(style, time, transitionType, x0, x1) {
		return this.addStyleTransition('active', style, time, transitionType, x0, x1);
	}
	function addCheckedStyleTransition(style, time, transitionType, x0, x1) {
		return this.addStyleTransition('checked', style, time, transitionType, x0, x1);
	}

	return {
		find: find,
		enable: enable,
		disable: disable,
		append: append,
		prepend: prepend,
		appendTo: appendTo,
		removeChildren: removeChildren,
		destroy: destroy,
		setInnerHTML: setInnerHTML,
		setTextContent: setTextContent,
		setProperty: setProperty,
		setProperties: setProperties,
		appendAsProperty: appendAsProperty,
		replaceClassName: replaceClassName,
		serialize: serialize,

		position: position,
		move: move,
		goto: goto,
		isOffScreen: isOffScreen,
		keepOnScreen: keepOnScreen,
		addScrollBars: addScrollBars,

		emit: fire,
		when: observe,
		whenSubmitted: whenSubmitted,
		whenClicked: whenClicked,
		whenRightClicked: whenRightClicked,
		whenChanged: whenChanged,
		whenInputChanged: whenInputChanged,
		whenKeyPressed: whenKeyPressed,
		whenMouseEnter: whenMouseEnter,
		whenMouseExit: whenMouseExit,
		whenMouseMove: whenMouseMove,
		whenMouseDown: whenMouseDown,
		whenMouseUp: whenMouseUp,
		whenFocused: whenFocused,
		whenBlurred: whenBlurred,
		whenHovered: whenHovered,

		addStyleTransition: addStyleTransition,
		addFocusStyleTransition: addFocusStyleTransition,
		addHoverStyleTransition: addHoverStyleTransition,
		addActiveStyleTransition: addActiveStyleTransition,
		addCheckedStyleTransition: addCheckedStyleTransition
	};
})());

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
		attr = arguments[0].attr;
		tag = arguments[0].tag;
	}
	tag = defaults(tag, 'div');
	attr = defaults(attr, {});
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
		evt.initEvent("click", true, true);
		evt.synthetic = true;
		element.dispatchEvent(evt, true);
	} else if (element.fireEvent) {
		var evt = document.createEventObject();
		evt.synthetic = true;
		element.fireEvent("onclick", evt);
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
function convertToJSON(x) {
	if (typeof x === 'string') {
		return JSON.parse(x);
	}
	if (typeof x === 'object') {
		if (x.json) return x.json();
		if (x.toJSON) return x.toJSON();
	}
	return x;
}
function handleError(e, silent) {
	console.error(e);
	if (!silent) alert('An error occurred: ' + e);
}

var debug = {
	name: meta.NAME,
	format: '[$name$ | $timestamp$ | $level$] $message$',
	_level: 1,
	_log: function (message, level) {
		var params = {
			name: this.name,
			timestamp: (new Date()).toLocaleString(),
			level: level,
			message: message
		};
		var text = this.format;
		for (var key in params) {
			text = text.replace('$' + key + '$', params[key]);
		}
		console.log(text);
		return this;
	},
	log: function (msg) {
		if (debug._level > 3) {
			return debug._log(msg, 'LOG');
		}
	},
	info: function (msg) {
		if (debug._level > 2) {
			return debug._log(msg, 'INFO');
		}
	},
	warn: function (msg) {
		if (debug._level > 1) {
			return debug._log(msg, 'WARN');
		}
	},
	error: function (msg, e) {
		if (debug._level > 0) {
			debug._log(msg, 'ERROR');
			if (e) console.error(e);
		}
	},
	fatal: function (msg, e) {
		if (debug._level > -1) {
			debug._log(msg, 'FATAL');
			if (e) {
				console.error(e);
				alert(e);
			}
		}
	}
};

var Utils = {
	cssColor: function (color) {
		return '#' + color.toString(16).padStart(6, '0');
	},
	sanitizeUsername: function (name) {
		try {
			return name.replace(/[^a-z0-9\~\-\.]/gi, '').toLowerCase().trim();
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
	populateDropdown: function ($dd, items, placeholder, defaultValue) {
		$dd.removeChildren();
		if (placeholder) {
			if (typeof(placeholder) === 'string') {
				placeholder = html('option', {
					value: '',
					disabled: '',
					selected: ''
				}, placeholder);
			} else if (placeholder instanceof Element) {
				placeholder.setAttribute('value', '');
				placeholder.setAttribute('disabled', '');
				placeholder.setAttribute('selected', '');
			}
			$dd.appendChild(placeholder);
		}
		if (Array.isArray(items)) {
			for (var item of items) {
				var key = item.key || item;
				var value = item.value || item.key || item;
				var $option = html('option', {value: key}, value);
				$dd.appendChild($option);
			}
		} else {
			for (var key in items) {
				var $option = html('option', {value: key}, items[key]);
				$dd.appendChild($option);
			}
		}
		$dd.value = defaultValue || '';
		return $dd;
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
	goto: function (x, y) {
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
			DragHandler.dragging.move(DragHandler.dx, DragHandler.dy); //.keepOnScreen();
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
	if (this.dragging) this.stop();
});
DragHandler.listen('mousemove', function (e) {
	var scroll = {
		x: document.documentElement.scrollLeft || document.body.scrollLeft,
		y: document.documentElement.scrollTop || document.body.scrollTop
	};
	this.goto(
		e.PageX ? e.PageX : e.clientX + scroll.x,
		e.PageY ? e.PageY : e.clientY + scroll.y);
	this.move(e);
});

// "Switch" input
function $Switch(type, $checkbox) {
	if (typeof($checkbox) !== 'object') {
		var checked = $checkbox || false;
		$checkbox = html('input', {
			type: 'checkbox'
		});
		$checkbox.checked = checked;
	}
	var $switch = html('label').addClassName('switch');
	var $slider = html('span').addClassName('slider').addClassName(type || 'round');
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
	var $tabs = html('div', {class: 'tabs'});
	var $contents = html('div', {class: 'tabs-contents'});
	var $container = html('div', {class: 'tabs-container'}, [$tabs, $contents]);

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
		var $tab = tabs[tabID].tab;
		var $content = tabs[tabID].content;
		if (typeof $tab === 'string') {
			$tab = html('span', {
				class: 'tab',
				id: tabID
			}, $tab);
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

// empty window container
function $Window(props) {
	var $title  = html('h2', {class: 'window-title drag-handle'}, props.title || 'Untitled Window');
	var $icon   = props.icon ? html('img', {class: 'window-icon', src: props.icon}) : null;
	var $hide   = html('button', {class: 'hide-window red'}, '✖');
	var $head   = html('div', {class: 'window-head drag-handle'}, [$icon, $title, $hide]);
	var $body   = html('div', {class: 'window-body'}, props.body);
	var $window = html('div', {class: 'window draggable drag-parent'}, [$head, $body]);
	
	$window.head = $head;
	$window.body = $body;

	// hide window when the 'x' is clicked
	$hide.observe('click', function (e) {
		DragHandler.stop();
		if (props.canHide) {
			$window.hide();
			//$window.dispatchEvent({target: $window, name: 'hide'});
		} else {
			$window.remove();
			//$window.dispatchEvent({target: $window, name: 'close'});
		}
	});
	
	return $window;
}

// https://stackoverflow.com/a/30106551
function b64EncodeUnicode(str) {
	return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
		return String.fromCharCode(parseInt(p1, 16));
	}));
}
function b64DecodeUnicode(str) {
	return decodeURIComponent(Array.prototype.map.call(atob(str), function (c) {
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
	debug.info('exported file "' + filename + '"');
}
function importFile(file, callback) {
	var f = new FileReader();
	f.onload = function (e) {
		debug.info('imported file "' + file.name + '"');
		callback(e.target.result);
	};
	f.readAsText(file);
}
function openFileDialog(callback) {
	var fd = html('input', {type: 'file'});
	fd.onchange = callback;
	click(fd);
}

// API requests
function getWatchlist(e) {
	var username = Utils.getUsername();
	if (!username) return;

	var $btn = e.target;
	var text = $btn.textContent;
	$btn.textContent = 'Fetching...';

	var wl = Editor.getUsers();
	function getPage(p) {
		// will uncomment when alternative is found
		/* return fetch('http://faexport.boothale.net/user/' + username + '/watching.json' + (p > 1 ? '?page=' + p : ''))
		.then(convertToJSON) */
		return fetch('https://www.furaffinity.net/watchlist/by/'+username+(p>1?'/'+p+'/':''))
		.then(function (x) {return x.text()})
		.then(function (x) {return x.html()})
		.then(function ($dom) {return $A($dom.querySelectorAll('#userpage-budlist>tbody>tr>td>a,div.watch-row>a')).pluck('textContent')})
		.then(function (users) {
			$btn.textContent = 'Fetching (page ' + p + ')...';
			debug.log('Got page ' + p + ' of ' + username + '\'s watchlist, ' + users.length + ' items');
			if (users.length) {
				users = users.map(Utils.sanitizeUsername);
				wl = wl.concat(users);
				return getPage(p + 1);
			} else {
				Editor.setUsers(wl.uniq());
			}
		})
		.catch(function (err) {
			debug.error('An error occurred while fetching the watchlist of "' + username + '":', err);
		})
		.then(function () {
			$btn.textContent = text;
		});
	}
	getPage(1);
}
function getGallery(e) {
	return debug.fatal('Gallery importing is not supported at the moment!');
	
	var username = Utils.getUsername();
	if (!username) return;

	var $btn = e.target;
	var text = $btn.textContent;
	$btn.textContent = 'Fetching...';

	var items = Editor.getSubmissions();
	function getPage(p) {
		return fetch('http://faexport.boothale.net/user/' + username + '/gallery.json' + (p > 1 ? '?page=' + p : ''))
		.then(convertToJSON)
		.then(function (submissions) {
			$btn.textContent = 'Fetching (page ' + p + ')...';
			debug.log('Got page ' + p + ' of ' + username + '\'s gallery, ' + submissions.length + ' items');
			if (submissions.length) {
				items = items.concat(submissions);
				return getPage(p + 1);
			} else {
				Editor.setSubmissions(items.uniq());
			}
		})
		.catch(function (err) {
			debug.error('An error occurred while fetching the gallery of "' + username + '":', err);
		})
		.then(function () {
			$btn.textContent = text;
		});
	}
	getPage(1);
}
function getFavorites(e) {
	return debug.fatal('Gallery importing is not supported at the moment!');
	
	var username = Utils.getUsername();
	if (!username) return;

	var $btn = e.target;
	var text = $btn.textContent;
	$btn.textContent = 'Fetching...';

	var items = Editor.getSubmissions();
	function getPage(p) {
		return fetch('http://faexport.boothale.net/user/' + username + '/favorites.json' + (p > 1 ? '?page=' + p : ''))
		.then(convertToJSON)
		.then(function (favorites) {
			$btn.textContent = 'Fetching (page ' + p + ')...';
			debug.log('Got page ' + p + ' of ' + username + '\'s favorites, ' + favorites.length + ' items');
			if (favorites.length) {
				items = items.concat(favorites);
				return getPage(p + 1);
			} else {
				Editor.setSubmissions(items.uniq());
			}
		})
		.catch(function (err) {
			debug.error('An error occurred while fetching the favorites of "' + username + '":', err);
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
		handleError(e, true);
	}
}

// ===== Localization =====

var i18n = {
	_locales: {},
	locale: 'en-us',
	DEFAULT_LOCALE: 'en-us',
	init: function () {
		return GM.getValue('bl_locales', '{}')
		.then(convertToJSON)
		.then(function (locales) {
			if (!locales || locales._version !== meta.VERSION) {
				return i18n._updateLocales(locales || {});
			} else {
				i18n._locales = locales;
				return true;
			}
		});
	},
	_updateLocales: function (locales) {
		console.log('Fetching new locales dictionary');
		var localesURL = (new URL(meta.LOCALES_HREF, meta.ROOT)).href;
		console.log(localesURL);
		return fetch(localesURL)
		.then(convertToJSON)
		.then(function (index) {
			console.log('Locales index found:', index);
			// fetch each locales file
			return Promise.all(Object.keys(index).map(function (key) {
				return fetch(new URL(index[key], localesURL))
				.then(convertToJSON)
				.then(function (locale) {
					console.log('Locale found:', key);
					locales[key] = locale;
				});
			}));
		})
		.then(function () {
			console.log('Locales successfully updated');
			locales._version = meta.VERSION;
			i18n._locales = locales;
			return GM.setValue('bl_locales', JSON.stringify(locales));
		})
		.catch(function (err) {
			console.error('Could not fetch locales:', err);
		});
	},
	get: function (messageID, substitutions) {
		var messageObj = this._locales[this.locale][messageID];
		if (messageObj) {
			var localizedMessage = messageObj.message;
			if (!localizedMessage) {
				// if missing a locale message, use default
				messageObj = this._locales[this.DEFAULT_LOCALE][messageID];
				localizedMessage = messageObj.message;
			}
			var placeholders = messageObj.placeholders;
			if (placeholders) {
				for (var key in placeholders) {
					var missingSubs = false;
					var content = placeholders[key].content.replace(/\$(\d+)/g, function (match, i) {
						i = Number(i) - 1;
						if (typeof(substitutions[i]) === 'undefined') {
							missingSubs = true;
							return '';
						}
						return substitutions[i];
					});
					if (missingSubs)
						content = placeholders[key].default;
					localizedMessage = localizedMessage.replace('$' + key + '$', content);
				}
			}
			return localizedMessage;
		} else {
			debug.warn('Unknown i18n message "' + messageID + '" for the locale "' + this.locale + '"');
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
		$root.select('[data-i18n]').forEach(this.localizeElement);
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

		this.id = typeof(data.id) === 'string' ? data.id : Filter.generateID();
		this.name = typeof(data.name) === 'string' ? data.name : Filter.DEFAULT_NAME;
		this.desc = typeof(data.desc) === 'string' ? data.desc : Filter.DEFAULT_DESCRIPTION;
		this.color = typeof(data.color) === 'string' ? data.color : Filter.DEFAULT_COLOR;
		this.tcolor = typeof(data.tcolor) === 'string' ? data.tcolor : Filter.DEFAULT_TEXT_COLOR;
		this.type = typeof(data.type) !== 'undefined' ? data.type : Filter.BLACKLIST;

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
		var $tag = html('span', {class: 'tag'}, html('span', {class: 'text'}, this.name));
		return this.updateTag($tag);
	},
	updateTag: function ($tag) {
		if ($tag == null) return this.createTag();

		var enabled = this.options.active;
		var auto = this.options.matchTitle || this.options.matchName;
		var title = (this.desc || this.name) + (enabled ? '' : ' (disabled)');

		$tag.setAttribute('id', this.id);
		$tag.setAttribute('title', title);
		$tag.setStyle({
			backgroundColor: this.color,
			borderColor: this.color,
			color: this.tcolor
		});
		$tag.querySelector('.text').textContent = this.name;
		if (enabled) {
			$tag.removeClassName('disabled');
		} else {
			$tag.addClassName('disabled');
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
	},
	toString: function () {
		return this.name;
	}
});
Filter.DEFAULT_NAME = 'my filter';
Filter.DEFAULT_DESCRIPTION = '';
Filter.DEFAULT_COLOR = '#ff0000';
Filter.DEFAULT_TEXT_COLOR = '#ffffff';
Filter.DEFAULT_OPTIONS = {
	active: true, // enables the filter

	username: true, // hide usernames
	avatar: true, // hide avatars
	comment: true, // hide comments
	thumbnail: true, // hide thumbnails
	title: true, // hide titles
	link: true, // hide misc links

	matchTitle: false, // enable auto-filtering of submissions based on titles
	matchName: false, // enable auto-filtering of users based on usernames
	sensitive: false, // prefer filtering users instead of individual submissions
	ignore: false, // ignore whitelisted items when blacklisting
	temporary: false // newly scanned items do not get added to the lists
};
Filter.CONTENT_OPTION_KEYS = ['username', 'avatar', 'comment', 'thumbnail', 'title', 'link'];
Filter.AUTOSCAN_OPTION_KEYS = ['matchTitle', 'matchName', 'sensitive', 'ignore', 'temporary'];
Filter.BLACKLIST = 0;
Filter.WHITELIST = 1;
Filter.generateID = function () {
	return Date.now().toString(16); // TODO: generate a UUID instead?
};

// ===== Target Classes =====

var Users = {}, Submissions = {};

var Target = Class.create({
	initialize: function (id) {
		this.id = id;
		this.tags = [];
		this.$tags = html('span', {id: 'tags'});
	},
	getTagElement: function (tag) {
		return this.$tags.querySelector('[id="' + tag + '"]');
	},
	hasTags: function () {
		return this.tags.length > 0;
	},
	hasTag: function (tag) {
		return this.tags.includes(tag);
	},
	addTag: function (ID) {
		debug.log('Added tag "' + ID + '" to ' + this);
		var $tag;
		if (this.hasTag(ID)) {
			$tag = this.getTagElement(ID);
			Filters[ID].updateTag($tag);
		} else {
			this.tags.push(ID);
			$tag = Filters[ID].createTag();
			this.$tags.appendChild($tag);
		}
		return $tag;
	},
	removeTag: function (ID) {
		debug.log('Removed  tag "' + ID + '" from ' + this);
		if (this.hasTag(ID)) {
			this.tags.splice(this.tags.indexOf(ID), 1);
			var $tag = this.getTagElement(ID);
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
		// placeholder
		return html('a', {href: '#'}, this.id);
	},
	toString: function () {
		return this.id;
	}
});

var User = Class.create(Target, {
	initialize: function ($super, id) {
		$super(id);
		this.type = 'user';
		this.submissions = {};
	},
	createLink: function () {
		return html('a', {
			href: 'http://www.furaffinity.net/user/' + this.id,
			target: '_blank',
			class: 'name'
		}, this.id);
	},
	updateTags: function (filters) {
		// remove IDs of deleted filters
		for (var ID of this.tags.slice()) {
			if (!(ID in filters)) {
				this.removeTag(ID);
			}
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
		return html('a', {
			href: 'http://www.furaffinity.net/view/' + this.id,
			target: '_blank',
			class: 'name'
		}, this.getTitle());
	},
	// submissions inherit the tags of their user
	hasTag: function ($super, tag) {
		return $super(tag) || (this.user && this.user.hasTag(tag));
	},
	updateTags: function (filters) {
		// remove IDs of deleted filters
		for (var ID of this.tags.slice()) {
			if (!(ID in filters)) {
				this.removeTag(ID);
			}
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
	getAllTags: function () {
		if (this.user) {
			return this.tags.concat(this.user.tags).unique();
		} else {
			return this.tags;
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
		this._title = this.node.title;
	},
	hide: function () {
		this.node.hide();
		return this;
	},
	show: function () {
		this.node.show();
		return this;
	},
	censor: function (reason) {
		this.node.show();
		this.node.addClassName('censored');
		this.node.title = reason;
		return this;
	},
	uncensor: function () {
		this.node.show();
		this.node.removeClassName('censored');
		this.node.title = this._title;
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
		this.$tags = html('span', {id: 'tags'});

		this.nodes = [];
		this.marked = false;
		this.hidden = false;
		this.blacklisted = false;
		this.whitelisted = false;
	},
	hasNodes: function () {
		return this.nodes.length > 0;
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
			if (_matches) matches.push(Array.isArray(_matches) ? _matches[0] : _matches);
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
		var options = Filter.CONTENT_OPTION_KEYS.reduce(function (o, k) {
			return o[k] = 0, o;
		}, {});
		if ('firstItem' in this && data.options.firstItem) {
			this.mark('hidden');
		} else {
			for (var ID in data.filters) {
				var filter = data.filters[ID];

				// skip disabled filters
				if (!filter.options.active || !this.hasTag(ID))
					continue;

				if (filter.type == Filter.WHITELIST) {
					this.mark(false);
					//break;
				} else {
					this.mark(true);

					// combine options
					for (var o in options) {
						options[o] |= filter.options[o];
					}
				}
			}
		}

		if (this.blacklisted) {
			this.updateNodes(options, data);
		} else if (this.hidden) {
			this.hideNodes();
		} else {
			this.showNodes();
		}
	}
});

Submission.addMethods({
	showNodes: function () {
		this.nodes.forEach(function ($n) {
			if ($n.type == 'thumbnail') {
				$n.uncensor();
			} else {
				$n.show();
			}
		});
	},
	updateNodes: function (options, data) {
		var submission = this;
		var reasonForCensoring = 'Censored by tags: ' + this.getAllTags().map(function (ID) {
			return data.filters[ID];
		}).join(', ');
		this.nodes.forEach(function (node) {
			var type = node.type;
			var elem = node.node;
			if (options[type]) {
				if (Options.blurImages) {
					switch (type) {
					case 'thumbnail':
						node.censor(reasonForCensoring);
						break;
					case 'link':
						if (submission.hasNode(elem.firstElementChild)) {
							node.show();
							break;
						}
					default:
						node.hide();
					}
				} else {
					node.hide();
				}
			} else {
				if (type == 'thumbnail')
					node.uncensor();
				else
					node.show();
			}
		});
	},
	getTitle: function () {
		// try for text in a submission title node
		var title = this.getNodes('title')[0];
		if (title) return title.text;
		// if no title node exists, try a submission image's title attribute
		title = this.getNodes('thumbnail')[0];
		if (title && title.node.title) {
			return title.node.title;
		}
		return '#' + this.id;
	}
});

// ===== Scraper =====

function scrape() {
	var users = {};
	var submissions = {};
	var loggedInName = '';
	var loggedInUser = null;
	var profileName = '';
	var profileUser = null;

	var USER_DIRS = ['user', 'commissions', 'gallery', 'scraps', 'journals', 'favorites'];
	var URL = parseURL(window.location.href);
	var SUBMISSION_LINK = 'a[href*="/view/"]';
	var USER_LINK = 'a[href*="/user/"]';

	var body = document.body;

	function parseURL(url) {
		return url.match(/[^\\\/:#?]+/g);
	}
	function resolveUsername(object) {
		if (!object || (Object.isElement(object) && !object.href)) return '';
		var temp = parseURL(object.href || object.src || object);
		if (temp && USER_DIRS.includes(temp[2])) {
			return Utils.sanitizeUsername(temp[3]);
		}
		return '';
	}
	function resolveSubmission(object) {
		if (!object || (Object.isElement(object) && !object.href)) return '';
		var id = object.href || object.src || object;
		try {
			return id.match(/\/view\/(\d+)/)[1];
		} catch (e) {
			return '';
		}
	}
	function getUser(id) {
		if (!id) throw 'Missing ID';
		return id in users ? users[id] : (users[id] = new User(id));
	}
	function getSubmission(id) {
		if (!id) throw 'Missing ID';
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
				if (!($avatar instanceof Element && $avatar.hasClassName('avatar'))) {
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
			var $thumbnail = $figure.querySelector('img'); // figure>b>u[>s]>a>img
			var $caption = $figure.querySelector('figcaption'); // figure>figcaption
			var $title = $caption.querySelector(SUBMISSION_LINK); // figure>figcaption>p>a
			var id = resolveSubmission($title);
			var submission = submissions[id];
			submission.addNode($thumbnail, 'thumbnail');
			submission.addNode($title, 'title');

			var $name = $caption.querySelector(USER_LINK);
			var name = resolveUsername($name);
			var user = users[name];
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
	body.select('li>div.info>span', 'b.replyto-name').forEach(processThings);

	// parse avatar images (all usernames should exist in the table); avatars are always wrapped in links
	body.select('img.avatar', 'img.comment_useravatar', 'a.iconusername>img').forEach(processAvatars);

	// parse comments and shouts (all usernames should exist in the table)
	body.select('comment-container', 'table[id*="shout"]', 'table.container-comment').forEach(processComments);

	// parse content figures
	var $contentItems = body.select('figure', 'b[id*="sid_"]', 'div.preview-gallery-container');
	switch (URL[2]) {
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
		var $featuredSubmission = body.select('td#featured-submission', 'div.aligncenter>' + SUBMISSION_LINK + '>img')[0];
		var $profileIdSubmission = body.select('td#profilepic-submission', 'div.section-submission')[0];
		var $firstSubmission = body.select('center.userpage-first-submission>b')[0];
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
			var $title = $firstFaveSubmission.querySelector('span'); //.firstChild
			var $a = $firstFaveSubmission.querySelector(SUBMISSION_LINK);
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
			var $submissionImg = $('submissionImg');
			var $submissionTags = $('keywords');
			var id = URL[3];
			var submission = getSubmission(id);
			submission.addNode($submissionImg, 'thumbnail', true);
			submission.addNode($submissionTags, 'link');

			var $submissionOwner = body.select('div.submission-id-container>' + USER_LINK, 'div.classic-submission-title>' + USER_LINK, 'div.submission-title>span>a')[0];
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
	loggedInName = resolveUsername($loggedInUser);

	// exclude logged in user from the main user list (it is still accessible)
	if (loggedInName) {
		loggedInUser = users[loggedInName];
		delete users[loggedInName];

		// exclude own submissions as well
		for (var sID in loggedInUser.submissions) delete submissions[sID]
	}

	return {
		users: users,
		submissions: submissions,
		logged_in_user: loggedInUser
	};
}

// ===== Editor =====

var Editor = {
	$elem: null,
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
	$filterDesc: null,
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
		Editor.$elem = $root = $root || document.body;
		Editor.$newFilter = $($root.querySelector('#new-filter'));
		Editor.$saveFilter = $($root.querySelector('#save-filter'));
		Editor.$copyFilter = $($root.querySelector('#copy-filter'));
		Editor.$loadFilter = $($root.querySelector('#load-filter'));
		Editor.$deleteFilter = $($root.querySelector('#delete-filter'));
		Editor.$exportFilter = $($root.querySelector('#export-filter'));
		Editor.$importFilter = $($root.querySelector('#import-filter'));
		Editor.$fileImporter = $($root.querySelector('#import'));
		Editor.$filterDropdown = $($root.querySelector('#filter-dropdown'));
		Editor.$filterName = $($root.querySelector('#name'));
		Editor.$filterDesc = $($root.querySelector('#description'));
		Editor.$filterID = $($root.querySelector('#id'));
		Editor.$filterColor = $($root.querySelector('#color'));
		Editor.$filterTextColor = $($root.querySelector('#color-text'));
		Editor.$filterType = $($root.querySelector('#type'));
		Editor.$filterTagPreview = $($root.querySelector('#tag-preview'));
		Editor.$filterUsers = $($root.querySelector('#users'));
		Editor.$filterUsersLength = $($root.querySelector('#content-length-users'));
		Editor.$filterSubmissions = $($root.querySelector('#submissions'));
		Editor.$filterSubmissionsLength = $($root.querySelector('#content-length-submissions'));
		Editor.$filterKeywords = $($root.querySelector('#keywords'));
		Editor.$filterOptions = $A($root.querySelectorAll('input[type="checkbox"]'));
		Editor.$filterEnabled = $($root.querySelector('#active'));
		Editor.addEventHandlers();
		return Editor.$elem;
	},
	addEventHandlers: function () {
		Editor.$elem.addEventListener('keydown', function (e) {
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
		Editor.$elem.whenChanged(Editor.changeHappened).whenKeyPressed(Editor.changeHappened);
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
		$(Editor.$elem.querySelector('#clean-sort-users')).whenClicked(Editor.cleanAndSortUserContents);
		$(Editor.$elem.querySelector('#clean-sort-submissions')).whenClicked(Editor.cleanAndSortSubmissionContents);
		$(Editor.$elem.querySelector('#get-watchlist')).whenClicked(getWatchlist);
		$(Editor.$elem.querySelector('#get-submissions')).whenClicked(getGallery);
		$(Editor.$elem.querySelector('#get-favorites')).whenClicked(getFavorites);
		Editor.$filterName.whenKeyPressed(Editor.updateTagPreview);
		Editor.$filterDesc.whenKeyPressed(Editor.updateTagPreview);
		Editor.$filterColor.whenChanged(Editor.updateTagPreview);
		Editor.$filterTextColor.whenChanged(Editor.updateTagPreview);
		$(Editor.$elem.querySelector('#random-color')).whenClicked(Editor.randomColor, Editor.$filterColor);
		$(Editor.$elem.querySelector('#random-text-color')).whenClicked(Editor.randomColor, Editor.$filterTextColor);
		Editor.$filterEnabled.whenChanged(Editor.updateTagPreview);
		$(Editor.$elem.querySelector('#matchName')).whenChanged(Editor.updateTagPreview);
		$(Editor.$elem.querySelector('#matchTitle')).whenChanged(Editor.updateTagPreview);
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
	getDescription: function () {
		return Editor.$filterDesc.value;
	},
	setDescription: function (desc) {
		Editor.$filterDesc.value = desc;
	},
	getType: function () {
		return Number(Editor.$filterType.value);
	},
	setType: function (type) {
		Editor.$filterType.value = Number(type);
		Editor.toggleAutoScanOptions();
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
		Editor.$filterUsers.value = Object.isArray(users) ? users.join('\n') : users || '';
		Editor.updateUserContentLength();
	},
	getSubmissions: function () {
		var value = Editor.$filterSubmissions.value.trim();
		return value ? value.split('\n').map(Utils.sanitizeSubmissionID).compact() : [];
	},
	setSubmissions: function (submissions) {
		Editor.$filterSubmissions.value = Object.isArray(submissions) ? submissions.join('\n') : submissions || '';
		Editor.updateSubmissionContentLength();
	},
	getKeywords: function () {
		var value = Editor.$filterKeywords.value.trim();
		return value ? value.split('\n').compact() : [];
	},
	setKeywords: function (keywords) {
		Editor.$filterKeywords.value = Object.isArray(keywords) ? keywords.join('\n') : keywords || '';
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
	toggleAutoScanOptions: function () {
		if (Editor.getType() == Filter.BLACKLIST) {
			Editor.enableAutoScanOptions();
		} else {
			Editor.disableAutoScanOptions();
		}
	},
	enableAutoScanOptions: function () {
		Editor.$filterOptions.forEach(function ($o) {
			var id = $o.id;
			if (Filter.AUTOSCAN_OPTION_KEYS.indexOf(id) > -1) {
				$o.removeAttribute('disabled');
			}
		});
	},
	disableAutoScanOptions: function () {
		Editor.$filterOptions.forEach(function ($o) {
			var id = $o.id;
			if (Filter.AUTOSCAN_OPTION_KEYS.indexOf(id) > -1) {
				$o.setAttribute('disabled', 'disabled');
			}
		});
	},
	update: function (filter, forceChange) {
		if (filter && (Editor.changesSaved || forceChange)) {
			if (typeof filter === 'object') {
				Editor.setID(filter.id);
				Editor.setName(filter.name);
				Editor.setDescription(filter.desc);
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
		Editor.toggleAutoScanOptions();
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
		var name = Editor.getName();
		var desc = Editor.getDescription();
		var color = Editor.getColor();
		var tcolor = Editor.getTextColor();
		var enabled = Editor.getEnabled();
		var auto = onOff($('matchName').checked) || onOff($('matchTitle').checked);
		Editor.$filterTagPreview.querySelector('span.text').textContent = name;
		if (!desc) desc = name;
		if (!enabled) desc += ' (disabled)';
		Editor.$filterTagPreview.setAttribute('title', desc);
		Editor.$filterTagPreview.setStyle({
			backgroundColor: color,
			borderColor: color,
			color: tcolor
		});
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
		Editor.setUsers(Editor.getUsers().map(Utils.sanitizeUsername).uniq().sort());
		Editor.updateUserContentLength();
	},
	cleanAndSortSubmissionContents: function () {
		Editor.setSubmissions(Editor.getSubmissions().map(Utils.sanitizeSubmissionID).uniq().sort());
		Editor.updateSubmissionContentLength();
	},
	generateID: function () {
		Editor.setID(Filter.generateID());
	},
	randomColor: function (e, $color) {
		var color = (0xFFFFFF * Math.random()) | 0;
		$color.value = Utils.cssColor(color);
		Editor.updateTagPreview();
		Editor.changeHappened();
	},
	reset: function () {
		Editor.setID('');
		Editor.setName('');
		Editor.setDescription(Filter.DEFAULT_DESCRIPTION);
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
		return {
			name: Editor.getName(),
			desc: Editor.getDescription(),
			id: Editor.getID(),
			color: Editor.getColor(),
			tcolor: Editor.getTextColor(),
			type: Editor.getType(),

			users: Editor.getUsers(),
			submissions: Editor.getSubmissions(),
			keywords: Editor.getKeywords(),

			options: Editor.getOptions()
		};
	},
	save: function () {
		if (!Editor.getID()) {
			Editor.generateID();
		}
		Utils.setHash(Editor.getID());
		Editor.changeWasSaved();
		App.setFilter(Editor.serialize());
	},
	saveAsCopy: function () {
		Editor.generateID();
		Editor.save();
	},
	load: function (ID) {
		if (!Editor.changesSaved && confirm(i18n.get('confirmDiscard'))) {
			Editor.save();
		}
		Editor.update(Filters[ID], true);
	},
	loadFromHash: function () {
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
	'delete': function () {
		var id = Editor.getID();
		var message = i18n.get('confirmDelete', [Editor.getName() || id || undefined]);
		if (id && confirm(message)) {
			App.deleteFilter(id);
			Editor.reset();
		}
	},
	_import: function () {
		Editor.$fileImporter.click();
	},
	'import': function () {
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
		exportFile(Editor.getName() + '.json', Editor.serialize());
	},
	listFiltersInDropdown: function () {
		if (Editor.$filterDropdown.style.display == 'none') {
			Utils.populateDropdown(Editor.$filterDropdown, Filters, i18n.get('editorSelectFilter'));
			Editor.$filterDropdown.show();
		} else {
			Editor.$filterDropdown.hide();
		}
	},
	catchUnsavedChanges: function (e) {
		if (!Editor.changesSaved) {
			return e.returnValue = i18n.get('editorUnsavedChanges');
		}
	}
};

// ===== Options =====

var Options = {};

var OptionsForm = {
	$elem: null,
	$options: null,
	$resetOptions: null,
	$resetApp: null,
	$importAppData: null,
	$appDataImporter: null,
	$exportAppData: null,
	$reloadCaches: null,

	initFromDocument: function ($root) {
		OptionsForm.$elem = $root = $root || document.body;
		OptionsForm.$options = $A($root.querySelectorAll('.option'));
		OptionsForm.$resetOptions = $root.querySelector('#reset-options');
		OptionsForm.$resetApp = $root.querySelector('#reset-app');
		OptionsForm.$importAppData = $root.querySelector('#import-app-data');
		OptionsForm.$exportAppData = $root.querySelector('#export-app-data');
		OptionsForm.$appDataImporter = $root.querySelector('#app-importer');
		OptionsForm.$reloadCaches = $root.querySelector('#reload-caches');
		OptionsForm.addEventHandlers();
		return OptionsForm.$elem;
	},
	addEventHandlers: function () {
		OptionsForm.$elem.addEventListener('change', OptionsForm.save, false);
		OptionsForm.$resetOptions.addEventListener('click', OptionsForm.reset, false);
		OptionsForm.$resetApp.addEventListener('click', OptionsForm.resetApp, false);
		OptionsForm.$exportAppData.addEventListener('click', App.export, false);
		OptionsForm.$importAppData.addEventListener('click', function (e) {
			OptionsForm.$appDataImporter.click();
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
		OptionsForm.$reloadCaches.addEventListener('click', function (e) {
			i18n._updateLocales();
			App._reloadStylesheet();
		}, false);
	},
	serialize: function () {
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
		debug.log('Updating Options Form');
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
		for (var k in options) Options[k] = options[k];
		var localeChanged = Options.locale != i18n.locale;
		debug._level = Options.devMode ? 4 : 1;
		debug.log('Saving Options:', Options);
		App.saveOptionsAndUpdate();
		if (localeChanged) {
			App.applyLocalization();
			List.update();
		}
	},
	reset: function () {
		debug.log('Resetting Options Form');
		App.resetOptions();
		App.saveOptionsAndUpdate();
	},
	resetApp: function () {
		debug.log('Confirming App Reset');
		if (confirm(i18n.get('confirmEraseData'))) {
			App.resetApp();
			reload.defer();
		}
	}
};

// ===== User/Submission Lists =====

var List = {
	$elem: null,
	$scanNowContainer: null,
	$scanNow: null,
	$scanResults: null,
	$listMode: null,
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

	_tablesBuilt: false,
	listMode: 'visible',
	
	init: function () {
		List.$placeholderAddAllUsers = html('option', {'data-i18n': 'listAddAll'});
		List.$placeholderRemoveAllUsers = html('option', {'data-i18n': 'listRemoveAll'});
		List.$placeholderAddAllSubs = html('option', {'data-i18n': 'listAddAll'});
		List.$placeholderRemoveAllSubs = html('option', {'data-i18n': 'listRemoveAll'});
		List.$usersPlaceholder = html('span', {id: 'user-placeholder','data-i18n': 'usersPlaceholder'});
		List.$subsPlaceholder = html('span', {id: 'submission-placeholder','data-i18n': 'submissionsPlaceholder'});
	},
	create: function ($root) {
		$root = $root || document.body;
		List.$elem = html('div', {id: 'list'}, [
			List.$listMode = Utils.populateDropdown(html('select', {id: 'list-mode'}), {
				// TODO: i18n keys
				'visible': 'Visible on Page',    // lists all content visible on current page
				'tagged': 'Tagged-Only',         // lists only tagged content visible on page
				'untagged': 'Untagged-Only',     // lists only untagged content visible on page
				'all-tagged': 'All Tagged-Only', // lists only tagged content stored in filters
				'all': 'All'                     // lists all content stored in filters and on current page
			}, null, List.listMode),
			List.$scanNowContainer = html('div', {id: 'scan'}, [
				List.$scanNow = html('button', {id: 'scan-now','data-i18n': 'scanNowText'}),
				List.$scanResults = html('span', {id: 'scan-results'})
			]),
			List.$searchBarContainer = html('div', {id: 'search'}, [
				List.$searchBar = html('input', {
					type: 'textbox',
					id: 'searchbar',
					'data-i18n': 'searchPlaceholder,placeholder'
				})
			]),
			List.$usersGlobalContainer = html('div', {id: 'users-global'}, [
				List.$usersTitle = html('h3', {'data-i18n': 'users'}),
				List.$usersAddAllDropdown = html('select', {id: 'users-add-all'}),
				List.$usersRemoveAllDropdown = html('select', {id: 'users-remove-all'})
			]),
			List.$usersTable = html('div', {id: 'users', class: 'group'}),
			List.$subsGlobalContainer = html('div', {id: 'submissions-global'}, [
				List.$subsTitle = html('h3', {'data-i18n': 'submissions'}),
				List.$subsAddAllDropdown = html('select', {id: 'submissions-add-all'}),
				List.$subsRemoveAllDropdown = html('select', {id: 'submissions-remove-all'})
			]),
			List.$subsTable = html('div', {id: 'submissions', class: 'group'})
		]);
		List.addEventHandlers();
		$root.appendChild(List.$elem);
		return List.$elem;
	},
	initFromDocument: function ($root) {
		List.$elem = $root = $root || document.body;
		List.$listMode = $root.querySelector('#list-mode');
		List.$scanNowContainer = $root.querySelector('#scan');
		List.$scanNow = List.$scanNowContainer.querySelector('#scan-now');
		List.$scanResults = List.$scanNowContainer.querySelector('#scan-results');
		List.$searchBarContainer = $root.querySelector('#search');
		List.$searchBar = List.$searchBarContainer.querySelector('#searchbar');
		List.$usersGlobalContainer = $root.querySelector('#users-global');
		List.$usersTitle = List.$usersGlobalContainer.querySelector('h3');
		List.$usersAddAllDropdown = List.$usersGlobalContainer.querySelector('#users-add-all');
		List.$usersRemoveAllDropdown = List.$usersGlobalContainer.querySelector('#users-remove-all');
		List.$usersTable = $root.querySelector('#users');
		List.$subsGlobalContainer = $root.querySelector('#submissions-global');
		List.$subsTitle = List.$subsGlobalContainer.querySelector('h3');
		List.$subsAddAllDropdown = List.$subsGlobalContainer.querySelector('#submissions-add-all');
		List.$subsRemoveAllDropdown = List.$subsGlobalContainer.querySelector('#submissions-remove-all');
		List.$subsTable = $root.querySelector('#submissions');
		List.addEventHandlers();
		return List.$elem;
	},
	addEventHandlers: function () {
		List.$listMode.whenChanged(function (e) {
			List.listMode = e.target.value;
			List._tablesBuilt = false;
			List.update();
		});
		List.$scanNow.whenClicked(function (e) {
			var results = Page.update(true);
			if (results && (results.users.length || results.submissions.length)) {
				List.$scanResults.innerHTML = results.users.length + ' users & ' + results.submissions.length + ' submissions added';
			} else {
				List.$scanResults.innerHTML = 'Nothing found';
			}
		});
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
	buildTables: function () {
		var users = {}, submissions = {};
		switch (List.listMode) {
			case 'visible':
			case 'tagged':
			case 'untagged':
			case 'all':
				Object.assign(users, Users);
				Object.assign(submissions, Submissions);
				break;
		}
		if (List.listMode === 'all-tagged' || List.listMode === 'all') {
			for (var ID in Filters) {
				var filter = Filters[ID];
				for (var name of filter.users) {
					users[name] = users[name] || Users[name] || new User(name);
					if (!users[name].hasTag(ID)) {
						users[name].addTag(ID);
					}
				}
				for (var id of filter.submissions) {
					submissions[id] = submissions[id] || Submissions[id] || new Submission(id);
					if (!submissions[id].hasTag(ID)) {
						submissions[id].addTag(ID);
					}
				}
			}
		}
		List._initTable(List.$usersTable, List.$usersPlaceholder, users);
		List._initTable(List.$subsTable, List.$subsPlaceholder, submissions);
		List._tablesBuilt = true;
	},
	_initTable: function ($table, $placeholder, objects) {
		$table.removeChildren();
		for (var key of Object.keys(objects).sort()) {
			List._createTableRow($table, objects[key], !objects[key].hasNodes());
		}
		$table.appendChild($placeholder); // shown when no search results are found
	},
	_createTableRow: function ($table, target, hidden) {
		var $link = target.createLink();
		var $dropdown = html('select', {class: 'add-tag'})
		.whenChanged(function (e, t) {
			var f = e.target.value;
			if (f) {
				Page.addTargetToFilter(t, f);
				e.target.value = '';
			}
		}, target);
		// remove tag container from previous table
		if (target.$tags.parentElement) {
			target.$tags.remove();
		}
		var $row = html('div', {class: 'row', id: target.id}, [$link, target.$tags, $dropdown]);
		if (hidden) $row.hide();
		$table.appendChild($row);
		return $row;
	},
	update: function () {
		if (!List._tablesBuilt) {
			List.buildTables();
		}
		Utils.populateDropdown(List.$usersAddAllDropdown, Filters, List.$placeholderAddAllUsers);
		Utils.populateDropdown(List.$usersRemoveAllDropdown, Filters, List.$placeholderRemoveAllUsers);
		Utils.populateDropdown(List.$subsAddAllDropdown, Filters, List.$placeholderAddAllSubs);
		Utils.populateDropdown(List.$subsRemoveAllDropdown, Filters, List.$placeholderRemoveAllSubs);

		List.$scanResults.innerHTML = '';
		List.$usersTable.childElements().invoke('hide');
		List.$subsTable.childElements().invoke('hide');

		var usersShowing = 0, subsShowing = 0;

		var args = Array.from(arguments);
		if (!args.length) args.push(Users);

		args.forEach(processTarget);

		if (!usersShowing) List.$usersPlaceholder.show();
		if (!subsShowing) List.$subsPlaceholder.show();

		function checkVisibility(target) {
			switch (List.listMode) {
				case 'visible':
					if (!target.hasNodes()) return false;
					break;
				case 'tagged':
					if (!target.hasNodes() || !target.hasTags()) return false;
					break;
				case 'untagged':
					if (!target.hasNodes() || target.hasTags()) return false;
					break;
				case 'all-tagged':
					if (!target.hasTags()) return false;
					break;
				case 'all': break;
			}
			return true;
		}
		function processTarget(target) {
			if (target instanceof User) {
				processUser(target);
			} else if (target instanceof Submission) {
				processSubmission(target);
			} else if (typeof target === 'object') {
				for (var id in target) processTarget(target[id]);
			}
		}
		function processUser(user) {
			if (!checkVisibility(user)) return;
			usersShowing++;
			updateRow(List.$usersTable, user);
			for (var sid in user.submissions) {
				subsShowing++;
				updateRow(List.$subsTable, user.submissions[sid]);
			}
		}
		function processSubmission(submission) {
			if (!checkVisibility(submission)) return;
			subsShowing++;
			updateRow(List.$subsTable, submission);
			if (submission.user) {
				usersShowing++;
				updateRow(List.$usersTable, submission.user);
			}
		}
		function updateRow($table, target) {
			var $row = $table.querySelector('[id="' + target.id + '"]');
			if (!$row) {
				return debug.fatal('Missing row for ' + target.id);
			}
			var $dropdown = $row.querySelector('select.add-tag');
			var filters = {};
			for (var ID in Filters) {
				var $tag = target.getTagElement(ID);
				if (target.hasTag(ID)) {
					if (!$tag) continue;
					var $remove = $tag.querySelector('.remove');
					if (!$remove) {
						$remove = html('span', {class: 'remove'}, 'x').whenClicked(function (e, t, f) {
							Page.removeTargetFromFilter(t, f);
						}, target, ID);
						$tag.appendChild($remove);
					}
				} else {
					if ($tag) $tag.remove();
					// populate tag dropdown
					filters[ID] = Filters[ID];
				}
			}
			Utils.populateDropdown($dropdown, filters, '+');
			$row.show();
		}
	},
	search: function (query) {
		var usersMatched = 0, subsMatched = 0;
		query = String(query).toLowerCase();
		List.$usersTable.childElements().forEach(function ($row) {
			var user = Users[$row.id];
			if (!query || (user && user.id.indexOf(query) > -1)) {
				$row.show();
				usersMatched++;
			} else {
				$row.hide();
			}
		});
		List.$subsTable.childElements().forEach(function ($row) {
			var submission = Submissions[$row.id];
			if (!submission) return;
			var title = submission.getTitle();
			if (!query || submission.id.indexOf(query) > -1 || (title && title.toLowerCase().indexOf(query) > -1)) {
				$row.show();
				subsMatched++;
			} else {
				$row.hide();
			}
		});
		debug.log('Search results for "' + query + '": ' + usersMatched + ' users, ' + subsMatched + ' submissions found');
	}
};

// ==== Filter List =====

var FilterList = {
	$elem: null,
	$source: null,
	$powerButton: null,
	$filterSearch: null,
	$filterTable: null,
	initFromDocument: function ($root) {
		FilterList.$elem = $root = $root || document.body;
		FilterList.$source = $root.querySelector('#source');
		FilterList.$powerButton = $($root.querySelector('#power-button'));
		FilterList.$filterSearch = $($root.querySelector('#searchbar'));
		//FilterList.$filterSort = $($root.querySelector('#sort-filters'));
		//FilterList.$filterResults = $($root.querySelector('#search-results'));
		FilterList.$filterTable = $($root.querySelector('#filters>tbody'));
		FilterList.$source.setAttribute('href', meta.SOURCE_URL);
		FilterList.addEventHandlers();
		return FilterList.$elem;
	},
	addEventHandlers: function () {
		FilterList.$powerButton.whenClicked(FilterList.toggleApp);
		FilterList.$filterSearch.whenKeyPressed(FilterList.updateSearchResults);
		//FilterList.$filterSort.whenChanged(FilterList.sort);
	},
	update: function () {
		debug.log('Updating Filter List');
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
		var matches = [];
		FilterList.$filterTable.childElements().forEach(function ($row) {
			var name = $row.querySelector('span.text').textContent.toLowerCase();
			var id = $row.getAttribute('id');
			if (!query || name.indexOf(query) > -1) {
				$row.show();
				matches.push(id);
			} else {
				$row.hide();
			}
		});
		debug.log('Search results for "' + query + '": ' + matches + ' filters found');
		return matches;
	},
	updateSearchResults: function () {
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
		debug.log('Sorting Filters');
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
		if (enabled) {
			FilterList.$powerButton.removeClassName('disabled');
		} else {
			FilterList.$powerButton.addClassName('disabled');
		}
	},
	createTableRow: function (filter) {
		var $nameColumn = html('td');
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
			var $enable = $Switch('round', filter.options.active);
			$enable.observe('change', function () {
				FilterList.toggleFilter(filter.id, $tag);
			});
			$enable.setAttribute('title', i18n.get('popupToggleFilter', [filter.name]));

			var $remove = html('button', {class: 'remove red'}, '✖');
			$remove.observe('click', function () {
				FilterList.delete(filter.id, $row);
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
	toggleFilter: function (ID, $tag) {
		//console.log('Toggling Filter from Filter List:',ID);
		$tag.toggleClassName('disabled');
		App.toggleFilter(ID);
	},
	delete : function (ID, $row) {
		//console.log('Deleting Filter from Filter List:',ID);
		var name = Filters[ID].name;
		if (confirm(i18n.get('confirmDelete', [name]))) {
			$row.remove();
			App.deleteFilter(ID);
		}
	}
};

// ===== Page Functions =====

var Page = {
	INITIAL_LOAD: true,
	LoggedInUser: null,
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
	init: function () {
		Page.clear();
		var data = scrape(document);
		Users = data.users;
		Submissions = data.submissions;
		Page.LoggedInUser = data.logged_in_user;
		Page.addEventHandlers();
	},
	addEventHandlers: function () {
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
	update: function (forceScan) {
		var results;
		Page.updateTags();
		if (Options.enabled) {
			if (Page.INITIAL_LOAD || Options.alwaysScan || forceScan) {
				Page.INITIAL_LOAD = false;
				App.updateFilters(results = Page.scanContent(Filters));
			}
			Page.apply(App.getAppData());
		} else {
			Page.backToNormal();
		}
		return results;
	},
	updateTags: function () {
		for (var name in Users) {
			Users[name].updateTags(Filters);
		}
		for (var id in Submissions) {
			Submissions[id].updateTags(Filters);
		}
	},
	backToNormal: function () {
		for (var name in Users) {
			Users[name].showNodes();
		}
		for (var id in Submissions) {
			Submissions[id].showNodes();
		}
	},
	scanContent: function (filters) {
		var payload = {};
		for (var ID in filters) {
			var filter = filters[ID];

			// skip disabled filters
			if (!filter.options.active) continue;

			// skip whitelists since those are usually not for automatically filtering out
			if (filter.type === Filter.WHITELIST) continue;

			// do automatic search and filter
			payload[ID] = {users: [], submissions: []};
			if (filter.options.matchTitle) {
				for (var id in Submissions) {
					var submission = Submissions[id];
					var user = submission.user;

					if (submission.hasTag(ID)) continue;
					if (filter.options.ignore && submission.whitelisted) continue;

					var matches = submission.matchNodes(filter.keywords, 'title');

					if (matches && matches.length) {
						if (filter.options.sensitive) {
							user.addTag(ID);
							if (!filter.options.temporary) {
								payload[ID].users.push(user.id);
							}
						} else {
							submission.addTag(ID);
							if (!filter.options.temporary) {
								payload[ID].submissions.push(submission.id);
							}
						}
					}
				}
			}
			if (filter.options.matchName) {
				for (var name in Users) {
					var user = Users[name];

					if (user.hasTag(ID)) continue;
					if (filter.options.ignore && user.whitelisted) continue;

					var matches = user.matchNodes(filter.keywords, 'username');

					if (matches && matches.length) {
						user.addTag(ID);

						if (!filter.options.temporary) {
							payload[ID].users.push(user.id);
						}
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
	addTargetToFilter: function (target, ID) {
		target.addTag(ID);
		App.addToFilter({
			filter: ID,
			target: target.id,
			type: target.type
		});
		Page.update.defer();
	},
	removeTargetFromFilter: function (target, ID) {
		target.removeTag(ID);
		App.removeFromFilter({
			filter: ID,
			target: target.id,
			type: target.type
		});
		Page.update.defer();
	},
	addTargetsToFilter: function (targets, ID) {
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
	$show: null,
	$container: null,
	$stylesheet: null,
	$mainWindow: null,
	DEFAULT_OPTIONS: {
		'locale': 'en-us',
		'enabled': true,
		'alwaysScan': false,
		'autoSort': false,
		'blurImages': false,
		'firstItem': false,
		'notifications': true,
		'devMode': false
	},
	init: function () {
		Notification.requestPermission();
		i18n.init()
		.then(Page.init)
		.then(List.init)
		.then(App.inject)
		.then(App.load);
	},
	update: function () {
		OptionsForm.update();
		FilterList.update();
		List.update();
		Page.update();
	},
	applyLocalization: function () {
		i18n.locale = Options.locale in i18n._locales ? Options.locale : i18n.DEFAULT_LOCALE;
		if (App.$mainWindow) i18n.localizeDocument(App.$mainWindow);
	},
	inject: function () {
		// insert a button into the webpage nav container
		App.$show = html('li', {id: 'show-blacklist-app'}, html('a', {href: '#'}, i18n.get('extensionNameShort')));
		App.$show.observe('click', function () {
			App.showMainWindow();
			List.update();
		});
		// find the search bar to insert next to
		var $searchBar = document.querySelector('.search-box-container');
		if (!$searchBar) {
			// beta design
			$searchBar = document.querySelector('#searchbox').parentElement;
		}
		if (!$searchBar) {
			// still no search bar?
			document.querySelector('nav>ul').appendChild(App.$show);
		} else {
			$searchBar.parentElement.insertBefore(App.$show, $searchBar);
		}
		
		App.$stylesheet = html('style');
		App.$container = html('div', {id: 'app'}, [App.$stylesheet]);
		
		// insert wrapper for windows and stylesheet
		document.body.appendChild(App.$container);
		
		// lazily load the stylesheet for the app from cache or repo
		return GM.getValue('bl_stylesheet', '{}')
		.then(convertToJSON)
		.then(function (styles) {
			if (!styles || styles._version !== meta.VERSION) {
				return App._reloadStylesheet();
			} else {
				App.$stylesheet.innerHTML = styles.stylesheet;
				return true;
			}
		})
		.catch(function (err) {
			debug.error('Could not load stylesheet', err);
		});
	},
	showMainWindow: function () {
		var $window = App.$mainWindow || App.createMainWindow();
		$window.goto({x: 20, y: 60});
		$window.show();
	},
	createMainWindow: function () {
		App.$mainWindow = $Window({
			title: i18n.get('extensionNameShort') + ' ' + meta.VERSION,
			icon: (new URL(meta.ICON32_HREF, meta.ROOT)).href,
			body: $TabControl({
				'page': {
					'tab': html('span', {'data-i18n': 'pageContentsTitle'}),
					'content': List.$elem
				},
				'filters': {
					'tab': html('span', {'data-i18n': 'filters'}),
					'content': FilterList.$elem
				},
				'editor': {
					'tab': html('span', {'data-i18n': 'editorTitle'}),
					'content': Editor.$elem
				},
				'options': {
					'tab': html('span', {'data-i18n': 'options'}),
					'content': OptionsForm.$elem
				}
			}),
			canHide: true
		});
		App.applyLocalization();
		convertCheckboxesToSwitches(App.$mainWindow.body);
		App.$container.appendChild(App.$mainWindow);
		return App.$mainWindow;
	},
	_reloadStylesheet: function () {
		return fetch((new URL(meta.STYLES_HREF, meta.ROOT)).href)
		.then(function (x) {return x.text()})
		.then(function (stylesheet) {
			App.$stylesheet.innerHTML = stylesheet;
			return GM.setValue('bl_stylesheet', JSON.stringify({
				_version: meta.VERSION,
				stylesheet: stylesheet
			}));
		});
	},
	handleError: function (e) {
		console.error(e);
		alert(i18n.get('genericErrorText') + '\n' + e.message);
	},
	getAppData: function () {
		return {
			filters: Filters,
			options: Options
		};
	},
	updateFilters: function (filterChanges) {
		var change = false,
		users = [],
		submissions = [];
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
			App.saveFiltersAndUpdate(true);

			// notify the user of the changes
			if (Options.notifications) {
				function getFiltersByTags(target) {
					return target.tags.map(function (ID) {
						return Filters[ID];
					});
				}

				var resultsText = '';
				if (users.length) {
					resultsText += i18n.get('users') + ' (' + users.length + '):\n';
					resultsText += users.map(function (user) {
						return user + ' (' + getFiltersByTags(Users[user]).join(', ') + ')';
					}).join('; ');
					resultsText += '\n\n';
				}
				if (submissions.length) {
					resultsText += i18n.get('submissions') + ' (' + submissions.length + '):\n';
					resultsText += submissions.map(function (sub) {
						return '#' + sub + ' (' + getFiltersByTags(Submissions[sub]).join(', ') + ')';
					}).join('; ');
				}

				Notify(
					i18n.get('extensionNameShort') + ' - ' + i18n.get('mainScanResults'),
					resultsText,
					ICON_URL
				);
			}
		}
	},
	getFilters: function (callback) {
		if (callback) callback(Filters);
		return Filters;
	},
	setFilters: function (filters) {
		for (var ID in filters) {
			Filters[ID] = new Filter(filters[ID]);
		}
		App.saveFiltersAndUpdate();
	},
	clearFilters: function () {
		for (var id in Filters) {
			delete Filters[id];
		}
	},
	getFilter: function (ID, callback) {
		if (callback) callback(Filters[ID]);
		return Filters[ID];
	},
	setFilter: function (filter) {
		Filters[filter.id] = new Filter(filter);
		App.saveFiltersAndUpdate();
	},
	addToFilter: function (data) {
		var filter = Filters[data.filter];
		switch (data.type) {
		case 'user':
			filter.addUser(data.target);
			break;
		case 'submission':
			filter.addSubmission(data.target);
			break;
		}
		App.saveFiltersAndUpdate(true);
	},
	removeFromFilter: function (data) {
		var filter = Filters[data.filter];
		switch (data.type) {
		case 'user':
			filter.removeUser(data.target);
			break;
		case 'submission':
			filter.removeSubmission(data.target);
			break;
		}
		App.saveFiltersAndUpdate(true);
	},
	addToFilters: function (data) {
		data.filters.forEach(function (ID) {
			var filter = Filters[ID];
			switch (data.type) {
			case 'user':
				filter.addUser(data.target);
				break;
			case 'submission':
				filter.addSubmission(data.target);
				break;
			}
		});
		App.saveFiltersAndUpdate(true);
	},
	removeFromFilters: function (data) {
		data.filters.forEach(function (ID) {
			var filter = Filters[ID];
			switch (data.type) {
			case 'user':
				filter.removeUser(data.target);
				break;
			case 'submission':
				filter.removeSubmission(data.target);
				break;
			}
		});
		App.saveFiltersAndUpdate(true);
	},
	addAllToFilter: function (data) {
		var filter = Filters[data.filter];
		switch (data.type) {
		case 'user':
			filter.addUsers(data.targets);
			break;
		case 'submission':
			filter.addSubmissions(data.targets);
			break;
		}
		App.saveFiltersAndUpdate(true);
	},
	removeAllFromFilter: function (data) {
		var filter = Filters[data.filter];
		switch (data.type) {
		case 'user':
			filter.removeUsers(data.targets);
			break;
		case 'submission':
			filter.removeSubmissions(data.targets);
			break;
		}
		App.saveFiltersAndUpdate(true);
	},
	toggleFilter: function (ID, callback) {
		var filter = Filters[ID];
		filter.options.active = !filter.options.active;
		App.saveFiltersAndUpdate(true);
		if (callback) callback(null);
	},
	deleteFilter: function (ID) {
		var filter = Filters[ID];
		delete Filters[ID];
		App.saveFiltersAndUpdate(true);
	},
	setOptions: function (options) {
		for (var key in Options) {
			if (key in options) {
				Options[key] = options[key];
			}
		}
	},
	resetOptions: function () {
		Object.assign(Options, App.DEFAULT_OPTIONS);
	},
	toggle: function () {
		Options.enabled = !Options.enabled;
		App.saveAndUpdate();
	},
	reset: function () {
		App.clearFilters();
		App.resetOptions();
		App.saveAndUpdate();
	},
	load: function () {
		App.resetOptions();
		App.clearFilters();
		return GM.getValue('bl_options')
		.then(function (options) {
			if (options) {
				options = convertToJSON(options);
				App.setOptions(options);
			}
			return GM.getValue('bl_blacklists')
			.then(function (filters) {
				if (filters) {
					filters = convertToJSON(filters);
					App.setFilters(filters);
				}
				App.update();
			});
		})
		.catch(App.handleError);
	},
	save: function () {
		App.saveOptions();
		App.saveFilters();
	},
	saveAndUpdate: function () {
		App.save();
		App.update();
	},
	saveOptions: function () {
		return GM.setValue('bl_options', JSON.stringify(Options)).catch(App.handleError);
	},
	saveOptionsAndUpdate: function () {
		App.saveOptions();
		App.update();
	},
	saveFilters: function () {
		return GM.setValue('bl_blacklists', JSON.stringify(Filters)).catch(App.handleError);
	},
	saveFiltersAndUpdate: function (pageOnly) {
		App.saveFilters();
		if (pageOnly)
			Page.update();
		else
			App.update();
	},
	import: function (data) {
		App.setOptions(data.options);
		App.setFilters(data.filters);
		App.saveAndUpdate();
	},
	export: function () {
		exportFile('fa-blacklist_export_' + (new Date()).toLocaleString() + '.json', App.getAppData());
	}
};

// ===== App UI Setup =====

var $List = parseHTML(`
<div id="list">
	<div id="scan">
		<button id="scan-now" data-i18n="scanNowText"></button>
		<span id="scan-results"></span>
	</div>
	<div id="search">
		<input type="textbox" id="searchbar" data-i18n="searchPlaceholder,placeholder">
		<select id="list-mode">
			<option value="visible" selected>Visible on page</option>
			<option value="tagged">Tagged-Only</option>
			<option value="untagged">Untagged-Only</option>
			<option value="all-tagged">All Tagged-Only</option>
			<option value="all">All</option>
		</select>
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
var $Filters = parseHTML(`
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
			<p class="small"><span data-i18n="popupLove"></span> | <a href="${meta.SOURCE_URL}" id="source">GitHub</a> | <a href="${meta.SOURCE_URL}/LICENSE">MIT License</a></p>
		</center>
	</div>
</div>
`);
var $Editor = parseHTML(`
<div id="editor">
	<div class="group buttons" id="topnav">
		<center>
			<button id="new-filter" class="control" data-i18n="editorNewTitle,title;editorNewText"></button>
			<button id="save-filter" class="control" data-i18n="editorSaveTitle,title;editorSaveText"></button>
			<button id="copy-filter" class="control" data-i18n="editorCopyTitle,title;editorCopyText"></button>
			<button id="load-filter" class="control" data-i18n="editorLoadTitle,title;editorLoadText"></button>
			<select id="filter-dropdown" value="" style="display:none;"></select>
			<button id="delete-filter" class="control" data-i18n="editorDeleteTitle,title;editorDeleteText"></button>
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
			<tr class="row" data-i18n="editorDescriptionTitle,title">
				<td data-i18n="editorDescriptionText"></td>
				<td><input type="textbox" id="description" data-i18n="editorDescriptionPlaceholder,placeholder"></td>
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
				<tr class="row" data-i18n="editorIgnoreWhitelistsTitle,title">
					<td><label for="sensitive" data-i18n="editorIgnoreWhitelistsText"></label></td>
					<td><input type="checkbox" id="ignore"></td>
				</tr>
				<tr class="row" data-i18n="editorTemporaryTitle,title">
					<td><label for="sensitive" data-i18n="editorTemporaryText"></label></td>
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
var $Options = parseHTML(`
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
			<td><label for="blurImages" data-i18n="optionsBlur"></label></td>
			<td><input type="checkbox" class="option" id="blurImages"></td>
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
		<button id="reload-caches" class="green">Reload Caches</button>
	</div>
</div>
`);

List.initFromDocument($List);
FilterList.initFromDocument($Filters);
Editor.initFromDocument($Editor);
OptionsForm.initFromDocument($Options);

window.addEventListener('load', App.init);
window.addEventListener('focus', function (e) {
	if (e.target === window) App.load();
});
window.addEventListener('beforeunload', Editor.catchUnsavedChanges);
