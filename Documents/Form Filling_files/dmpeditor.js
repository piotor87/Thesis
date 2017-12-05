var DMPEditor = {
	debug: false,
	previewUpdateQueue: [],
	previewUpdateTimeout: null,
	isInitialized: false,
	instances: [],
	instanceIDsByHTMLFieldName: {}, // lookup table for lazyInitialize()
	initializedHTMLFieldNames: [],

	tinymceDefaults: {
		mode: 'exact',
		theme: 'advanced',
		theme_advanced_path: false,
		theme_advanced_toolbar_location: 'bottom',
		theme_advanced_toolbar_align: 'left',
		theme_advanced_buttons1: 'undo,redo',
		theme_advanced_buttons2: '',
		theme_advanced_buttons3: '',
		theme_advanced_buttons4: '',
		theme_advanced_blockformats: 'p',
		theme_advanced_text_colors: '',
		theme_advanced_more_colors: false,
		theme_advanced_show_current_color: true,
		forced_root_block: 'p',
		force_br_newlines: false,
		force_p_newlines: false,
		force_hex_style_colors: true,
		doctype: '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">',
		formats: {
			removeformat: [
				{selector: 'b,strong,em,i,font,u,strike,span,sub,sup,ul,ol,img', remove: 'all', split: true, expand: true, block_expand: true, deep: true},
				{selector: '*', attributes: ['style'], split: true, expand: false, deep: true}
			]
		},
		plugins: 'paste,lists',
		paste_use_dialog: false,
		paste_auto_cleanup_on_paste: true,
		paste_convert_headers_to_strong: false,
		paste_block_drop: true,
		paste_retain_style_properties: 'none',
		paste_strip_class_attributes: 'all',
		paste_remove_spans: true,
		paste_remove_styles: true,
		paste_remove_styles_if_webkit: true,
		paste_convert_middot_lists: false,
		paste_text_linebreaktype: 'p',
		paste_text_sticky : true,
		valid_children: '+body[style,p,ul,ol],ul[li],ol[li],p[span|b|i|strong|em|sub|sup|br|img],li[span|b|i|strong|em|sub|sup|br|img],-sup[sup],-sup[sub],-sub[sup],-sub[sub]',
		valid_elements: '@[class|style|data-*],-style,#span,-strong/b,-em/i,-sub,-sup,br,img',
		// valid_elements: '@[data-*],#p[class|style],-ul[class|style],-ol[class|style],#li[class|style],#span[style],-strong/b,-em/i,-sub,-sup,br,img[class],-style',

		verify_html: true,
		verify_css_classes: true,
		entity_encoding: 'raw',
		object_resizing: false,

		setup: function(ed) {
			ed.onInit.add(function(ed) {
				var ids = ed.id.split('_');
				var instanceID = ids[1];
				var fieldID = ids[2];
				var options = DMPEditor.instances[instanceID].options;

				ed.pasteAsPlainText = true;

				ed.dom.setAttrib(ed.dom.select('body'), 'data-dmpeditorid', ed.id);

				/*
				if (ed.controlManager.get('customstyleselect')) {
					ed.controlManager.get('customstyleselect').onChange.add(function(formatName, selection) {
						tinyMCE.execCommand('RemoveFormat', false);
					});
				}
				*/

				if (options.popup) {
					// If the editor is inside a popup, set focus to the editor on init
					ed.focus();
				} else {
					// If the editor is inline, we want to update it when it loses focus,
					// so we attach our handler to the blur event
					// On some browsers the document is blurred, and on others the window is blurred,
					// so we catch both
					tinymce.dom.Event.add(ed.getDoc(), 'blur', function(e) {
						var ids = [];
						if ('name' in this && this.name) {
							ids = this.name.split('_');
						} else if ('id' in this && this.id) {
							ids = this.id.split('_');
						} else if (this.body && this.body.getAttribute('data-dmpeditorid')) {
							ids = this.body.getAttribute('data-dmpeditorid').split('_');
						}
						if (ids.length > 0) {
							var instanceID = ids[1];
							var fieldID = ids[2];
							DMPEditor.update(instanceID, fieldID);
						}
					});
					tinymce.dom.Event.add(ed.getWin(), 'blur', function(e) {
						var ids = [];
						if ('name' in this && this.name) {
							ids = this.name.split('_');
						} else if ('id' in this && this.id) {
							ids = this.id.split('_');
						} else if (this.document && this.document.body && this.document.body.getAttribute('data-dmpeditorid')) {
							ids = this.document.body.getAttribute('data-dmpeditorid').split('_');
						}
						if (ids.length > 0) {
							var instanceID = ids[1];
							var fieldID = ids[2];
							DMPEditor.update(instanceID, fieldID);
						}
					});
				}
			});

			ed.onNodeChange.add(function(ed, controlManager, node, isCollapsed, o) {
				var ids = ed.id.split('_');
				var instanceID = ids[1];
				var fieldID = ids[2];
				var options = DMPEditor.instances[instanceID].options;

				// Find the class of the element under the caret
				var nearestBlockElement = ed.selection.getNode();
				var tag = nearestBlockElement.nodeName.toLowerCase();
				if (tag != 'li' && tag != 'p') {
					nearestBlockElement = ed.dom.getParent(nearestBlockElement, 'li,p');
					if (nearestBlockElement) {
						tag = nearestBlockElement.nodeName.toLowerCase();
					}
				}
				
				if (nearestBlockElement) {
					var klass = ed.dom.getAttrib(nearestBlockElement, 'class');
					if (tag == 'li') {
						if (!klass) {
							klass = ed.dom.getAttrib(ed.dom.getParent(nearestBlockElement, 'ul,ol'), 'class');
						}
						// We can't allow the user to change the paragraph style of a list element
						if (ed.controlManager.get('styleselect')) {
							ed.controlManager.get('styleselect').setDisabled(true);
						}
					} else {
						if (ed.controlManager.get('styleselect')) {
							ed.controlManager.get('styleselect').setDisabled(false);
						}
					}
					
					// Enable/disable bold/italic/underline based on the settings of the selected paragraph style
					var characterStyles = {'bold': true, 'italic': true, 'underline': true};
					if (klass) {
						var re = new RegExp('(?:\\s|^)' + klass + '(?:\\s|$)', 'gim');
						for (var i = 0, n = options.paragraphStyles.length; i < n; ++i) {
							if (options.paragraphStyles[i].hasOwnProperty('name') && re.test(options.paragraphStyles[i].name)) {
								$.each(characterStyles, function(characterStyle, isEnabled) {
									if (options.paragraphStyles[i].hasOwnProperty(characterStyle) && options.paragraphStyles[i][characterStyle]) {
										characterStyles[characterStyle] = true;
									} else {
										characterStyles[characterStyle] = false;
									}
								});
								break;
							}
						}
					}
					var command = '';
					$.each(characterStyles, function(characterStyle, isEnabled) {
						if (ed.controlManager.get(characterStyle)) {
							command = characterStyle.substr(0, 1).toUpperCase() + characterStyle.substr(1);
							if (!isEnabled && ed.queryCommandState(command) === true) {
								ed.execCommand(command);
							}
							ed.controlManager.get(characterStyle).setDisabled(!isEnabled);
						}
					});
				}
				
				ed.save();
			});

			ed.onExecCommand.add(function(ed, cmd, ui, val) {
				var ids = ed.id.split('_');
				var instanceID = ids[1];
				var fieldID = ids[2];
				var options = DMPEditor.instances[instanceID].options;

				if (cmd && cmd.indexOf('mce') !== 0) {
					ed.nodeChanged();
				}
			});

			ed.onPreProcess.add(function(ed, o) {
				var ids = ed.id.split('_');
				var instanceID = ids[1];
				var fieldID = ids[2];
				var options = DMPEditor.instances[instanceID].options;

				// If we have a size and a position for superscript/subscript, add them to the tag
				if (options.hasOwnProperty('superscript') && options.superscript && options.superscript.hasOwnProperty('size') && options.superscript.hasOwnProperty('position')) {
					ed.dom.setAttrib(ed.dom.select('sup'), 'data-dmpeditorscriptsize', options.superscript.size);
					ed.dom.setAttrib(ed.dom.select('sup'), 'data-dmpeditorscriptposition', options.superscript.position);
				}
				if (options.hasOwnProperty('subscript') && options.subscript && options.subscript.hasOwnProperty('size') && options.subscript.hasOwnProperty('position')) {
					ed.dom.setAttrib(ed.dom.select('sub'), 'data-dmpeditorscriptsize', options.subscript.size);
					ed.dom.setAttrib(ed.dom.select('sub'), 'data-dmpeditorscriptposition', options.subscript.position);
				}

				// If there is a color change, add the name of the color as a class
				if (options.hasOwnProperty('textColors')) {
					$.each(options._rgbToColorName, function(rgb, colorName) {
						ed.dom.setAttrib(ed.dom.select('*[data-dmpeditorcolorrgb="' + rgb + '"]'), 'data-dmpeditorcolorname', colorName);
						// For some reason the data-dmpeditorcolorname property sticks to the element even after data-dmpeditorcolorrgb has been removed...
						ed.dom.setAttrib(ed.dom.select('*:not([data-dmpeditorcolorrgb])[data-dmpeditorcolorname]'), 'data-dmpeditorcolorname', '');
					});
				}

				// If there is a paragraph style defined for the bullet list, add it to the tag
				if (options.hasOwnProperty('bulletList')) {
					if (options.bulletList.hasOwnProperty('paragraphStyle')) {
						ed.dom.setAttrib(ed.dom.select('ul li'), 'class', options.bulletList.paragraphStyle.name);
					}
					if (options.bulletList.hasOwnProperty('bulletSize')) {
						ed.dom.setAttrib(ed.dom.select('ul li'), 'data-dmpeditorfontsize', options.bulletList.bulletSize);
					}
					if (options.bulletList.hasOwnProperty('bulletBaselineShift')) {
						ed.dom.setAttrib(ed.dom.select('ul li'), 'data-dmpeditorbaselineshift', options.bulletList.bulletBaselineShift);
						// ed.dom.setStyle(ed.dom.select('li'), 'line-height', Math.abs(options.bulletList.bulletBaselineShift * 1) + 'em');
					}
					if (options.bulletList.hasOwnProperty('bulletColor')) {
						ed.dom.setAttrib(ed.dom.select('ul li'), 'data-dmpeditorcolorname', options.bulletList.bulletColor);
					}
				}

				// If there is a paragraph style defined for the ordered list, add it to the tag
				if (options.hasOwnProperty('orderedList')) {
					if (options.orderedList.hasOwnProperty('paragraphStyle')) {
						ed.dom.setAttrib(ed.dom.select('ol li'), 'class', options.orderedList.paragraphStyle.name);
					}
				}

				// Hotfix 2014-05-15: Remove Mso* styles
				ed.dom.removeClass(ed.dom.select('p.MsoNormal'), 'MsoNormal');

				// Hotfix 2016-09-28: Remove DMPEditorTab style on paragraphs (only allowed on img tags)
				ed.dom.removeClass(ed.dom.select('p.DMPEditorTab'), 'DMPEditorTab');

				// Make sure all <p> elements have a class
				ed.dom.addClass(ed.dom.select('p:not([class])'), options.paragraphStyles[0].name);

				if (options.hasOwnProperty('paragraphStyles')) {
					// IE likes to leave the bullet list class on <p> elements after we remove <li> elements
					// -> make sure the class on <p> elements is a paragraph style, not a bullet list style
					if (options.hasOwnProperty('bulletList') && options.bulletList.hasOwnProperty('paragraphStyle')) {
						ed.dom.addClass(ed.dom.select('p.' + options.bulletList.paragraphStyle.name), options.paragraphStyles[0].name);
						ed.dom.removeClass(ed.dom.select('p.' + options.bulletList.paragraphStyle.name), options.bulletList.paragraphStyle.name);
					}
					if (options.hasOwnProperty('orderedList') && options.orderedList.hasOwnProperty('paragraphStyle')) {
						ed.dom.addClass(ed.dom.select('p.' + options.orderedList.paragraphStyle.name), options.paragraphStyles[0].name);
						ed.dom.removeClass(ed.dom.select('p.' + options.orderedList.paragraphStyle.name), options.orderedList.paragraphStyle.name);
					}
				}
				
				if (options.hasOwnProperty('paragraphStyles') || (options.hasOwnProperty('bulletList') && options.bulletList.hasOwnProperty('paragraphStyle')) || (options.hasOwnProperty('orderedList') && options.orderedList.hasOwnProperty('paragraphStyle'))) {
					var styles = [];
					if (options.hasOwnProperty('paragraphStyles')) {
						styles = styles.concat(options.paragraphStyles);
					}
					if (options.hasOwnProperty('bulletList') && options.bulletList.hasOwnProperty('paragraphStyle')) {
						styles = styles.concat(options.bulletList.paragraphStyle);
					}
					if (options.hasOwnProperty('orderedList') && options.orderedList.hasOwnProperty('paragraphStyle')) {
						styles = styles.concat(options.orderedList.paragraphStyle);
					}

					// If we have a font name for bold/italic/underline, add it to the tag
					$.each(styles, function(i, paragraphStyle) {
						if (paragraphStyle.hasOwnProperty('bold') && typeof paragraphStyle.bold == 'object' && paragraphStyle.bold.hasOwnProperty('font')) {
							ed.dom.setAttrib(ed.dom.select('.' + paragraphStyle.name + ' b'), 'data-dmpeditorfontname', paragraphStyle.bold.font);
							ed.dom.setAttrib(ed.dom.select('.' + paragraphStyle.name + ' strong'), 'data-dmpeditorfontname', paragraphStyle.bold.font);
							if (paragraphStyle.bold.hasOwnProperty('bold') && paragraphStyle.bold.bold == true) {
								ed.dom.setAttrib(ed.dom.select('.' + paragraphStyle.name + ' b'), 'data-dmpeditorfontbold', 'true');
								ed.dom.setAttrib(ed.dom.select('.' + paragraphStyle.name + ' strong'), 'data-dmpeditorfontbold', 'true');
							} else {
								ed.dom.setAttrib(ed.dom.select('.' + paragraphStyle.name + ' b'), 'data-dmpeditorfontbold', 'false');
								ed.dom.setAttrib(ed.dom.select('.' + paragraphStyle.name + ' strong'), 'data-dmpeditorfontbold', 'false');
							}
						}
						if (paragraphStyle.hasOwnProperty('italic') && typeof paragraphStyle.italic == 'object' && paragraphStyle.italic.hasOwnProperty('font')) {
							ed.dom.setAttrib(ed.dom.select('.' + paragraphStyle.name + ' i'), 'data-dmpeditorfontname', paragraphStyle.italic.font);
							ed.dom.setAttrib(ed.dom.select('.' + paragraphStyle.name + ' em'), 'data-dmpeditorfontname', paragraphStyle.italic.font);
							if (paragraphStyle.italic.hasOwnProperty('italic') && paragraphStyle.italic.italic == true) {
								ed.dom.setAttrib(ed.dom.select('.' + paragraphStyle.name + ' i'), 'data-dmpeditorfontitalic', 'true');
								ed.dom.setAttrib(ed.dom.select('.' + paragraphStyle.name + ' em'), 'data-dmpeditorfontitalic', 'true');
							} else {
								ed.dom.setAttrib(ed.dom.select('.' + paragraphStyle.name + ' i'), 'data-dmpeditorfontitalic', 'false');
								ed.dom.setAttrib(ed.dom.select('.' + paragraphStyle.name + ' em'), 'data-dmpeditorfontitalic', 'false');
							}
						}
						if (paragraphStyle.hasOwnProperty('underline') && typeof paragraphStyle.underline == 'object' && paragraphStyle.underline.hasOwnProperty('font')) {
							ed.dom.setAttrib(ed.dom.select('.' + paragraphStyle.name + ' span[style*="underline"]'), 'data-dmpeditorfontname', paragraphStyle.underline.font);
							if (paragraphStyle.underline.hasOwnProperty('underline') && paragraphStyle.underline.underline == true) {
								ed.dom.setAttrib(ed.dom.select('.' + paragraphStyle.name + ' span[style*="underline"]'), 'data-dmpeditorfontunderline', 'true');
							} else {
								ed.dom.setAttrib(ed.dom.select('.' + paragraphStyle.name + ' span[style*="underline"]'), 'data-dmpeditorfontunderline', 'false');
							}
						}

						if (paragraphStyle.hasOwnProperty('boldItalic') && typeof paragraphStyle.boldItalic == 'object' && paragraphStyle.boldItalic.hasOwnProperty('font')) {
							ed.dom.setAttrib(ed.dom.select('.' + paragraphStyle.name + ' i b'), 'data-dmpeditorfontname', paragraphStyle.boldItalic.font);
							ed.dom.setAttrib(ed.dom.select('.' + paragraphStyle.name + ' em b'), 'data-dmpeditorfontname', paragraphStyle.boldItalic.font);
							ed.dom.setAttrib(ed.dom.select('.' + paragraphStyle.name + ' i strong'), 'data-dmpeditorfontname', paragraphStyle.boldItalic.font);
							ed.dom.setAttrib(ed.dom.select('.' + paragraphStyle.name + ' em strong'), 'data-dmpeditorfontname', paragraphStyle.boldItalic.font);
							ed.dom.setAttrib(ed.dom.select('.' + paragraphStyle.name + ' b i'), 'data-dmpeditorfontname', paragraphStyle.boldItalic.font);
							ed.dom.setAttrib(ed.dom.select('.' + paragraphStyle.name + ' b em'), 'data-dmpeditorfontname', paragraphStyle.boldItalic.font);
							ed.dom.setAttrib(ed.dom.select('.' + paragraphStyle.name + ' strong i'), 'data-dmpeditorfontname', paragraphStyle.boldItalic.font);
							ed.dom.setAttrib(ed.dom.select('.' + paragraphStyle.name + ' strong em'), 'data-dmpeditorfontname', paragraphStyle.boldItalic.font);
						}
					});
				}

				if (options.hasOwnProperty('autoHide')) {
					ed.dom.setAttrib(ed.dom.select('p,li'), 'data-dmpeditorautohide', options.autoHide);
				}

			});

			ed.onPostProcess.add(function(ed, o) {
				var ids = ed.id.split('_');
				var instanceID = ids[1];
				var fieldID = ids[2];
				var options = DMPEditor.instances[instanceID].options;

				// Remove comments
				o.content = o.content.replace(/<(!--)([\s\S]*)(--)>/gi, '');

				// Remove empty paragraphs
				o.content = o.content.replace(/<p[^>]*><\/p>/gim, '');

				// Remove all divs
				o.content = o.content.replace(/<div[^>]*>/gim, '');
				o.content = o.content.replace(/<\/div>/gim, '');
			});
			
			ed.onChange.add(function(ed) {
				var ids = ed.id.split('_');
				var instanceID = ids[1];
				var fieldID = ids[2];
				var options = DMPEditor.instances[instanceID].options;

				var majorVersion = parseInt($.browser.version.charAt(0), 10);

				if ($.browser.msie && majorVersion < 9) {
					var bookmark = ed.selection.getBookmark();
					ed.setContent(ed.getContent({cleanup: true}), {cleanup: true});
					ed.selection.moveToBookmark(bookmark);
				}
			});

			ed.onKeyDown.add(function(ed, e) {
				var ids = ed.id.split('_');
				var instanceID = ids[1];
				var fieldID = ids[2];

				if (DMPEditor.instances[instanceID].options.hasOwnProperty('tabStop') && DMPEditor.instances[instanceID].options.tabStop) {
					if (e.keyCode == 9) {
						e.preventDefault();

						ed.execCommand('mceInsertContent', false, (ed.plugins.visualchars && ed.plugins.visualchars.state) ? '<span data-mce-bogus="1" class="mceItemHidden mceItemNbsp"><img class="DMPEditorTab"/></span>' : '<img class="DMPEditorTab"/>');
					}
				}
			});
			
			ed.onKeyUp.add(function(ed, e) {
				var ids = ed.id.split('_');
				var instanceID = ids[1];
				var fieldID = ids[2];
				if (DMPEditor.instances[instanceID].options.hasOwnProperty('popup') && DMPEditor.instances[instanceID].options.popup) {
					if ($('#DMPEditorDialog_' + instanceID + '_' + fieldID).length > 0) { // popup
						if (e.keyCode == 27) { // ESC
							DMPEditor.update(instanceID, fieldID, true);
						}
					}
				}
			});
		}
	},
	
	update: function(instanceID, fieldID, closeDialog) {
		var instance = DMPEditor.instances[instanceID];
		var ed = DMPEditor.instances[instanceID].editors[fieldID];
		var options = DMPEditor.instances[instanceID].options;
		
		/*
		if (ed.hasOwnProperty('selection') && ed.selection) {
			var bookmark = ed.selection.getBookmark();
			ed.setContent(ed.getContent({cleanup: true}), {cleanup: true});
			ed.selection.moveToBookmark(bookmark);
		}
		*/

		// Copy the HTML to the form filling field
		$('#FIELD_' + fieldID).val(ed.getContent());

		var fieldName = '', fieldIndex = null;
		$.each(FieldIDs, function(name, id) {
			if ((id + '') == fieldID) {
				fieldName = name;
				return false;
			}
		});
		if (fieldName) {
			for (var i = 0, n = instance.options.fieldNames.length; i < n; ++i) {
				if (instance.options.fieldNames[i].html == fieldName) {
					fieldIndex = i;
					break;
				}
			}
			if (fieldIndex !== null && instance.options.fieldNames[fieldIndex].hasOwnProperty('text')) {
				var textContent = '';
				if (!$.browser.msie || ($.browser.msie && parseInt($.browser.version, 10) == 9)) {
					var root = ed.dom.getRoot();
					ed.selection.select(root);
					textContent = ed.selection.getContent({format: 'text'});
					ed.selection.collapse();
				} else {
					var content = ed.getContent();
					var div = document.createElement("div");
					div.innerHTML = content;
					textContent = div.textContent || div.innerText || "";
				}
				
				$('#FIELD_' + FieldIDs[instance.options.fieldNames[fieldIndex].text]).val(textContent);
			}
		}

		if (PFSF_xmlRequest === null) {
			PFSF_AjaxUpdateForm("", false);
		}
		
		if (typeof closeDialog !== 'undefined' && closeDialog) {
			$('#DMPEditorDialog_' + instanceID + '_' + fieldID + ' textarea.DMPEditorArea_' + instanceID).each(function(index) {
				tinyMCE.execCommand('mceRemoveControl', false, 'DMPEditorDialog_' + instanceID + '_' + fieldID);
			});
			$('#DMPEditorDialog_' + instanceID + '_' + fieldID).dialog('close');
		}
	},

	clear: function(instanceID, fieldID) {
		var message = DMPEditor.instances[instanceID].options.confirmClearText || 'Are you sure you want to clear the whole text area?';
		if (confirm(message)) {
			DMPEditor.instances[instanceID].editors[fieldID].setContent('<p> </p>');
		}
	},
	
	initialize: function(args) {
		if (typeof tinyMCE == 'undefined') {
			alert("DMPEditor: TinyMCE is not initialized!");
			return;
		}

		$('<style type="text/css">.mceStatusbar { height: 2px !important; } .mceStatusbar div { display: none !important; }</style>').appendTo('head');

		this.cacheBuster = (new Date).getTime();
		this.tinymceDefaults.content_css = '/js/dmpeditor_default.css' + '?' + this.cacheBuster;

		if ($.isArray(args)) {
			for (var i = 0, n = args.length; i < n; ++i) {
				this.createInstance(args[i]);
			}
		} else {
			this.createInstance(args);
		}
	},

	lazyInitialize: function(htmlFieldNames) {
		if (this.instances.length <= 0) {
			return;
		}
		if (typeof htmlFieldNames !== 'undefined' && $.isArray(htmlFieldNames) && htmlFieldNames.length > 0) {
			var instance;
			var allEditorsAreInitialized = true;
			var fieldID;
			for (var i = 0, n = htmlFieldNames.length; i < n; ++i) {
				fieldID = FieldIDs[htmlFieldNames[i]];
				instance = this.instances[this.instanceIDsByHTMLFieldName[htmlFieldNames[i]]];
				if (instance.isInitialized) {
					return;
				}
				if ($.inArray(htmlFieldNames[i], this.initializedHTMLFieldNames) < 0) {
					var fieldName = $.grep(instance.options.fieldNames, function(element) {
						if (element.html == htmlFieldNames[i]) {
							return true;
						}
					})[0];
					if (instance.options.hasOwnProperty('popup') && instance.options.popup === true) {
						this.initializePopupEditor(instance, fieldID, fieldName);
					} else {
						this.initializeInlineEditor(instance, fieldID, fieldName);
					}
				}
			}
		}
	},

	createInstance: function(options) {
		var instanceID = this.instances.length;
		var defaults = $.extend(true, {}, DMPEditor.tinymceDefaults);
		var instance = {
			id: instanceID,
			options: {},
			editors: {},
			/* tinymceOptions: $.extend(true, {}, DMPEditor.tinymceDefaults) */
			tinymceOptions: defaults,
			isInitialized: false
		};
		
		if (typeof options !== 'undefined') {
			if (options.hasOwnProperty('debug')) {
				instance.options.debug = options.debug;
			} else {
				instance.options.debug = false;
			}

			if (options.hasOwnProperty('exclusiveCharacterStyles') && $.isArray(options.exclusiveCharacterStyles) && options.exclusiveCharacterStyles) {
				// slice() makes a copy of the array
				instance.options.exclusiveCharacterStyles = options.exclusiveCharacterStyles.slice();
			}
			
			if (!options.hasOwnProperty('paragraphStyle') && !options.hasOwnProperty('paragraphStyles')) {
				options.paragraphStyles = [{name: 'PF_Para_Base', title: 'Normal'}];
			}

			if (options.hasOwnProperty('paragraphStyle')) {
				options.paragraphStyles = ($.isArray(options.paragraphStyle)) ? options.paragraphStyle : [options.paragraphStyle];
				delete options.paragraphStyle;
			}

			if (options.hasOwnProperty('justify')) {
				if (instance.tinymceOptions.theme_advanced_buttons1.indexOf('justify') == -1) {
					if (typeof options.justify == 'string') {
						instance.tinymceOptions.theme_advanced_buttons1 += ',|,justify' + options.justify;
					} else if (typeof options.justify == 'boolean' && options.justify == true) {
						instance.tinymceOptions.theme_advanced_buttons1 += ',|,justifyleft,justifycenter,justifyright,justifyfull';
					} else if ($.isArray(options.justify) && options.justify.length > 0) {
						for (var i = 0, n = options.justify.length; i < n; ++i) {
							instance.tinymceOptions.theme_advanced_buttons1 += ',justify' + options.justify[i];
						}
					}
				}
			}

			var hasBulletList = false;
			if (options.hasOwnProperty('bulletList') && ((typeof options.bulletList == 'boolean' && options.bulletList == true) || (typeof options.bulletList == 'object' && !$.isEmptyObject(options.bulletList)))) {
				hasBulletList = true;
			}
			var hasOrderedList = false;
			if (options.hasOwnProperty('orderedList') && ((typeof options.orderedList == 'boolean' && options.orderedList == true) || (typeof options.orderedList == 'object' && !$.isEmptyObject(options.orderedList)))) {
				hasOrderedList = true;
			}

			if (hasBulletList || hasOrderedList) {
				var validListElementsString = ',#li[';
				instance.tinymceOptions.theme_advanced_buttons1 += ',|';
				if (hasBulletList) {
					if (instance.tinymceOptions.theme_advanced_buttons1.indexOf('bullist') == -1) {
						instance.tinymceOptions.theme_advanced_buttons1 += ',bullist';
					}
					if (typeof options.bulletList == 'object') {
						if (options.bulletList.hasOwnProperty('paragraphStyle')) {
							if (typeof options.bulletList['paragraphStyle'] == 'object' && !$.isArray(options.bulletList['paragraphStyle']) && options.bulletList['paragraphStyle']) {
								if (!options.bulletList['paragraphStyle'].hasOwnProperty('name')) {
									alert('DMPEditor: Paragraph style is an object but has no name property');
									return;
								}
							} else if (typeof options.bulletList.paragraphStyle == 'string' && options.bulletList.paragraphStyle) {
								options.bulletList.paragraphStyle = {name: options.bulletList['paragraphStyle']};
							}
							options.paragraphStyles.push(options.bulletList.paragraphStyle);
							instance.tinymceOptions.valid_elements += ',-ul';
						}
					} else if (typeof options.bulletList == 'boolean') {
						options.bulletList = {
							paragraphStyle: {name: options.paragraphStyles[0].name}
						}
					}

					validListElementsString += 'class=' + options.bulletList['paragraphStyle'].name;
				}
				if (hasBulletList && hasOrderedList) {
					validListElementsString += '|';
				}
				if (hasOrderedList) {
					if (instance.tinymceOptions.theme_advanced_buttons1.indexOf('numlist') == -1) {
						instance.tinymceOptions.theme_advanced_buttons1 += ',numlist';
					}
					if (typeof options.orderedList == 'object') {
						if (options.orderedList.hasOwnProperty('paragraphStyle')) {
							if (typeof options.orderedList['paragraphStyle'] == 'object' && !$.isArray(options.orderedList['paragraphStyle']) && options.orderedList['paragraphStyle']) {
								if (!options.orderedList['paragraphStyle'].hasOwnProperty('name')) {
									alert('DMPEditor: Paragraph style is an object but has no name property');
									return;
								}
							} else if (typeof options.orderedList.paragraphStyle == 'string' && options.orderedList.paragraphStyle) {
								options.orderedList.paragraphStyle = {name: options.orderedList['paragraphStyle']};
							}
							options.paragraphStyles.push(options.orderedList.paragraphStyle);
							instance.tinymceOptions.valid_elements += ',-ol';
						}
					} else if (typeof options.orderedList == 'boolean') {
						options.orderedList = {
							paragraphStyle: {name: options.paragraphStyles[0].name}
						};
					}

					$.each(['bold', 'italic', 'underline'], function(i, characterStyle) {
						if (options.orderedList.paragraphStyle.hasOwnProperty(characterStyle) && options.orderedList.paragraphStyle[characterStyle]) {
							// If we have a font name for bold/italic/underline, make sure the font name doesn't start with a /
							if (typeof options.orderedList.paragraphStyle[characterStyle] == 'string') {
								if (options.orderedList.paragraphStyle[characterStyle].charAt(0) == '/') {
									options.orderedList.paragraphStyle[characterStyle] = {font: options.orderedList.paragraphStyle[characterStyle].substr(1)};
								} else {
									options.orderedList.paragraphStyle[characterStyle] = {font: options.orderedList.paragraphStyle[characterStyle]};
								}
							}
							// If any paragraph style has bold/italic/underline enabled, show the bold/italic/underline button
							// if (instance.tinymceOptions.theme_advanced_buttons1.indexOf(characterStyle) == -1) {
							// 	characterStyleString += characterStyle + ',';
							// }
						}
					});

					validListElementsString += 'class=' + options.orderedList['paragraphStyle'].name;
				}
				validListElementsString += ']';
				instance.tinymceOptions.valid_elements += validListElementsString;
			}

			var characterStyleString = '';
			if (options.hasOwnProperty('paragraphStyles')) {
				// Make sure that the paragraphStyles are in a correct format
				if (!$.isArray(options.paragraphStyles)) {
					options.paragraphStyles = [options.paragraphStyles];
				}
				for (var i = 0, n = options.paragraphStyles.length; i < n; ++i) {
					if (typeof options.paragraphStyles[i] == 'object' && !$.isArray(options.paragraphStyles[i]) && options.paragraphStyles[i]) {
						if (!options.paragraphStyles[i].hasOwnProperty('name')) {
							alert('DMPEditor: Paragraph style is an object but has no name property');
							return;
						}
					} else if (typeof options.paragraphStyles[i] == 'string' && options.paragraphStyles[i]) {
						options.paragraphStyles[i] = {name: options.paragraphStyles[i]};
					}
				}
				
				// If we have only one paragraph style, make it the default style
				if (options.paragraphStyles.length == 1) {
					instance.tinymceOptions.formats.p = {block: 'p', attributes: {'class': options.paragraphStyles[0].name}};
				} else {
					instance.tinymceOptions.style_formats = [];
				}

				$.each(options.paragraphStyles, function(i, paragraphStyle) {
					if (!paragraphStyle.hasOwnProperty('name')) {
						alert('DMPEditor: Paragraph style is an object but has no name property');
						return;
					}
					if (!paragraphStyle.hasOwnProperty('title')) {
						paragraphStyle.title = paragraphStyle.name;
					}
					// If we have more than one paragraph style, create a dropdown menu of the styles
					if (options.paragraphStyles.length > 1) {
						// instance.tinymceOptions.style_formats.push({title: paragraphStyle.name, block: 'p', attributes: {'class': paragraphStyle.name}});
						instance.tinymceOptions.style_formats.push({name: paragraphStyle.name, title: paragraphStyle.title, block: 'p', attributes: {'class': paragraphStyle.name}});
					}
					$.each(['bold', 'italic', 'underline'], function(i, characterStyle) {
						if (paragraphStyle.hasOwnProperty(characterStyle) && paragraphStyle[characterStyle]) {
							// If we have a font name for bold/italic/underline, make sure the font name doesn't start with a /
							if (typeof paragraphStyle[characterStyle] == 'string') {
								if (paragraphStyle[characterStyle].charAt(0) == '/') {
									paragraphStyle[characterStyle] = {font: paragraphStyle[characterStyle].substr(1)};
								} else {
									paragraphStyle[characterStyle] = {font: paragraphStyle[characterStyle]};
								}
							}
							// If any paragraph style has bold/italic/underline enabled, show the bold/italic/underline button
							if (instance.tinymceOptions.theme_advanced_buttons1.indexOf(characterStyle) == -1) {
								characterStyleString += characterStyle + ',';
							}
						}
					});
					if (paragraphStyle.hasOwnProperty('boldItalic') && paragraphStyle['boldItalic']) {
						// If we have a font name for bold italic, make sure the font name doesn't start with a /
						if (typeof paragraphStyle['boldItalic'] == 'string') {
							if (paragraphStyle['boldItalic'].charAt(0) == '/') {
								paragraphStyle['boldItalic'] = {font: paragraphStyle['boldItalic'].substr(1)};
							} else {
								paragraphStyle['boldItalic'] = {font: paragraphStyle['boldItalic']};
							}
						}
					}
				});
				instance.tinymceOptions.valid_elements += ',#p[class=' + options.paragraphStyles[0].name + ']';
				if (options.paragraphStyles.length > 1) {
					if (instance.tinymceOptions.theme_advanced_buttons1.indexOf('styleselect') == -1) {
						instance.tinymceOptions.theme_advanced_buttons1 += ',|,styleselect';
					}
				}
			}

			if (characterStyleString) {
				instance.tinymceOptions.theme_advanced_buttons1 = characterStyleString + '|,' + instance.tinymceOptions.theme_advanced_buttons1;
			}

			if (options.hasOwnProperty('textColors')) {
				var hexColor = '';
				instance.tinymceOptions.theme_advanced_buttons1 += ',|,forecolor';
				options._rgbToColorName = {};
				options._colorNameToRGB = {};
				for (var colorName in options.textColors) {
					if (typeof options.textColors[colorName] == 'string') {
						hexColor = this.rgbToHex(this.cmykToRGB(options.textColors[colorName]));
						instance.tinymceOptions.theme_advanced_text_colors += hexColor + ',';
						options._rgbToColorName[hexColor] = colorName;
						options._colorNameToRGB[colorName] = hexColor;
					} else if (typeof options.textColors[colorName] == 'object') {
						if (options.textColors[colorName].hasOwnProperty('rgb')) {
							hexColor = this.rgbToHex(options.textColors[colorName].rgb);
						} else if (options.textColors[colorName].hasOwnProperty('cmyk')) {
							hexColor = this.rgbToHex(this.cmykToRGB(options.textColors[colorName].cmyk));
						} else {
							continue;
						}
						instance.tinymceOptions.theme_advanced_text_colors += hexColor + ',';
						options._rgbToColorName[hexColor] = colorName;
						options._colorNameToRGB[colorName] = hexColor;
					}
				}
				if (instance.tinymceOptions.theme_advanced_text_colors) {
					instance.tinymceOptions.theme_advanced_text_colors = instance.tinymceOptions.theme_advanced_text_colors.slice(0, -1);
					instance.tinymceOptions.formats.forecolor = {inline: 'span', styles: {color: '%value'}, attributes: {'data-dmpeditorcolorrgb': '%value'}};
				}
			}
			
			if (options.hasOwnProperty('fontSizes') && $.isArray(options.fontSizes) && options.fontSizes) {
				var fontSizesString = options.fontSizes.join('pt,') + 'pt';
				instance.tinymceOptions.theme_advanced_font_sizes = fontSizesString;
				instance.tinymceOptions.theme_advanced_buttons1 += ',|,fontsizeselect';
			}
			
			if ((options.hasOwnProperty('superscript') && options.superscript) || (options.hasOwnProperty('subscript') && options.subscript)) {
				instance.tinymceOptions.theme_advanced_buttons1 += ',|';
				if (options.hasOwnProperty('superscript') && options.superscript) {
					instance.tinymceOptions.theme_advanced_buttons1 += ',sup';
					if (options.superscript.hasOwnProperty('size')) {
						options.superscript.size += '';
						if (options.superscript.size.charAt(options.superscript.size.length - 1) == '%') {
							options.superscript.size = options.superscript.size.slice(0, -1);
						}
					}
					if (options.superscript.hasOwnProperty('position')) {
						options.superscript.position += '';
						if (options.superscript.position.charAt(options.superscript.position.length - 1) == '%') {
							options.superscript.position = options.superscript.position.slice(0, -1);
						}
					}
				}
				if (options.hasOwnProperty('subscript') && options.subscript) {
					instance.tinymceOptions.theme_advanced_buttons1 += ',sub';
					if (options.subscript.hasOwnProperty('size')) {
						options.subscript.size += '';
						if (options.subscript.size.charAt(options.subscript.size.length - 1) == '%') {
							options.subscript.size = options.subscript.size.slice(0, -1);
						}
					}
					if (options.subscript.hasOwnProperty('position')) {
						options.subscript.position += '';
						if (options.subscript.position.charAt(options.subscript.position.length - 1) == '%') {
							options.subscript.position = options.subscript.position.slice(0, -1);
						}
					}
				}
			}
			
			if (options.hasOwnProperty('nonbreaking') && options.nonbreaking) {
				instance.tinymceOptions.plugins += ',nonbreaking';
				instance.tinymceOptions.theme_advanced_buttons1 += ",|,nonbreaking";
			}

			if (options.hasOwnProperty('tabStop')) {
				instance.options.tabStop = options.tabStop;
			}
			
			instance.options = $.extend(true, {}, options);
		}

		instance.tinymceOptions.theme_advanced_buttons1 += ',|,removeformat';

		if (instance.options.hasOwnProperty('fieldName')) {
			if ($.isArray(instance.options.fieldName)) {
				instance.options.fieldNames = instance.options.fieldName;
			} else {
				instance.options.fieldNames = [instance.options.fieldName];
			}
		}
		
		if (instance.options.hasOwnProperty('fieldNames')) {
			if (typeof instance.options.fieldNames === 'string') {
				instance.options.fieldNames = [instance.options.fieldNames];
			}
			for (var i = 0, n = instance.options.fieldNames.length; i < n; ++i) {
				if (typeof instance.options.fieldNames[i] === 'string') {
					instance.options.fieldNames[i] = {html: instance.options.fieldNames[i]};
				}
				if (instance.options.fieldNames[i].hasOwnProperty('text') && FieldIDs.hasOwnProperty(instance.options.fieldNames[i].text)) {
					$('#DIV_' + FieldIDs[instance.options.fieldNames[i].text]).addClass('DMPEditorHiddenPlainTextField');
				}

				this.instanceIDsByHTMLFieldName[instance.options.fieldNames[i].html] = instance.id;
			}
		}

		if (!$.browser.msie || ($.browser.msie && parseInt($.browser.version, 10) >= 9)) {
			instance.tinymceOptions.content_css += ',' + '/js/dmpeditor_modern.css?' + this.cacheBuster;
		}

		if (options.hasOwnProperty('css')) {
			instance.tinymceOptions.content_css += ',' + options.css + '?' + this.cacheBuster;
		}

		if (options.hasOwnProperty('lazyInitialize')) {
			instance.options.lazyInitialize = options.lazyInitialize;
		}

		this.instances[instanceID] = instance;

		if ($('#DMPEditorGenericCSS').length === 0) {
			var css = '<style id="DMPEditorGenericCSS" type="text/css">' +
				'.DMPEditorHiddenField, .DMPEditorHiddenPlainTextField p { display: none !important; }' +
				'</style>';
			$(css).appendTo('head');
		}

		if (instance.options.hasOwnProperty('popup') && instance.options.popup === true) {
			this.initializePopupInstance(instance);
		} else {
			this.initializeInlineInstance(instance);
		}
	},

	initializePopupInstance: function(instance) {
		var dialogWidth = 600;
		var dialogHeight = 600;
		var editorWidth = dialogWidth - 20;
		if ($.browser.msie) {
			editorWidth = dialogWidth - 24;
		}
		editorHeight = dialogHeight - 40 - 18; // 18px toolbar

		if (instance.options.hasOwnProperty('hintText') && instance.options.hintText) {
			editorHeight -= 40;
		}
		
		instance.tinymceOptions.width = editorWidth;
		instance.tinymceOptions.height = editorHeight;

		instance.options.dialogWidth = dialogWidth;
		instance.options.dialogHeight = dialogHeight;

		if ($('#DMPEditorPopupCSS').length === 0) {
			var popupCSS = '<style id="DMPEditorPopupCSS" type="text/css">' +
				'.ui-dialog { padding-top: 2px !important; padding-right: 2px !important; padding-bottom: 2px !important; padding-left: 2px !important; } ' +
				'.ui-dialog .ui-dialog-content { width: ' + dialogWidth + 'px !important; height: ' + dialogHeight + 'px !important; padding-top: 0 !important; padding-right: 0 !important; padding-bottom: 0 !important; padding-left: 0 !important; } ' +
				'.ui-widget-overlay { cursor: hand; cursor: pointer; }' +
				'.DMPEditorDialog .mceEditor { float: left !important; clear: both !important; } .DMPEditorDialog .mceEditor table.mceLayout { height: auto !important; position: relative; top: 10px !important; left: 10px !important; } ' +
				'' +
				'</style>';
			$(popupCSS).appendTo('head');
		}

		if (!instance.options.hasOwnProperty('buttons')) {
			instance.options.buttons = {
				'updateAndClose': 'Ok',
				'update': 'Update Preview'
			};
		}
		if (!instance.options.hasOwnProperty('fieldNames') || !$.isArray(instance.options.fieldNames)) {
			return;
		}

		var instanceID, fieldID, fieldName;
		instanceID = instance.id;

		if (!instance.options.hasOwnProperty('lazyInitialize') || instance.options.lazyInitialize !== true) {
			for (var i = 0, n = instance.options.fieldNames.length; i < n; ++i) {
				fieldID = FieldIDs[instance.options.fieldNames[i].html];
				fieldName = instance.options.fieldNames[i];
				this.initializePopupEditor(instance, fieldID, fieldName);
			}
		}

		$(document.body).on('click', '.DMPEditorTrigger', function(e) {
			e.preventDefault();
			var ids = this.id.split('_');
			var instanceID = ids[1];
			var fieldID = ids[2];
			$('#DMPEditorDialog_' + instanceID + '_' + fieldID).dialog('open');
			return false;
		});
		
		$(document.body).on('click', '.DMPEditorUpdateAndCloseButton', function(e) {
			e.preventDefault();
			var ids = this.id.split('_');
			var instanceID = ids[1];
			var fieldID = ids[2];
			DMPEditor.update(instanceID, fieldID, true);
		});

		$(document.body).on('click', '.DMPEditorUpdateButton', function(e) {
			e.preventDefault();
			var ids = this.id.split('_');
			var instanceID = ids[1];
			var fieldID = ids[2];
			DMPEditor.update(instanceID, fieldID);
		});

		$(document.body).on('click', '.DMPEditorClearButton', function(e) {
			e.preventDefault();
			var ids = this.id.split('_');
			var instanceID = ids[1];
			var fieldID = ids[2];
			DMPEditor.clear(instanceID, fieldID);
		});

		$(document.body).on('click', '.ui-widget-overlay', function() {
			$('div.ui-dialog:visible div.ui-dialog-content').each(function() {
				var ids = $(this).attr('id').split('_');
				var instanceID = ids[1];
				var fieldID = ids[2];
				DMPEditor.update(instanceID, fieldID, true);
			});
		});
	},

	initializePopupEditor: function(instance, fieldID, fieldName) {
		var instanceID = instance.id;
		var editButtonHTML, updateAndCloseButtonHTML, updateButtonHTML, clearButtonHTML;

		$('#DIV_' + fieldID).append('<div class="DMPEditorDialog" id="DMPEditorDialog_' + instanceID + '_' + fieldID + '"></div>');

		editButtonHTML = '<div class="block" style="float: left; clear: both;">' + DMPEditor.getButtonHTML('DMPEditorTrigger_' + instanceID + '_' + fieldID, (instance.options.editButtonText || 'Edit...'), 'DMPEditorTrigger') + '</div><p class="endOfButtons"></p>';
		$('#DIV_' + fieldID).append(editButtonHTML);
		
		if (!$('#FIELD_' + fieldID).val() && fieldName.hasOwnProperty('text')) {
			$('#FIELD_' + fieldID).val(
				'<p>' + $('#FIELD_' + FieldIDs[fieldName.text]).val().replace(/\r/gim, '').replace(/\n/gim, '</p><p>') + '</p>'
			);
		}

		$('<textarea/>')
			// .clone()
			.attr('id', 'DMPEditorArea_' + instanceID + '_' + fieldID)
			.attr('name', 'DMPEditorArea_' + instanceID + '_' + fieldID)
			.addClass('DMPEditorArea_' + instanceID)
			.val($('#FIELD_' + fieldID).val())
			.appendTo('#DMPEditorDialog_' + instanceID + '_' + fieldID);
		$('#FIELD_' + fieldID).addClass('DMPEditorOriginalArea_' + instanceID);
		if (!instance.options.hasOwnProperty('debug') || instance.options.debug === false) {
			$('#FIELD_' + fieldID).addClass('DMPEditorHiddenField');
		}
		
		var dialogTitle;
		if (instance.options.hasOwnProperty('dialogTitle')) {
			dialogTitle = instance.options.dialogTitle.replace(/\n/g, '<br/>');
		} else {
			dialogTitle = $('#DIV_' + fieldID + ' p').first().html();
		}
		if (instance.options.hasOwnProperty('additionalDialogTitle')) {
			dialogTitle += instance.options.additionalDialogTitle.replace(/\n/g, '<br/>');
		}
		
		$('#DMPEditorDialog_' + instanceID + '_' + fieldID).dialog({
			title: dialogTitle,
			width: instance.options.dialogWidth,
			height: instance.options.dialogHeight,
			modal: true,
			resizable: false,
			// draggable: false,
			autoOpen: false,
			open: function() {
				$('#DMPEditorDialog_' + instanceID + '_' + fieldID + ' textarea.DMPEditorArea_' + instanceID).each(function(index) {
					tinyMCE.init(DMPEditor.instances[instanceID].tinymceOptions);
					tinyMCE.execCommand('mceAddControl', false, this.id);
				});
			}
		});

		if (instance.options.hasOwnProperty('hintText') && instance.options.hintText) {
			$('#DMPEditorDialog_' + instanceID + '_' + fieldID).append('<div class="block" style="float: left; margin-top: 20px; margin-left: 8px;"><p class="Form_Tip">' + instance.options.hintText + '</p></div><div class="block" style="float: left; clear: left;"></div>');
		}

		var wholeButtonHTML = '';
		for (var buttonType in instance.options.buttons) {
			buttonClass = 'DMPEditor' + buttonType.charAt(0).toUpperCase() + buttonType.substr(1) + 'Button';
			wholeButtonHTML += '<div class="block" style="float: left; margin-top: 25px; margin-left: 8px;">' + 
				DMPEditor.getButtonHTML(buttonClass + '_' + instanceID + '_' + fieldID, instance.options.buttons[buttonType], buttonClass) +
				'</div>';
		}
		$('#DMPEditorDialog_' + instanceID + '_' + fieldID).append(wholeButtonHTML + '<p class="endOfButtons"></p>');

		DMPEditor.instances[instanceID].editors[fieldID] = new tinymce.Editor('DMPEditorArea_' + instanceID + '_' + fieldID, instance.tinymceOptions);
		DMPEditor.instances[instanceID].editors[fieldID].render();

		if ($.inArray(fieldName.html, DMPEditor.initializedHTMLFieldNames) < 0) {
			DMPEditor.initializedHTMLFieldNames.push(fieldName.html);
		}
	},

	initializeInlineInstance: function(instance) {
		if (instance.options.hasOwnProperty('fieldNames')) {
			if ($.isArray(instance.options.fieldNames)) {
				var fieldID;
				var instanceID = instance.id;
				instance.tinymceOptions['width'] = $('#FIELD_' + instance.options.fieldNames[0].html).width() + '';
				instance.tinymceOptions['height'] = $('#FIELD_' + instance.options.fieldNames[0].html).height() + '';

			if (!instance.options.hasOwnProperty('lazyInitialize') || instance.options.lazyInitialize !== true) {
				for (var i = 0, n = instance.options.fieldNames.length; i < n; ++i) {
					fieldID = FieldIDs[instance.options.fieldNames[i].html];
					fieldName = instance.options.fieldNames[i];
					this.initializeInlineEditor(instance, fieldID, fieldName);
				}
			}
			} else {
				alert("DMPEditor: Invalid field name definition!");
				return;
			}
		} else {
			alert("DMPEditor: No field names specified!");
		}
	},

	initializeInlineEditor: function(instance, fieldID, fieldName) {
		var instanceID = instance.id;

		// $('#FIELD_' + fieldID)
		$('<textarea/>')
			.clone()
			.attr('id', 'DMPEditorArea_' + instanceID + '_' + fieldID)
			.attr('name', 'DMPEditorArea_' + instanceID + '_' + fieldID)
			.addClass('DMPEditorArea_' + instanceID)
			.val($('#FIELD_' + fieldID).val())
			.insertAfter('#FIELD_' + fieldID);
		$('#FIELD_' + fieldID)
			.addClass('DMPEditorOriginalArea_' + instance.id);
		if (!instance.options.debug) {
			$('#FIELD_' + fieldID).addClass('DMPEditorHiddenField');
		}
		tinyMCE.init(instance.tinymceOptions);
		DMPEditor.instances[instanceID].editors[fieldID] = new tinymce.Editor('DMPEditorArea_' + instanceID + '_' + fieldID, instance.tinymceOptions);
		DMPEditor.instances[instanceID].editors[fieldID].render();

		if ($.inArray(fieldName.html, DMPEditor.initializedHTMLFieldNames) < 0) {
			DMPEditor.initializedHTMLFieldNames.push(fieldName.html);
		}
	},

	getButtonHTML: function(buttonID, caption, buttonClass) {
		return "<div class='siteButton'><div class='siteButton-t'><div class='siteButton-b'><div class='siteButton-l'><div class='siteButton-r'><div class='siteButton-tl'><div class='siteButton-tr'><div class='siteButton-bl'><div class='siteButton-br'><div class='siteButton-inner'><a class='siteButton " + buttonClass + "' id='" + buttonID + "'>" + caption + "</a></div></div></div></div></div></div></div></div></div></div>";
	},

	cmykToRGB: function(cmykString) {
		var cmyk = cmykString.split('-');
		var c = cmyk[0] / 100;
		var m = cmyk[1] / 100;
		var y = cmyk[2] / 100;
		var k = cmyk[3] / 100;
		
		var r = 1 - (c * (1 - k)) - k;
		var g = 1 - (m * (1 - k)) - k;
		var b = 1 - (y * (1 - k)) - k;
	 
		r = Math.round(r * 255);
		g = Math.round(g * 255);
		b = Math.round(b * 255);
		
		// return 'rgb(' + r + ',' + g + ',' + b + ')';
		return r + '-' + g + '-' + b;
	},

	rgbToHex: function(rgbString) {
		var rgb = rgbString.split('-');
		var r = (rgb[0] * 1).toString(16);
		var g = (rgb[1] * 1).toString(16);
		var b = (rgb[2] * 1).toString(16);
		if (r.length == 1) r = '0' + r;
		if (g.length == 1) g = '0' + g;
		if (b.length == 1) b = '0' + b;
		return '#' + r + g + b;
	}
};