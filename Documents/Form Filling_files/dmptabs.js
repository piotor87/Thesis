var DMPTabs = {
	instances: {},
	defaultInstanceID: 'tabs',
	isInitialized: false,
	selected: 'selected',

	initialize: function (args) {
		var hasNewJquery = true;
		if ($.fn.jquery) {
			var parts = $.fn.jquery.split('.');
			if (parts.length > 1) {
				var majorVersion = parseInt(parts[0]);
				var minorVersion = parseInt(parts[1]);
				if (majorVersion >= 2 || (majorVersion === 1 && minorVersion >= 9)) {
					hasNewJquery = false;
				}
			}
		}
		if (hasNewJquery) {
			this.selected = 'active';
		}

		if ($.isArray(args)) {
			for (var i = 0, n = args.length; i < n; ++i) {
				if (!args[i].hasOwnProperty('id')) {
					args[i].id = this.defaultInstanceID + i;
				}
				this.createInstance(args[i]);
			}
		} else {
			this.createInstance(args);
		}
		this.isInitialized = true;
	},

	createInstance: function (options) {
		var instance = {
			id: '',
			tabs: {},
			debug: false
		};

		instance.tabs = options.tabs;

		if ($.isArray(instance.tabs)) {
			var tmpTabs = instance.tabs;
			instance.tabs = {};
			for (var i = 0, n = tmpTabs.length; i < n; ++i) {
				instance.tabs[tmpTabs[i]] = {};
			}
		}

		instance.id = options.id || this.defaultInstanceID;
		instance.isVisible = (options.hasOwnProperty('isVisible')) ? options.isVisible : true;
		instance.onCreate = options.onCreate || null;
		instance.onShow = options.onShow || null;
		instance.debug = (options.hasOwnProperty('debug')) ? options.debug : false;

		var $div = $('<div id="' + instance.id + '"></div>');
		$ul = $('<ul></ul>');

		var hasPages = false;
		var tabIndex = 0;
		var tabID = '';
		var tab = null;
		var disabledTabIndexes = [];
		for (var label in instance.tabs) {
			if ($.isArray(instance.tabs[label])) {
				instance.tabs[label] = { fieldNames: instance.tabs[label] };
			}

			if (!instance.tabs[label].hasOwnProperty('fieldNames')) {
				instance.tabs[label].fieldNames = [];
			}

			if (instance.tabs[label].hasOwnProperty('fields')) {
				instance.tabs[label].fieldNames = instance.tabs[label].fields;
			}

			if (instance.tabs[label].hasOwnProperty('fieldNamePrefix')) {
				instance.tabs[label].fieldNamePrefixes = [instance.tabs[label].fieldNamePrefix];
			}
			if (instance.tabs[label].hasOwnProperty('fieldNameSuffix')) {
				instance.tabs[label].fieldNameSuffixes = [instance.tabs[label].fieldNameSuffix];
			}

			var hasFieldPrefix = false;
			var hasFieldSuffix = false;
			if (instance.tabs[label].hasOwnProperty('fieldNamePrefixes') || instance.tabs[label].hasOwnProperty('fieldNameSuffixes')) {
				for (var fieldName in FieldIDs) {
					hasFieldPrefix = false;
					hasFieldSuffix = false;
					if (instance.tabs[label].hasOwnProperty('fieldNamePrefixes')) {
						for (var i = 0, n = instance.tabs[label].fieldNamePrefixes.length; i < n; ++i) {
							if (fieldName.indexOf(instance.tabs[label].fieldNamePrefixes[i]) === 0) {
								hasFieldPrefix = true;
								break;
							}
						}
					}
					if (instance.tabs[label].hasOwnProperty('fieldNameSuffixes')) {
						for (var i = 0, n = instance.tabs[label].fieldNameSuffixes.length; i < n; ++i) {
							if (fieldName.indexOf(instance.tabs[label].fieldNameSuffixes[i]) > -1 && fieldName.indexOf(instance.tabs[label].fieldNameSuffixes[i]) === (fieldName.length - instance.tabs[label].fieldNameSuffixes[i].length)) {
								hasFieldSuffix = true;
								break;
							}
						}
					}
					if ((instance.tabs[label].hasOwnProperty('fieldNamePrefixes') && instance.tabs[label].hasOwnProperty('fieldNameSuffixes') && hasFieldPrefix && hasFieldSuffix) ||
						(instance.tabs[label].hasOwnProperty('fieldNamePrefixes') && !instance.tabs[label].hasOwnProperty('fieldNameSuffixes') && hasFieldPrefix) ||
						(!instance.tabs[label].hasOwnProperty('fieldNamePrefixes') && instance.tabs[label].hasOwnProperty('fieldNameSuffixes') && hasFieldSuffix)
					) {
						instance.tabs[label].fieldNames.push(fieldName);
					}
				}
			}

			instance.tabs[label].index = tabIndex;

			if (instance.tabs[label].hasOwnProperty('page')) {
				hasPages = true;
			}
			if (!instance.tabs[label].hasOwnProperty('isEnabled')) {
				instance.tabs[label].isEnabled = function () { return true; };
			} else {
				if (typeof instance.tabs[label].isEnabled == 'string' && FieldIDs.hasOwnProperty(instance.tabs[label].isEnabled)) {
					instance.tabs[label].isEnabled = [instance.tabs[label].isEnabled];
				}
				if ($.isArray(instance.tabs[label].isEnabled)) {
					instance.tabs[label].isEnabledFieldID = FieldIDs[instance.tabs[label].isEnabled[0]];
					if (instance.tabs[label].isEnabled.length >= 2) {
						instance.tabs[label].isEnabledValue = instance.tabs[label].isEnabled[1];
					}

					instance.tabs[label].isEnabled = function () {
						var currentValue = PFSF_GetFieldValueByName('FIELD_' + this.isEnabledFieldID, true);

						if (this.hasOwnProperty('isEnabledValue')) {
							if (currentValue != this.isEnabledValue) {
								return false;
							}
						} else {
							if (!!currentValue === false) {
								return false;
							}
						}

						return true;
					}
				}
			}

			if (instance.tabs[label].hasOwnProperty('isEnabled') && (
				(typeof instance.tabs[label].isEnabled === 'boolean' && instance.tabs[label].isEnabled === false) ||
				(typeof instance.tabs[label].isEnabled === 'function' && instance.tabs[label].isEnabled.call(instance.tabs[label]) === false)
			)) {
				disabledTabIndexes.push(instance.tabs[label].index);
			}

			tabID = instance.id + '-' + tabIndex;
			$('<li><a href="#' + tabID + '">' + label + '</a></li>').appendTo($ul);
			$tab = $('<div id="' + tabID + '"></div>');
			for (var i = 0, n = instance.tabs[label].fieldNames.length; i < n; ++i) {
				if ($('td.formFilling-form').length > 0) {
					if ($('#DIV_' + FieldIDs[instance.tabs[label].fieldNames[i]]).closest('table.DMPTablizer_table', $('td.formFilling-form > div.block:first')).length > 0) {
						$('#DIV_' + FieldIDs[instance.tabs[label].fieldNames[i]]).closest('table.DMPTablizer_table', $('td.formFilling-form > div.block:first')).appendTo($tab);
					} else {
						$('#DIV_' + FieldIDs[instance.tabs[label].fieldNames[i]]).appendTo($tab);
					}
				} else {
					if ($('#DIV_' + FieldIDs[instance.tabs[label].fieldNames[i]]).closest('table.DMPTablizer_table', $('td.area > div.block:nth-child(2)')).length > 0) {
						$('#DIV_' + FieldIDs[instance.tabs[label].fieldNames[i]]).closest('table.DMPTablizer_table', $('td.area > div.block:nth-child(2)')).appendTo($tab);
					} else {
						$('#DIV_' + FieldIDs[instance.tabs[label].fieldNames[i]]).appendTo($tab);
					}
				}
			}
			$tab.appendTo($div);
			tabIndex++;
		}
		$ul.prependTo($div);
		if (options.hasOwnProperty('insertBefore')) {
			if (FieldIDs.hasOwnProperty(options.insertBefore)) {
				// If the insertBefore value is a field name...
				$div.insertBefore('#DIV_' + FieldIDs[options.insertBefore]);
			} else {
				// If the insertBefore value is a selector...
				$div.insertBefore(options.insertBefore);
			}
		} else if (options.hasOwnProperty('insertAfter')) {
			if (FieldIDs.hasOwnProperty(options.insertAfter)) {
				// If the insertAfter value is a field name...
				$div.insertAfter('#DIV_' + FieldIDs[options.insertAfter]);
			} else {
				// If the insertAfter value is a selector...
				$div.insertAfter(options.insertAfter);
			}
		} else if (options.hasOwnProperty('appendTo')) {
			for (var instanceID in this.instances) {
				if (this.instances[instanceID].tabs.hasOwnProperty(options.appendTo)) {
					// If the appendTo value is a tab label...
					options.appendTo = '#' + instanceID + '-' + this.instances[instanceID].tabs[options.appendTo].index;
				}
			}
			// If the appendTo value is a selector...
			$div.appendTo(options.appendTo);
		} else {
			if ($('td.formFilling-form').length > 0) {
				$div.appendTo('td.formFilling-form > div.block:first');
			} else {
				$div.appendTo('td.area > div.block:nth-child(2)');
			}
		}

		var initOptions = {};

		var validationErrors = $('div.validationError[id^="VALID_VAR_"]:not(:empty)');
		if (validationErrors.length > 0) {
			var tabID = null;
			var errorFieldID, errorFieldName;
			for (var i = 0, n = validationErrors.length; i < n; ++i) {
				errorFieldID = parseInt($(validationErrors[i]).attr('id').split('_')[2], 10);
				for (var name in FieldIDs) {
					if (FieldIDs[name] == errorFieldID) {
						errorFieldName = name;
						break;
					}
				}
				for (var label in instance.tabs) {
					if ($.inArray(errorFieldName, instance.tabs[label].fieldNames) > -1) {
						tabID = instance.tabs[label].index;
						break;
					}
				}
				if (tabID !== null) {
					initOptions[this.selected] = tabID;
					break;
				}
			}
		}

		if (!initOptions.hasOwnProperty(this.selected) && location.search.indexOf('?varname') > -1 && location.search.indexOf('&varvalue') > -1) {
			var matches = location.search.match(/\?varname=([^&]+)/);
			if (matches !== null && matches.length > 0) {
				var varName = matches[1];
				var tabID = null;
				for (var label in instance.tabs) {
					if ($.inArray(varName, instance.tabs[label].fieldNames) > -1) {
						tabID = instance.tabs[label].index;
						break;
					}
				}
				if (tabID !== null) {
					initOptions[this.selected] = tabID;
				}
			}
		}

		if (hasPages) {
			initOptions['show'] = function (event, ui) {
				// Fired when the user actually clicks the tab
				var selectedTabIndex = ui.index;
				var selectedTabLabel = $(ui.tab).text();
				var instanceID = event.target.id;
				if (
					DMPTabs.instances[instanceID].tabs[selectedTabLabel].hasOwnProperty('page') &&
					typeof DMPPageControls !== 'undefined' &&
					DMPPageControls.isInitialized
				) {
					var page;
					if (typeof DMPTabs.instances[instanceID].tabs[selectedTabLabel].page === 'function') {
						page = DMPTabs.instances[instanceID].tabs[selectedTabLabel].page.call();
					} else {
						page = DMPTabs.instances[instanceID].tabs[selectedTabLabel].page;
					}

					if (page) {
						DMPPageControls.goto(page, false);
					}
				}
				if (instance.hasOwnProperty('onShow') && typeof instance['onShow'] === 'function') {
					var instanceID = event.target.id;
					DMPTabs.instances[instanceID]['onShow'].call(DMPTabs.instances[instanceID], event, ui);
				}
			};

			/*
						if (!initOptions.hasOwnProperty('selected') && typeof DMPPageControls !== 'undefined' && DMPPageControls.isInitialized) {
							for (var i = 0, n = instance.tabs[DMPPageControls]; i < n; i++) {
								if (DMPPageControls.currentPage.tabs[i].tabsID === instanceID) {
									initOptions['selected'] = parseInt(instance.tabs[DMPPageControls.currentPage.tabs[i].tab].index, 10) || 0;
									break;
								}
							}
						}
			*/

			if (!initOptions.hasOwnProperty(this.selected)) {
				initOptions[this.selected] = 0;
			}
		}
		if (disabledTabIndexes.length > 0) {
			initOptions['disabled'] = disabledTabIndexes;
		}

		if (instance.hasOwnProperty('isVisible') && (
			(typeof instance.isVisible === 'boolean' && instance.isVisible === false) ||
			(typeof instance.isVisible === 'function' && instance.isVisible.call(instance) === false)
		)) {
			if (instance.hasOwnProperty('onCreate') && typeof instance['onCreate'] === 'function') {
				initOptions['create'] = function (event, ui) {
					var instanceID = event.target.id;
					DMPTabs.instances[instanceID]['onCreate'].call(DMPTabs.instances[instanceID], event, ui);
					$('#' + instanceID).hide();
				}
			} else {
				initOptions['create'] = function (event, ui) {
					var instanceID = event.target.id;
					$('#' + instanceID).hide();
				}
			}
		} else if (instance.hasOwnProperty('onCreate') && typeof instance['onCreate'] === 'function') {
			initOptions['create'] = function (event, ui) {
				var instanceID = event.target.id;
				DMPTabs.instances[instanceID]['onCreate'].call(DMPTabs.instances[instanceID], event, ui);
			}
		}

		this.instances[instance.id] = instance;

		if ($.isEmptyObject(initOptions)) {
			$div.tabs();
		} else {
			$div.tabs(initOptions);
		}
	},

	getCurrentTabIndex: function (instanceID) {
		instanceID = instanceID || this.defaultInstanceID;
		return $('#' + instanceID).tabs('option', this.selected);
	},

	getCurrentTabName: function (instanceID) {
		instanceID = instanceID || this.defaultInstanceID;
		var instance = this.instances[instanceID];
		var selectedTabIndex = $('#' + instanceID).tabs('option', this.selected);
		for (var label in instance.tabs) {
			if (instance.tabs[label].index == selectedTabIndex) {
				return label;
			}
		}
		return '';
	},

	goto: function (label, instanceID) {
		if (!this.isInitialized) {
			return false;
		}
		instanceID = instanceID || this.defaultInstanceID;
		var instance = this.instances[instanceID];
		if ($('#' + instanceID).tabs('option', this.selected) != instance.tabs[label].index &&
			(instance.tabs[label].hasOwnProperty('isEnabled') || (
				(typeof instance.tabs[label].isEnabled === 'boolean' && instance.tabs[label].isEnabled === false) ||
				(typeof instance.tabs[label].isEnabled === 'function' && instance.tabs[label].isEnabled.call(instance.tabs[label]) === false)
			)
			)) {

			$('#' + instanceID).tabs('option', this.selected, instance.tabs[label].index);
		}
	},

	update: function () {
		if (!this.isInitialized) {
			return false;
		}
		var instance;

		var instanceIDs = [];
		for (var instanceID in this.instances) {
			instanceIDs.push(instanceID);
		}
		instanceIDs.reverse();

		// for (var instanceID in this.instances) {
		var instanceID;
		for (var i = 0, n = instanceIDs.length; i < n; i++) {
			instanceID = instanceIDs[i];
			instance = this.instances[instanceID];
			if (instance.debug) {
				console.log('update, instance ' + instanceID);
			}

			if (instance.hasOwnProperty('isVisible') && (
				(typeof instance.isVisible === 'boolean' && instance.isVisible === false) ||
				(typeof instance.isVisible === 'function' && instance.isVisible.call(instance) === false)
			)) {
				$('#' + instanceID).hide();
			} else {
				$('#' + instanceID).show();
			}

			var disabledTabIndexes = [];
			var enabledTabIndexes = [];
			var numberOfTabs = 0;

			for (var label in instance.tabs) {
				if (instance.tabs[label].hasOwnProperty('isEnabled')) {
					if (typeof instance.tabs[label].isEnabled === 'boolean') {
						if (instance.tabs[label].isEnabled === false) {
							if (instance.debug) {
								console.log('tab ' + label + ': is boolean, equals false, should NOT be enabled');
							}
							disabledTabIndexes.push(instance.tabs[label].index);
						} else {
							if (instance.debug) {
								console.log('tab ' + label + ': is boolean, does NOT equal false, should be enabled');
							}
							enabledTabIndexes.push(instance.tabs[label].index);
						}
					} else if (typeof instance.tabs[label].isEnabled === 'function') {
						if (instance.tabs[label].isEnabled.call(instance.tabs[label]) === false) {
							if (instance.debug) {
								console.log('tab ' + label + ': is function, equals false, should NOT be enabled');
							}
							disabledTabIndexes.push(instance.tabs[label].index);
						} else {
							if (instance.debug) {
								console.log('tab ' + label + ': is function, does NOT equal false, should be enabled');
							}
							enabledTabIndexes.push(instance.tabs[label].index);
						}
					} else {
						if (instance.debug) {
							console.log('tab ' + label + ': is something else, should be enabled');
						}
						enabledTabIndexes.push(instance.tabs[label].index);
					}
				} else {
					if (instance.debug) {
						console.log('tab ' + label + ': has no isEnabled property, should be enabled');
					}
					enabledTabIndexes.push(instance.tabs[label].index);
				}
				numberOfTabs++;
			}

			if (instance.debug) {
				console.log('disabledTabIndexes:');
				console.log(disabledTabIndexes);
				console.log('enabledTabIndexes:');
				console.log(enabledTabIndexes);
			}

			$('#' + instanceID).tabs('option', 'disabled', []);

			if (disabledTabIndexes.length > 0) {
				var selectedTabIndex = $('#' + instanceID).tabs('option', this.selected);
				if ($.inArray(selectedTabIndex, disabledTabIndexes) > -1) {
					var j = 0;
					var ok = false;
					var previousTab;
					var nextTab;
					while (++j) {
						previousTabIndex = selectedTabIndex - j;
						if (previousTabIndex >= 0) {
							if ($.inArray(previousTabIndex, disabledTabIndexes) < 0) {
								$('#' + instanceID).tabs('option', this.selected, previousTabIndex);
								ok = true;
								break;
							}
						}
						nextTabIndex = selectedTabIndex + j;
						if (nextTabIndex < numberOfTabs + 1) {
							if ($.inArray(nextTabIndex, disabledTabIndexes) < 0) {
								$('#' + instanceID).tabs('option', this.selected, nextTabIndex);
								ok = true;
								break;
							}
						}
						if (previousTabIndex < 0 && nextTabIndex >= numberOfTabs) {
							break;
						}
					}
					if (!ok) {
						$('#' + instanceID).tabs('option', this.selected, 0);
					}
				}
			}

			if (instance.debug) {
				console.log('disabling tabs:');
				console.log(disabledTabIndexes);
				console.log('instance div:');
				console.log($('#' + instanceID));
			}

			// if (!instance.debug) {
			$('#' + instanceID).tabs('option', 'disabled', disabledTabIndexes);
			// }
		}
	}
}