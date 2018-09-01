/* switch.js */

/*
<label class="switch">
  <input type="checkbox">
  <span class="slider"></span>
</label>
*/

function Switch(type, $checkbox) {
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

function convertCheckboxesToSwitches(type, $dom) {
	$dom = $dom || document;
	$A($dom.querySelectorAll('input[type="checkbox"]')).forEach(function ($i) {
		Switch(type, $i);
	});
}
