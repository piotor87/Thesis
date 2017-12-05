var DMPPageControls = {
	debug: false,

	currentPage: null,
	currentPageFieldName: 'CurrentPage',
	numberOfPages: 1,
	numberOfPagesFieldName: 'NumberOfPages',

	pages: [],
	currentPageIndex: 0, // index in pages array
	callback: null,

	defaultTabsID: 'tabs',
	tabs: [/*
		{tabsID: 'otherTabs', tab: '2'}
	*/],

	divPrefix: 'Page',
	showHideDivs: true,

	isInitialized: false,

	initialize: function (options) {
		if (!options) {
			options = {};
		}

		var css = '#vcrControls { display: none !important; }';
		$('head').first().append('<style type="text/css">' + css + '</style>');

		this.debug = options.hasOwnProperty('debug') ? options.debug : false;

		this.showHideDivs = options.showHideDivs || this.showHideDivs;
		if (this.showHideDivs) {
			this.divPrefix = options.divPrefix || this.divPrefix;
		}

		this.currentPageFieldName = options.currentPageFieldName || this.currentPageFieldName;
		if (options.hasOwnProperty('pages')) {
			if ($.isArray(options.pages)) {
				if (this.pages.length == 1) {
					return;
				}
				for (var i = 0, n = options.pages.length; i < n; ++i) {
					if (typeof options.pages[i] == 'number') {
						this.pages.push({ number: options.pages[i] + '' });
					} else if (typeof options.pages[i] == 'string') {
						this.pages.push({ number: options.pages[i] });
					} else if (typeof options.pages[i] == 'object') {
						options.pages[i].number += '';
						this.pages.push(options.pages[i]);
					}
				}
			} else if (typeof options.pages === 'object') {
				for (var number in options.pages) {
					if (options.pages.hasOwnProperty(number)) {
						options.pages[number].number = number;
						if (options.pages[number].hasOwnProperty('tab')) {
							if (typeof options.pages[number].tab === 'string' || typeof options.pages[number].tab === 'function') {
								options.pages[number].tabs = [options.pages[number].tab];
							}
						}
						if (options.pages[number].hasOwnProperty('tabs')) {
							for (var i = 0, n = options.pages[number].tabs.length; i < n; i++) {
								if (typeof options.pages[number].tabs[i] === 'string') {
									options.pages[number].tabs[i] = {
										tabsID: this.defaultTabsID,
										tab: options.pages[number].tabs[i]
									};
								} else if (typeof options.pages[number].tabs[i] === 'object') {
									if (!options.pages[number].tabs[i].hasOwnProperty('tabsID')) {
										if (options.pages[number].hasOwnProperty('tabsID')) {
											options.pages[number].tabs[i].tabsID = options.pages[number].tabsID;
										} else {
											options.pages[number].tabs[i].tabsID = this.defaultTabsID;
										}
									}
								}
							}
						}

						this.pages.push(options.pages[number]);
					}
				}
			}
		} else {
			if (options.hasOwnProperty('numberOfPages')) {
				this.numberOfPages = parseInt(options.numberOfPages, 10);
			} else if (options.hasOwnProperty('numberOfPagesFieldName')) {
				this.numberOfPages = parseInt($('#FIELD_' + FieldIDs[options.numberOfPagesFieldName]).val(), 10);
			} else {
				this.numberOfPages = parseInt($('#FIELD_' + FieldIDs[this.numberOfPagesFieldName]).val(), 10);
			}
			if (this.numberOfPages == 1) {
				return;
			}
			for (var i = 1, n = this.numberOfPages + 1; i < n; ++i) {
				this.pages.push({ number: i + '' });
			}
		}

		this.pages.sort(function (a, b) {
			var aNumber = parseInt(a.number, 10);
			var bNumber = parseInt(b.number, 10);
			if (isNaN(aNumber)) {
				aNumber = a.number;
			}
			if (isNaN(bNumber)) {
				bNumber = b.number;
			}
			if (aNumber < bNumber) {
				return -1;
			} else if (aNumber > bNumber) {
				return 1;
			}
			return 0;
		});


		var $div;
		for (var i = 0, n = this.pages.length; i < n; ++i) {
			if (!this.pages[i].hasOwnProperty('label')) {
				this.pages[i].label = this.pages[i].number.replace(/;/g, ' + ');
			}
			if (!this.pages[i].hasOwnProperty('index')) {
				this.pages[i].index = i;
			}
			if (this.pages[i].hasOwnProperty('fields') || this.pages[i].hasOwnProperty('fieldNamePrefix') || this.pages[i].hasOwnProperty('fieldNameSuffix') || this.pages[i].hasOwnProperty('fieldNamePrefixes') || this.pages[i].hasOwnProperty('fieldNameSuffixes')) {
				if (!this.pages[i].hasOwnProperty('fields')) {
					this.pages[i].fields = [];
				}

				if (this.pages[i].hasOwnProperty('fieldNamePrefix')) {
					this.pages[i].fieldNamePrefixes = [this.pages[i].fieldNamePrefix];
				}
				if (this.pages[i].hasOwnProperty('fieldNameSuffix')) {
					this.pages[i].fieldNameSuffixes = [this.pages[i].fieldNameSuffix];
				}

				var hasFieldPrefix = false;
				var hasFieldSuffix = false;
				if (this.pages[i].hasOwnProperty('fieldNamePrefixes') || this.pages[i].hasOwnProperty('fieldNameSuffixes')) {
					for (var fieldName in FieldIDs) {
						hasFieldPrefix = false;
						hasFieldSuffix = false;
						if (this.pages[i].hasOwnProperty('fieldNamePrefixes')) {
							for (var j = 0, o = this.pages[i].fieldNamePrefixes.length; j < o; ++j) {
								if (fieldName.indexOf(this.pages[i].fieldNamePrefixes[j]) === 0) {
									hasFieldPrefix = true;
									break;
								}
							}
						}
						if (this.pages[i].hasOwnProperty('fieldNameSuffixes')) {
							for (var j = 0, o = this.pages[i].fieldNameSuffixes.length; j < o; ++j) {
								if (fieldName.indexOf(this.pages[i].fieldNameSuffixes[j]) > -1 && fieldName.indexOf(this.pages[i].fieldNameSuffixes[j]) === (fieldName.length - this.pages[i].fieldNameSuffixes[j].length)) {
									hasFieldSuffix = true;
									break;
								}
							}
						}
						if ((this.pages[i].hasOwnProperty('fieldNamePrefixes') && this.pages[i].hasOwnProperty('fieldNameSuffixes') && hasFieldPrefix && hasFieldSuffix) ||
							(this.pages[i].hasOwnProperty('fieldNamePrefixes') && !this.pages[i].hasOwnProperty('fieldNameSuffixes') && hasFieldPrefix) ||
							(!this.pages[i].hasOwnProperty('fieldNamePrefixes') && this.pages[i].hasOwnProperty('fieldNameSuffixes') && hasFieldSuffix)
						) {
							this.pages[i].fields.push(fieldName);
						}
					}
				}

				$div = $('<div id="' + this.divPrefix + this.pages[i].number + '"></div>');
				if ($('td.formFilling-form').length > 0) {
					for (var j = 0, o = this.pages[i].fields.length; j < o; ++j) {
						if ($('#DIV_' + FieldIDs[this.pages[i].fields[j]]).closest('table.DMPTablizer_table', $('td.formFilling-form > div.block:first')).length > 0) {
							$('#DIV_' + FieldIDs[this.pages[i].fields[j]]).closest('table.DMPTablizer_table', $('td.formFilling-form > div.block:first')).appendTo($div);
						} else {
							$('#DIV_' + FieldIDs[this.pages[i].fields[j]]).appendTo($div);
						}
					}
				} else {
					for (var j = 0, o = this.pages[i].fields.length; j < o; ++j) {
						if ($('#DIV_' + FieldIDs[this.pages[i].fields[j]]).closest('table.DMPTablizer_table', $('td.area > div.block:nth-child(2)')).length > 0) {
							$('#DIV_' + FieldIDs[this.pages[i].fields[j]]).closest('table.DMPTablizer_table', $('td.area > div.block:nth-child(2)')).appendTo($div);
						} else {
							$('#DIV_' + FieldIDs[this.pages[i].fields[j]]).appendTo($div);
						}
					}
				}

				if ($('td.formFilling-form').length > 0) {
					$div.appendTo('td.formFilling-form > div.block:first');
				} else {
					$div.appendTo('td.area > div.block:nth-child(2)');
				}
			}
			if (!this.pages[i].hasOwnProperty('isVisible')) {
				this.pages[i].isVisible = function () { return true; }
			} else {
				if (typeof this.pages[i].isVisible == 'boolean') {
					this.pages[i].isVisibleValue = this.pages[i].isVisible;
					this.pages[i].isVisible = function () { return this.isVisibleValue; };
				}
				if (typeof this.pages[i].isVisible == 'string' && FieldIDs.hasOwnProperty(this.pages[i].isVisible)) {
					this.pages[i].isVisible = [this.pages[i].isVisible];
				}
				if ($.isArray(this.pages[i].isVisible)) {
					var fieldID = FieldIDs[this.pages[i].isVisible[0]];
					this.pages[i].isVisibleFieldID = fieldID;
					if (this.pages[i].isVisible.length == 2) {
						this.pages[i].isVisibleValue = this.pages[i].isVisible[1];
					}

					this.pages[i].isVisible = function () {
						var values = [];
						var $elements = $('[name=FIELD_' + this.isVisibleFieldID + ']');
						var type = $elements.prop('type');
						// Get the value(s) of the element
						if ($elements.length > 1) {
							if (type == 'radio') {
								values.push($elements.filter(':checked').val() || '');
							} else if (type == 'checkbox') {
								$elements.filter(':checked').each(function () {
									values.push($(this).val() || '');
								});
							}
						} else {
							if (type == 'hidden' || type == 'password' || type == 'select-one' || type == 'text' || type == 'textarea') {
								values.push($elements.val() || '');
							} else if (type == 'select-multiple') {
								values = $elements.val();
							} else if (type == 'checkbox') {
								if ($elements.prop('checked')) {
									values.push($elements.val() || '');
								} else {
									values.push($elements.attr('unvalue') || '');
								}
							}
						}

						for (var i = 0, n = values.length; i < n; ++i) {
							if (typeof this.isVisibleValue !== 'undefined') {
								if ((values[i] + '') != (this.isVisibleValue + '')) {
									return false;
								}
							} else {
								if (!!values[i] === false) {
									return false;
								}
							}
						}

						return true;
					}
				}
			}
		}

		if (options.hasOwnProperty('callback')) {
			this.callback = options.callback;
		}

		var currentPageNumber = $('#FIELD_' + FieldIDs[this.currentPageFieldName]).val();
		if (!currentPageNumber) {
			currentPageNumber = 1;
			$('#FIELD_' + FieldIDs[this.currentPageFieldName]).val(currentPageNumber);
		}
		for (var i = 0, n = this.pages.length; i < n; ++i) {
			if (this.pages[i].number == currentPageNumber) {
				this.currentPage = this.pages[i];
				break;
			}
		}
		if (!this.currentPage.isVisible()) {
			var j = 0;
			var previousPageIndex, nextPageIndex;
			while (j++) {
				previousPageIndex = i - j;
				if (previousPageIndex >= 0) {
					if (this.pages[previousPageIndex].isVisible()) {
						this.currentPage = this.pages[previousPageIndex];
						break;
					}
				}
				nextPageIndex = i + j;
				if (nextPageIndex < this.pages.length) {
					if (this.pages[nextPageIndex].isVisible()) {
						this.currentPage = this.pages[nextPageIndex];
						break;
					}
				}
				if (previousPageIndex < 0 && nextPageIndex >= this.pages.length) {
					this.currentPage = this.pages[0];
					break;
				}
			}
		}

		var html = '<table cellpadding="0" cellspacing="0" style="margin:0px auto;"><tr><td class="previewButtonFirst"><a title="First Page" onclick="DMPPageControls.first(true);" href="#"><img class="previewButtonSizer" src="Images/space.gif"></a></td><td class="previewButtonPrevious"><a title="Previous Page" onclick="DMPPageControls.prev(true);" href="#"><img class="previewButtonSizer" src="Images/space.gif"></a></td><td>';
		html += '<select id="DMPPageControls_Selector" onchange="DMPPageControls.goto(this.options[this.selectedIndex].value, true);" style="margin-left: 4px; margin-right: 8px;">';
		html += '</select>';
		html += '</td><td class="previewButtonNext"><a title="Next Page" onclick="DMPPageControls.next(true);" href="#"><img class="previewButtonSizer" src="Images/space.gif"></a></td><td class="previewButtonLast"><a title="Final Page" onclick="DMPPageControls.last(true);" href="#"><img class="previewButtonSizer" src="Images/space.gif"></a></td></tr></table>';

		$('<div class="block" id="DMPPageControls_vcrControls"></div>').html(html).insertBefore("#vcrControls");

		if (this.showHideDivs) {
			this.doShowHideDivs();
		}

		this.isInitialized = true;
		this.update();
	},

	first: function (wasUserAction) {
		this.goto(this.pages[0], wasUserAction || false);
	},

	prev: function (wasUserAction) {
		if (this.currentPage.index > 0) {
			this.goto(this.pages[this.currentPage.index - 1], wasUserAction || false);
		} else {
			this.goto(this.pages[0], wasUserAction || false);
		}
	},

	next: function (wasUserAction) {
		if (this.currentPage.index < this.pages.length - 1) {
			this.goto(this.pages[this.currentPage.index + 1], wasUserAction || false);
		} else {
			this.goto(this.pages[this.pages.length - 1], wasUserAction || false);
		}
	},

	last: function (wasUserAction) {
		this.goto(this.pages[this.pages.length - 1], wasUserAction || false);
	},

	goto: function (page, wasUserAction) {
		if (!this.isInitialized) {
			return;
		}
		
		if (typeof PFSF_xmlRequest !== 'undefined' && PFSF_xmlRequest !== null) {
			return;
		}
		
		if (typeof page === 'number') {
			page += '';
		}
		if (typeof page === 'string') {
			for (var i = 0, n = this.pages.length; i < n; ++i) {
				if (this.pages[i].number == page) {
					page = this.pages[i];
					break;
				}
			}
		}

		if (this.currentPage.number == page.number || !page.isVisible()) {
			return false;
		}

		this.currentPage = page;

		if ($('#FIELD_' + FieldIDs[this.currentPageFieldName]).length > 0) {
			$('#FIELD_' + FieldIDs[this.currentPageFieldName]).val(this.currentPage.number).change();
		}
		if (wasUserAction && page.hasOwnProperty('tabs') && typeof DMPTabs !== 'undefined' && DMPTabs.isInitialized) {
			var tab, currentTab;
			for (var i = page.tabs.length - 1; i >= 0; i--) {
				currentTab = DMPTabs.getCurrentTabName(page.tabs[i].tabsID);
				if (typeof page.tabs[i].tab === 'function') {
					tab = page.tabs[i].tab.call();
				} else {
					tab = page.tabs[i].tab;
				}
				if (tab !== currentTab) {
					DMPTabs.goto(tab, page.tabs[i].tabsID);
				}
			}
		}
		if (this.showHideDivs) {
			this.doShowHideDivs();
		}

		if (this.callback && wasUserAction) {
			this.callback.apply(this, [this.currentPage.number, this.currentPage.index]);
		}

		$('#DMPPageControls_Selector').val(this.currentPage.number);

		if ($('#FIELD_' + FieldIDs[this.currentPageFieldName]).length == 0) {
			if (typeof pageflexFFF_currentPartNumber === 'undefined' || pageflexFFF_currentPartNumber < 0) {
				PFSF_AjaxUpdateForm('', false);
			} else {
				PFSF_AjaxUpdateForm('firstpage=1&partIndex=' + pageflexFFF_currentPartNumber + '&');
			}
		}

		return false;
	},

	update: function () {
		if (this.isInitialized) {
			var html = '';
			var $select = $('#DMPPageControls_Selector');
			$select.empty();
			var $option;
			for (var i = 0, n = this.pages.length; i < n; ++i) {
				if (this.pages[i].isVisible()) {
					$option = $('<option />').val(this.pages[i].number).text(this.pages[i].label);
					if (i == this.currentPage.index) {
						$option.attr('selected', 'selected');
					}
					$option.appendTo($select);
				}
			}
		}
	},

	doShowHideDivs: function () {
		var divID = '';
		var value = '';
		var element = null;
		if (this.debug) {
			console.log('DMPPageControls: doShowHideDivs');
		}
		for (var i = 0; i < this.pages.length; ++i) {
			if (this.debug) {
				console.log(this.pages[i]);
			}
			divID = this.divPrefix + this.pages[i].number;
			if (this.debug) {
				console.log('DMPPageControls: divID = ' + divID);
			}
			element = document.getElementById(divID);
			if (element) {
				if (this.pages[i].number == this.currentPage.number) {
					value = 'block';
					if (this.debug) {
						console.log('DMPPageControls: Showing page ' + this.pages[i].number);
					}
				} else {
					value = 'none';
					if (this.debug) {
						console.log('DMPPageControls: Hiding page ' + this.pages[i].number);
					}
				}
				element.style.display = value;
			}
		}
	}
};

