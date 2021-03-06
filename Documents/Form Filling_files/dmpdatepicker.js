var DMPDatepicker = {
	isInitialized: false,

	instances: [],
	defaults: {
		fieldNames: ['Date'],
		fields: [],
		placeholderValue: null,

		language: 'fi',
		localize: true,
		startDate: new Date(), // today
		endDate: null, // not specified
		
		showYear: false,
		showClearButton: false
	},
	fieldNameToInstanceID: {},

	// The regional configuration in jQuery UI Datepicker isn't very reliable so we use our own
	regional: {
		'fi': {
			monthNames: ["Tammikuu","Helmikuu","Maaliskuu","Huhtikuu","Toukokuu","Kesäkuu","Heinäkuu","Elokuu","Syyskuu","Lokakuu","Marraskuu","Joulukuu"],
			monthNamesShort: ["Tammi","Helmi","Maalis","Huhti","Touko","Kesä","Heinä","Elo","Syys","Loka","Marras","Joulu"],
			dayNamesShort: ["Su","Ma","Ti","Ke","To","Pe","La"],
			dayNames: ["Sunnuntai","Maanantai","Tiistai","Keskiviikko","Torstai","Perjantai","Lauantai"],
			dayNamesMin: ["Su","Ma","Ti","Ke","To","Pe","La"],
			format: 'd.m.'
		},
		'sv': {
			monthNames: ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December'],
			monthNamesShort: ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec'],
			dayNames: ['Söndag','Måndag','Tisdag','Onsdag','Torsdag','Fredag','Lördag'],
			dayNamesShort: ['Sön','Mån','Tis','Ons','Tor','Fre','Lör'],
			dayNamesMin: ['Sö','Må','Ti','On','To','Fr','Lö'],
			format: "d MM"
		},
		'en': {
			monthNames: ['January','February','March','April','May','June','July','August','September','October','November','December'],
			monthNamesShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
			dayNames: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
			dayNamesShort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
			dayNamesMin: ['Su','Mo','Tu','We','Th','Fr','Sa'],
			format: "d MM"
		}
	},

	initialize: function(args) {
		if ($.isArray(args)) {
			for (var i = 0, n = args.length; i < n; ++i) {
				this.createInstance(args[i]);
			}
		} else {
			this.createInstance(args);
		}

		this.isInitialized = true;
	},

	createInstance: function(options) {
		if (!options.hasOwnProperty('fieldNames')) {
			if (options.hasOwnProperty('fieldName'))  {
				if ($.isArray(options.fieldName)) {
					options.fieldNames = options.fieldName;
				} else {
					options.fieldNames = [options.fieldName];
				}
				delete options.fieldName;
			} else {
				options.fieldNames = [];
			}
		}

		if (options.hasOwnProperty('fieldNamePrefix')) {
			options.fieldNamePrefixes = [options.fieldNamePrefix];
		}
		if (options.hasOwnProperty('fieldNameSuffix')) {
			options.fieldNameSuffixes = [options.fieldNameSuffix];
		}

		var hasFieldPrefix = false;
		var hasFieldSuffix = false;
		var i = 0;
		if (options.hasOwnProperty('fieldNamePrefixes') || options.hasOwnProperty('fieldNameSuffixes')) {
			for (var fieldName in FieldIDs) {
				hasFieldPrefix = false;
				hasFieldSuffix = false;
				if (options.hasOwnProperty('fieldNamePrefixes')) {
					for (i = 0, n = options.fieldNamePrefixes.length; i < n; ++i) {
						if (fieldName.indexOf(options.fieldNamePrefixes[i]) === 0) {
							hasFieldPrefix = true;
							break;
						}
					}
				}
				if (options.hasOwnProperty('fieldNameSuffixes')) {
					for (i = 0, n = options.fieldNameSuffixes.length; i < n; ++i) {
						if (fieldName.indexOf(options.fieldNameSuffixes[i]) > -1 && fieldName.indexOf(options.fieldNameSuffixes[i]) === (fieldName.length - options.fieldNameSuffixes[i].length)) {
							hasFieldSuffix = true;
							break;
						}
					}
				}
				if ((options.hasOwnProperty('fieldNamePrefixes') && options.hasOwnProperty('fieldNameSuffixes') && hasFieldPrefix && hasFieldSuffix) ||
					(options.hasOwnProperty('fieldNamePrefixes') && !options.hasOwnProperty('fieldNameSuffixes') && hasFieldPrefix) ||
					(!options.hasOwnProperty('fieldNamePrefixes') && options.hasOwnProperty('fieldNameSuffixes') && hasFieldSuffix)
				) {
					options.fieldNames.push(fieldName);
				}
			}
		}
		
		// Legacy start
		if (options.hasOwnProperty('altFieldName') && FieldIDs.hasOwnProperty(options.altFieldName)) {
			$('head').append('<style type="text/css">#DIV_' + FieldIDs[options.altFieldName] + ', #FIELD_' + FieldIDs[options.altFieldName] + ' { display: none !important; }</style>');
			$('#DIV_' + FieldIDs[options.altFieldName]).hide();
		}
		if (options.hasOwnProperty('booleanFieldName') && FieldIDs.hasOwnProperty(options.booleanFieldName)) {
			$('head').append('<style type="text/css">#DIV_' + FieldIDs[options.booleanFieldName] + ', #FIELD_' + FieldIDs[options.booleanFieldName] + ' { display: none !important; }</style>');
			$('#DIV_' + FieldIDs[options.booleanFieldName]).hide();
		}
		// Legacy end
		
		var instance = {
			fieldNames: options.fieldNames || this.defaults.fieldNames,
			fields: this.defaults.fields,
			placeholderValue: options.placeholderValue || this.defaults.placeholderValue,

			language: options.language || this.defaults.language,
			format: options.format || this.regional[options.language || this.defaults.language].format,
			localize: (options.hasOwnProperty('localize')) ? options.localize : this.defaults.localize,

			startDate: options.startDate || this.defaults.startDate,
			endDate: options.endDate || this.defaults.endDate,

			showYear: (options.hasOwnProperty('showYear')) ? options.showYear : this.defaults.showYear,
			showClearButton: (options.hasOwnProperty('showClearButton')) ? options.showClearButton : this.defaults.showClearButton
		};
		
		if (instance.showYear) {
			if (instance.format.match(/[a-zA-Z0-9]$/) !== null) {
				instance.format += ' ';
			}
			instance.format += 'yy';
		}
		
		var instanceID = this.instances.length;
		instance.id = instanceID;
		
		var $input, $originalInput;
		for (var i = 0, n = instance.fieldNames.length; i < n; ++i) {
			$originalInput = $('#FIELD_' + FieldIDs[instance.fieldNames[i]]);
			$input = $('<input></input>');
			$input.attr('type', 'text');
			$input.attr('id', 'DMPDatepickerField_' + instanceID + '_' + FieldIDs[instance.fieldNames[i]]);
			$input.css('width', $originalInput.width() + 'px');
			
			if (instance.localize && $originalInput.val() != instance.placeholderValue) {
				$input.val(this.fromLocalizedDate($originalInput.val(), instance.language));
			} else {
				$input.val($originalInput.val());
			}
			
			$input.insertBefore($originalInput);
			$('head').append('<style type="text/css">#FIELD_' + FieldIDs[instance.fieldNames[i]] + ' { display: none !important; }</style>');
			$originalInput.hide();
			
			$input.on('change', function(e) {
				var ids = this.id.split('_');
				var instanceID = ids[1];
				var fieldID = ids[2];
				$('#FIELD_' + fieldID).val($(this).val());
				$('#FIELD_' + fieldID).change();
			});

			if (instance.showClearButton) {
				var clearButtonID = 'DMPDatepickerClearButton_' + instanceID + '_' + FieldIDs[instance.fieldNames[i]];
				$('#DIV_' + FieldIDs[instance.fieldNames[i]]).append('<div class="block" style="float: left; clear: both;">' + this.getButtonHTML(clearButtonID, 'Clear') + '</div><p class="endOfButtons"></p>');
				$('#' + clearButtonID).on('click', function(e) {
					var ids = e.target.id.split('_');
					var instanceID = ids[1];
					var fieldID = ids[2];
					$('#DMPDatepickerField_' + instanceID + '_' + fieldID)
						.val(DMPDatepicker.instances[instanceID].placeholderValue)
						.change();
					return false;
				});
			}
			
			$input.datepicker({
				showMonthAfterYear: false,
				showAnim: 'fadeIn',
				dateFormat: instance.format,
				firstDay: '1',
				minDate: instance.startDate,
				maxDate: instance.endDate,
				monthNames: DMPDatepicker.regional[instance.language].monthNames,
				monthNamesShort: DMPDatepicker.regional[instance.language].monthNamesShort,
				dayNames: DMPDatepicker.regional[instance.language].dayNames,
				dayNamesShort: DMPDatepicker.regional[instance.language].dayNamesShort,
				dayNamesMin: DMPDatepicker.regional[instance.language].dayNamesMin,
				onSelect: function(dateText, inst) {
					// Apply our extra localization to the date as soon as it's selected
					var instanceID = this.id.split('_')[1];
					var fieldID = this.id.split('_')[2];
					if (DMPDatepicker.instances[instanceID].localize) {
						var localizedDate = DMPDatepicker.toLocalizedDate($(this).val(), DMPDatepicker.instances[instanceID].language);
						$(this).val(localizedDate).change();
					} else {
						$(this).change();
					}
				},
				onClose: function(dateText, inst) {
					var instanceID = this.id.split('_')[1];
					var fieldID = this.id.split('_')[2];
					$(DMPDatepicker.instances[instanceID].fieldNames[fieldID]).focus();
				}
			});

			if (instance.localize && $input.val() != instance.placeholderValue) {
				$input.val(this.toLocalizedDate($input.val(), instance.language));
			}

			// Should be removed once we're sure nothing relies on this
			instance.$input = $input;

			instance.fields[FieldIDs[instance.fieldNames[i]]] = $input;

			this.fieldNameToInstanceID[instance.fieldNames[i]] = instance.id;
		}

		this.instances.push(instance);
	},
	
	toLocalizedDate: function(value, language) {
		switch (language) {
			case 'en':
				// In English, add an ordinal suffix (st/nd/rd/th) to the numeric day
				value = value.replace(/\b([1-9]|[0-2][0-9]|3[0-1])\b/, function(match) {
					var d = String(match);
					d = d.substr(-(Math.min(d.length, 2))) > 3 && d.substr(-(Math.min(d.length, 2))) < 21 ? "th" : ["th", "st", "nd", "rd", "th"][Math.min(Number(d)%10, 4)];
					return String(match) + d;
				});
				break;
			case 'fi':
				// In Finnish, add 'ta' to the literal month
				value = value.replace(/kuu/gi, 'kuuta').toLowerCase();
				break;
			case 'sv':
				// In Swedish, make the literal month lowercase
				value = value.toLowerCase();
				break;
			default:
				break;
		}
		return value;
	},

	fromLocalizedDate: function(value, language) {
		switch (language) {
			case 'en':
				value = value.replace(/\b([1-9]|[0-2][0-9]|3[0-1])(st|nd|rd|th)\b/, '$1');
			case 'fi':
				for (var i = 0, n = this.regional['fi'].monthNames.length; i < n; ++i) {
					value = value.replace(new RegExp(this.regional['fi'].monthNames[i].toLowerCase(), 'g'), this.regional['fi'].monthNames[i]);
				}
				value = value.replace(/kuuta/g, 'kuu');
				break;
			case 'sv':
				for (var i = 0, n = this.regional['sv'].monthNames.length; i < n; ++i) {
					value = value.replace(new RegExp(this.regional['sv'].monthNames[i].toLowerCase(), 'g'), this.regional['sv'].monthNames[i]);
				}
				break;
			default:
				break;
		}
		return value;
	},

	setDate: function(fieldName, date) {
		if (!this.isInitialized) {
			return false;
		}
		if (!this.fieldNameToInstanceID.hasOwnProperty(fieldName)) {
			return false;
		}
		var instanceID = this.fieldNameToInstanceID[fieldName];
		if (DMPDatepicker.instances.length < instanceID) {
			return false;
		}
		var instance = DMPDatepicker.instances[instanceID];
		var fieldID = parseInt(FieldIDs[fieldName], 10);
		if (instance.fields.length < fieldID) {
			return false;
		}
		instance.fields[fieldID].datepicker('setDate', date);
		$('#FIELD_' + fieldID).val($(instance.fields[fieldID]).val());
	},

	getButtonHTML: function(buttonID, caption, buttonClass) {
		return "<div class='siteButton'><div class='siteButton-t'><div class='siteButton-b'><div class='siteButton-l'><div class='siteButton-r'><div class='siteButton-tl'><div class='siteButton-tr'><div class='siteButton-bl'><div class='siteButton-br'><div class='siteButton-inner'><a class='siteButton " + (buttonClass || '') + "' id='" + buttonID + "'>" + caption + "</a></div></div></div></div></div></div></div></div></div></div>";
	}
}