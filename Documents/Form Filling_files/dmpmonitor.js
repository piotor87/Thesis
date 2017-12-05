var DMPMonitor = {
	debug: false,
	legacyMode: false,
	messages: {},
	inlineMessages: {},
	errorFieldNames: {},
	handlers: {},

	initialize: function(options) {
		if (options) {
			if (options.hasOwnProperty('debug')) {
				this.debug = options.debug;
			} else {
				this.debug = false;
			}

			if (options.hasOwnProperty('handlers')) {
				this.handlers = options.handlers;
				this.legacyMode = false;
			}

			// Legacy start
			if (options.hasOwnProperty('messages')) {
				this.messages = options.messages;
				this.legacyMode = true;
				if (!options.hasOwnProperty('inlineMessages')) {
					this.inlineMessages = options.messages;
				}
			}
			if (options.hasOwnProperty('inlineMessages')) {
				this.inlineMessages = options.inlineMessages;
				this.legacyMode = true;
			}
			if (options.hasOwnProperty('errorFieldNames')) {
				this.errorFieldNames = options.errorFieldNames;
				this.legacyMode = true;
			}
			// Legacy end
		}

		// Legacy start
		if (this.legacyMode) {
			$('head').append('<style type="text/css">.DMPMonitorFieldErrorDiv { display: block !important; }</style>');
			$.each(this.errorFieldNames, function(key, value) {
				if (FieldIDs.hasOwnProperty(value)) {
					$('#DIV_' + FieldIDs[value]).addClass('DMPMonitorFieldErrorDiv');
					$('#FIELD_' + FieldIDs[value]).hide();
					$('#FIELD_' + FieldIDs[value]).val('1');
					$('#VALID_VAR_' + FieldIDs[value]).addClass('DMPMonitorFieldError').hide();
				}
			});
		}
		// Legacy end
	},

	update: function() {
		// Legacy start
		if (this.legacyMode) {
			$('.DMPMonitorBlock').remove();
			$('.DMPMonitorFieldError').hide();
			$.each(this.errorFieldNames, function(key, value) {
				if (FieldIDs.hasOwnProperty(value)) {
					$('#FIELD_' + FieldIDs[value]).val('1');
				}
			});
		}
		// Legacy end

		if (this.legacyMode) {
			var str, obj, callback, finalMessage, finalInlineMessage, elementErrorHTML;
		}
		var str;
		var i = PFSF_AjaxMessages.length;
		if (i <= 0) {
			return false;
		}
		while (i--) {
			str = PFSF_AjaxMessages[i];
			if (this.debug) {
				console.log('PFSF_AjaxMessages[' + i + ']: ' + str);
			}
			obj = $.parseJSON(str);
			if (!obj.hasOwnProperty('dmp')) {
				continue;
			}
			if (this.debug) {
				console.log('Found message:' + str);
			}
			if (obj.hasOwnProperty('message') && obj.hasOwnProperty('data')) {
				if (this.hasOwnProperty('handlers') && this.handlers.hasOwnProperty(obj.message)) {
					this.handlers[obj.message].call(this, obj.data);
				}
			// Legacy start
			} else if (obj.messageType == 'CUSTOM') {
				if (!obj.data.hasOwnProperty('callback')) {
					continue;
				}
				callback = obj.data.callback;
				if ($.isFunction(window[callback])) {
					window[callback](obj.data);
				} else {
					console.log("DMPMonitor: callback function '" + obj.data.callback + "' not found");
				}
			} else {
				if (!obj.data.hasOwnProperty('message')) {
					continue;
				}

				finalMessage = this.messages[obj.data.message];
				finalInlineMessage = this.inlineMessages[obj.data.message];
				$.each(obj.data, function(key, value) {
					finalMessage = finalMessage.replace(new RegExp("%" + key + "%", "g"), value).replace(/[\r\n]/, '<br>');
					finalInlineMessage = finalInlineMessage.replace(new RegExp("%" + key + "%", "g"), value).replace(/[\r\n]/, '<br>');
				});

				if (obj.data.hasOwnProperty('elementName') && this.errorFieldNames.hasOwnProperty(obj.data.elementName) && FieldIDs.hasOwnProperty(this.errorFieldNames[obj.data.elementName])) {
					var errorFieldID = FieldIDs[this.errorFieldNames[obj.data.elementName]];
					$('#FIELD_' + errorFieldID).hide();
					$('#VALID_VAR_' + errorFieldID).addClass('DMPMonitorFieldError');
					$('#VALID_VAR_' + errorFieldID).html(finalInlineMessage);
					$('#VALID_VAR_' + errorFieldID).show();
					PFSF_SetControlValue(PFSF_Find('FIELD_' + errorFieldID), '');
				}

				DMPMonitor.showBox(obj.messageType, finalMessage);
			}
			// Legacy end
			PFSF_AjaxMessages.splice(i, 1);
		}
	},

	// Legacy start	
	showBox: function(messageType, message) {
		var startHTML;
		switch (messageType) {
			case 'INFO':
				startHTML = '<div class="block DMPMonitorBlock" style="margin-bottom: 10px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td class="warningAreaInlineInfo"><table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td class="warningIconInfo"/><td width="100%"><div class="warningAreaMessageInfo">';
				break;
			case 'ERROR':
			case 'WARNING':
				startHTML = '<div class="block DMPMonitorBlock" style="margin-bottom: 10px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td class="warningAreaInlineWarning"><table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td class="warningIconWarning"/><td width="100%"><div class="warningAreaMessageWarning">';
				break;
			default:
				break;
		}
		var endHTML = '</div></td></tr></table></td></tr></table></div>';
		$(startHTML + message + endHTML).prependTo('td[class="pageContent"] td[class="basic"][width="100%"]');
	}
	// Legacy end
};