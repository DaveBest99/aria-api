var constants = require('./constants.js');
var util = require('./util.js');

var getSubRoles = function(role) {
	var children = constants.subRoles[role] || [];
	var descendents = children.map(getSubRoles);

	var result = [role];

	children.forEach(function(r) {
		if (result.indexOf(r) == -1) {
			result.push(r);
		}
	});
	descendents.forEach(function(list) {
		list.forEach(function(r) {
			if (result.indexOf(r) == -1) {
				result.push(r);
			}
		});
	});

	return result;
};

var getRole = function(el) {
	if (el.hasAttribute('role')) {
		return el.getAttribute('role');
	}
	for (var role in constants.extraSelectors) {
		var selector = constants.extraSelectors[role].join(',');
		if (el.matches(selector)) {
			return role;
		}
	}

	var notScoped = [
		'article', 'aside', 'main', 'nav', 'section',
	].map(function(key) {
		return key + ' *';
	}).join(',');

	if (el.matches('header') && !el.matches(notScoped)) {
		return 'banner';
	}
	if (el.matches('footer') && !el.matches(notScoped)) {
		return 'contentinfo';
	}
};

var getAttribute = function(el, key) {
	var type = constants.attributes[key];
	var raw = el.getAttribute('aria-' + key);

	if (raw) {
		if (type === 'bool') {
			return raw === 'true';
		} else if (type === 'tristate') {
			return raw === 'true' ? true : raw === 'false' ? false : 'mixed';
		} else if (type === 'bool-undefined') {
			return raw === 'true' ? true : raw === 'false' ? false : undefined;
		} else if (type === 'id-list') {
			return raw.split(/\s+/);
		} else if (type === 'integer') {
			return parseInt(raw);
		} else if (type === 'number') {
			return parseFloat(raw);
		} else if (type === 'token-list') {
			return raw.split(/\s+/);
		} else {
			return raw;
		}
	}

	if (key === 'level') {
		for (var i = 1; i <= 6; i++) {
			if (el.tagName === 'H' + i) {
				return i;
			}
		}
	} else if (key === 'disabled') {
		return el.disabled;
	} else if (key === 'placeholder') {
		return el.placeholder;
	} else if (key === 'required') {
		return el.required;
	} else if (key === 'readonly') {
		return el.readonly;
	} else if (key === 'hidden') {
		var style = window.getComputedStyle(el);
		return el.hidden || style.display === 'none' || style.visibility === 'hidden';
	} else if (key === 'invalid' && el.checkValidity) {
		return el.checkValidity();
	}

	if (type === 'bool' || type === 'tristate') {
		return false;
	}
};

var matches = function(el, selector) {
	var actual;

	if (selector.substr(0, 1) === ':') {
		var attr = selector.substr(1);
		return getAttribute(el, attr);
	} else if (selector.substr(0, 1) === '[') {
		var match = /\[([a-z]+)="(.*)"\]/.exec(selector);
		actual = getAttribute(el, match[1]);
		var rawValue = match[2];
		return actual.toString() == rawValue;
	} else {
		actual = getRole(el);
		var candidates = getSubRoles(selector);
		return candidates.indexOf(actual) != -1;
	}
};

var _querySelector = function(all) {
	return function(root, role) {
		var results = [];
		util.walkDOM(root, function(node) {
			if (node.nodeType === node.ELEMENT_NODE) {
				// FIXME: skip hidden elements
				if (matches(node, role)) {
					results.push(node);
					if (!all) {
						return false;
					}
				}
			}
		});
		return all ? results : results[0];
	};
};

module.exports = {
	getRole: getRole,
	getAttribute: getAttribute,
	matches: matches,
	querySelector: _querySelector(),
	querySelectorAll: _querySelector(true),
};
