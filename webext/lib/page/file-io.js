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
	var a = document.createElement('a');
	a.setAttribute('href', 'data:' + type + ';base64,' + b64EncodeUnicode(data));
	a.setAttribute('download', filename);
	click(a);
}
function importFile(file, callback) {
	var f = new FileReader();
	f.onload = function(e) {
		callback(e.target.result);
	};
	f.readAsText(file);
}
