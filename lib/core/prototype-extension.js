/* Extends many of the Prototype namespaces with more methods */

if (!Prototype) {
	throw 'Prototype is missing.';
}

function noop() {}
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
	var e = document.createElement(tag).setProperties(attr);
	return Element.prototype.append.apply(e, children);
}

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
/*
Object.extend(Object.prototype, (function () {
	function setProperty(prop, value) {
		// don't overwrite existing properties
		if (Object.isUndefined(this[prop]) && !Object.isUndefined(value)) {
			this[prop] = value;
		}
		return this;
	}
	function getProperty(prop) {
		var descriptor = Object.getOwnPropertyDescriptor(this, prop);
		return defaults(descriptor, {});
	}
	function defineProperty(prop, descriptor) {
		descriptor.writable     = defaults(descriptor.writable, true);
		descriptor.configurable = defaults(descriptor.configurable, true);
		descriptor.enumerable   = defaults(descriptor.enumerable, false);
		Object.defineProperty(this, prop, descriptor);
		return this;
	}
	function defineGetter(prop, callback) {
		this.__defineGetter__(prop, callback);
		return this;
	}
	function defineSetter(prop, callback) {
		this.__defineSetter__(prop, callback);
		return this;
	}
	function defineAccessor(prop, getterFn, setterFn) {
		return this.defineGetter(prop, getterFn).defineSetter(prop, setterFn);
	}
	function lookupGetter(prop) {
		return this.__lookupGetter__(prop);
	}
	function lookupSetter(prop) {
		return this.__lookupSetter__(prop);
	}
	function copyProperty(srcObj, prop) {
		var descriptor = Object.getOwnPropertyDescriptor(srcObj, prop);
		return this.defineProperty(prop, descriptor);
	}
	function copyProperties(srcObj) {
		if (Object.assign) {
			Object.assign(this, srcObj);
		} else {
			for (var k in srcObj) {
				this.copyProperty(srcObj, k);
			}
		}
		return this;
	}
	function bindMethod(srcFn) {
		if (!Object.isFunction(srcFn)) {
			throw new TypeError(typeof srcFn + ' is not a function');
		}
		return this.setProperty(srcFn.name, srcFn.bind(this));
	}
	function equals(x) {
		return JSON.stringify(this) === JSON.stringify(x);
	}
	
	return {
		setProperty:    setProperty,
		getProperty:    getProperty,
		defineProperty: defineProperty,
		defineGetter:   defineGetter,
		defineSetter:   defineSetter,
		defineAccessor: defineAccessor,
		lookupGetter:   lookupGetter,
		lookupSetter:   lookupSetter,
		copyProperty:   copyProperty,
		copyProperties: copyProperties,
		bindMethod:     bindMethod,
		equals:         equals
	};
})());
*/
Object.extend(Function, (function () {
	var slice = Array.prototype.slice;
	function rest(args) {
		return slice.call(args, args.callee.length);
	}
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
	
	return {
		rest:   rest,
		spread: spread
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
		includes: include,
		
		remove:   remove,
		count:    count,
		invoke:   invoke,
		pluck:    pluck,
		reduce:   reduce,
		swap:     swap
	};
})());
Object.extend(Hash.prototype, (function () {
	function sort(fn) {
		var unsortedHash = this;
		var sortedHash = new Hash();
		this.keys().sort(fn).forEach(function (key) {
			sortedHash.set(key, unsortedHash.get(key));
		});
		return sortedHash;
	}
	function valuesOf(keys) {
		var hash = this;
		return keys.map(function (key) {
			hash.get(key);
		});
	}
	function invoke(callback) {
		var args = Function.rest(arguments);
		this.each(function (pair) {
			callback.apply(pair.value, args);
		});
		return this;
	}
	function map(callback) {
		var thisHash = this;
		var mappedHash = new Hash();
		this.keys().forEach(function (key) {
			var value = thisHash.get(key);
			mappedHash.set(key, callback.call(thisHash, value, key));
		});
		return mappedHash;
	}
	function filter(callback) {
		var thisHash = this;
		var filteredHash = new Hash();
		this.keys().forEach(function (key) {
			var value = thisHash.get(key);
			if (callback.call(thisHash, value, key)) {
				filteredHash.set(key, value);
			}
		});
		return filteredHash;
	}
	
	return {
		sort:     sort,
		valuesOf: valuesOf,
		invoke:   invoke,
		map:      map,
		filter:   filter
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
			this[k] = v;
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
	
	function makeHandler(context, callback, argArray) {
		return function () {
			return callback.apply(context, $A(arguments).concat(argArray));
		};
	}
	
	function whenSubmitted(callback) {
		var args = Function.rest(arguments);
		return this.observe('submit', makeHandler(this, callback, args));
	}
	function whenClicked(callback) {
		var args = Function.rest(arguments);
		return this.observe('click', makeHandler(this, callback, args));
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
