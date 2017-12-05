/*

Usage example (one field):

function StorefrontEvaluateFieldsHook() {
	DMPContentSwitcher.update();
}

$(function() {
	DMPContentSwitcher.initialize({
		selectionFieldName: 'Language',
		data: {
			'fi': {
				'Title': 'Muistatko viime talven?',
				'Body': 'Pohjoisen talvessa pärjää vain tänne suunnitelluilla renkailla. Siksi Nokian Hakkapeliitta on testattu ja tehty\nkovimman kautta, antamaan varmuutta pohjoisen talven vaativiin olosuhteisiin. Ja juuri siksi se on kerännyt\nenemmän testivoittoja* kuin mikään muu talvirengasmerkki. Hanki aidot Nokian Hakkapeliitat ja nauti talvesta!'
			},
			'sv': {
				'Title': 'Du har väl inte glömt\nförra vintern?',
				'Body': 'Svensk vinter kräver däck som är anpassade efter vårt ibland extrema klimat. För att vara pålitliga även vid krävande\nväglag har alla Nokian Hakkapeliitta genomgått de svåraste av tester. Det är kanske därför vi har vunnit fler tester än\nnågra andra vinterdäck. Skaffa Nokian Hakkapeliitta och njut av vintern.'
			},
			'no': {
				'Title': 'Husker du sist vinter?',
				'Body': 'Den nordiske vinteren krever dekk som er spesialprodusert for Norden. Nokian Hakkapeliitta er testet og\nutviklet for å møte vinterens utfordringer. Dekket har fått flere testpriser enn noe annet vinterdekk. Skaff\ndeg Nokian Hakkapeliitta dekk og nyt vinteren.'
			}
		}
	});
});

Usage example (two fields):

function StorefrontEvaluateFieldsHook() {
	DMPContentSwitcher.update();
}

$(function() {
	DMPContentSwitcher.initialize({
		selectionFieldName: [
			'Language',
			'Subject'
		],
		data: {
			'fi': {
				'HKPL_7': {
					'Title': 'Muistatko viime talven?',
					'Body': 'Pohjoisen talvessa pärjää vain tänne suunnitelluilla renkailla. Siksi Nokian Hakkapeliitta on testattu ja tehty\nkovimman kautta, antamaan varmuutta pohjoisen talven vaativiin olosuhteisiin. Ja juuri siksi se on kerännyt\nenemmän testivoittoja* kuin mikään muu talvirengasmerkki. Hanki aidot Nokian Hakkapeliitat ja nauti talvesta!'
				},
				'HKPL_R': {
					'Title': 'Muistatko viime talven?',
					'Body': 'Pohjoisen talvessa pärjää vain tänne suunnitelluilla renkailla. Siksi Nokian Hakkapeliitta on testattu ja tehty\nkovimman kautta, antamaan varmuutta pohjoisen talven vaativiin olosuhteisiin. Ja juuri siksi se on kerännyt\nenemmän testivoittoja* kuin mikään muu talvirengasmerkki. Hanki aidot Nokian Hakkapeliitat ja nauti talvesta!'
				}
			},
			'sv': {
				'HKPL_7': {
					'Title': 'Muistatko viime talven?',
					'Body': 'Pohjoisen talvessa pärjää vain tänne suunnitelluilla renkailla. Siksi Nokian Hakkapeliitta on testattu ja tehty\nkovimman kautta, antamaan varmuutta pohjoisen talven vaativiin olosuhteisiin. Ja juuri siksi se on kerännyt\nenemmän testivoittoja* kuin mikään muu talvirengasmerkki. Hanki aidot Nokian Hakkapeliitat ja nauti talvesta!'
				},
				'HKPL_R': {
					'Title': 'Muistatko viime talven?',
					'Body': 'Pohjoisen talvessa pärjää vain tänne suunnitelluilla renkailla. Siksi Nokian Hakkapeliitta on testattu ja tehty\nkovimman kautta, antamaan varmuutta pohjoisen talven vaativiin olosuhteisiin. Ja juuri siksi se on kerännyt\nenemmän testivoittoja* kuin mikään muu talvirengasmerkki. Hanki aidot Nokian Hakkapeliitat ja nauti talvesta!'
				}
			},
			'no': {
				'HKPL_7': {
					'Title': 'Muistatko viime talven?',
					'Body': 'Pohjoisen talvessa pärjää vain tänne suunnitelluilla renkailla. Siksi Nokian Hakkapeliitta on testattu ja tehty\nkovimman kautta, antamaan varmuutta pohjoisen talven vaativiin olosuhteisiin. Ja juuri siksi se on kerännyt\nenemmän testivoittoja* kuin mikään muu talvirengasmerkki. Hanki aidot Nokian Hakkapeliitat ja nauti talvesta!'
				},
				'HKPL_R': {
					'Title': 'Muistatko viime talven?',
					'Body': 'Pohjoisen talvessa pärjää vain tänne suunnitelluilla renkailla. Siksi Nokian Hakkapeliitta on testattu ja tehty\nkovimman kautta, antamaan varmuutta pohjoisen talven vaativiin olosuhteisiin. Ja juuri siksi se on kerännyt\nenemmän testivoittoja* kuin mikään muu talvirengasmerkki. Hanki aidot Nokian Hakkapeliitat ja nauti talvesta!'
				}
			}
		}
	});
});

*/

var DMPContentSwitcher = {
	instances: [],
	
	initialize: function(args) {
		if ($.isArray(args)) {
			for (var i = 0, o = args.length; i < o; ++i) {
				if (args[i].hasOwnProperty('debug') && args[i].debug) {
					console.log('DMPContentSwitcher.initialize()');
				}
				this.createInstance(args[i]);
			}
		} else {
			if (args.hasOwnProperty('debug') && args.debug) {
				console.log('DMPContentSwitcher.initialize()');
			}
			this.createInstance(args);
		}
	},
	
	createInstance: function(options) {
		var instance = {
			debug: false,
			selectionFieldNames: [],
			selections: [],
			previousSelections: [],
			data: {},
			forceUpdate: false
		};
		if (options.hasOwnProperty('selectionFieldNames')) {
			if ($.isArray(options.selectionFieldNames)) {
				instance.selectionFieldNames = options.selectionFieldNames;
			} else {
				instance.selectionFieldNames = [options.selectionFieldNames];
			}
		} else if (options.hasOwnProperty('selectionFieldName')) {
			if ($.isArray(options.selectionFieldName)) {
				instance.selectionFieldNames = options.selectionFieldName;
			} else {
				instance.selectionFieldNames = [options.selectionFieldName];
			}
		}
		for (var i = 0, o = instance.selectionFieldNames.length; i < o; ++i) {
			instance.selections[i] = PFSF_GetFieldValueByName('FIELD_' + FieldIDs[instance.selectionFieldNames[i]]);
			if (!isNaN(parseInt(instance.selections[i], 10)) && $('#FIELD_' + FieldIDs[instance.selectionFieldNames[i]] + '_IMGNAME').length > 0) {
				instance.selections[i] = $('#FIELD_' + FieldIDs[instance.selectionFieldNames[i]] + '_IMGNAME').val();
			}
			instance.previousSelections[i] = instance.selections[i];
		}
		instance.data = options.data || instance.data;
		instance.forceUpdate = (options.hasOwnProperty('forceUpdate')) ? options.forceUpdate : instance.forceUpdate;
		instance.debug = (options.hasOwnProperty('debug')) ? options.debug : instance.debug;
		this.instances.push(instance);
	},

	update: function() {
		var hasChanged = false, a = [];
		var instance = {};
		var isImageSelected = false;
		var hasDMPEditorFields = false;
		var isDMPEditorField = false, dmpEditorFieldID, dmpEditorInstanceID;
		var dmpEditorsToUpdate = [];
		var isHTMLLiteral = false;
		var isImageField = false, $imageLinks, $imageLink, imageIDMatch, imageID;
		var i, j, k;
		for (i = 0, n = this.instances.length; i < n; ++i) {
			instance = this.instances[i];
			if (instance.debug) {
				console.log('DMPContentSwitcher.update()');
			}
			hasChanged = false;
			isImageSelected = false;
			for (j = 0, o = instance.selectionFieldNames.length; j < o; ++j) {
				instance.selections[j] = PFSF_GetFieldValueByName('FIELD_' + FieldIDs[instance.selectionFieldNames[j]]);
				if (!isNaN(parseInt(instance.selections[j], 10)) && $('#FIELD_' + FieldIDs[instance.selectionFieldNames[j]] + '_IMGNAME').length > 0) {
					instance.selections[j] = $('#FIELD_' + FieldIDs[instance.selectionFieldNames[j]] + '_IMGNAME').val();
					isImageSelected = true;
				}
				if (instance.debug) {
					console.log('DMPContentSwitcher.update(): Value of selection field "' + instance.selectionFieldNames[j] + '" is "' + instance.selections[j] + '"');
				}
				if (instance.previousSelections[j] != instance.selections[j]) {
					hasChanged = true;
				}
			}
			if (!hasChanged && instance.forceUpdate !== true) {
				if (instance.debug) {
					console.log('DMPContentSwitcher.update(): Selections have not changed and forceUpdate !== true');
				}
				continue;
			}

			a = instance.data[instance.selections[0]];
			if (instance.selections.length > 1) {
				for (j = 1, o = instance.selections.length; j < o; ++j) {
					a = a[instance.selections[j]];
				}
			}
			for (var contentFieldName in a) {
				isDMPEditorField = false;
				if (typeof DMPEditor !== 'undefined' && DMPEditor.instances.length > 0) {
					dmpEditorFieldID = parseInt(FieldIDs[contentFieldName], 10);
					if (DMPEditor.instanceIDsByHTMLFieldName.hasOwnProperty(contentFieldName)) {
						isDMPEditorField = true;
						hasDMPEditorFields = true;
						if (instance.debug) {
							console.log('DMPContentSwitcher.update(): Replacing content in DMPEditor field "' + contentFieldName + '" to "' + a[contentFieldName] + '"');
						}
						dmpEditorInstanceID = DMPEditor.instanceIDsByHTMLFieldName[contentFieldName];
						DMPEditor.instances[dmpEditorInstanceID].editors[FieldIDs[contentFieldName]].setContent(a[contentFieldName]);
						// DMPEditor.update(dmpEditorInstanceID, dmpEditorFieldID);
						dmpEditorsToUpdate.push(
							{ instanceID: dmpEditorInstanceID, fieldID: dmpEditorFieldID }
						);
					}
				}

				isHTMLLiteral = false;
				if ($('#FIELD_' + FieldIDs[contentFieldName]).length === 0 && $('#DIV_' + FieldIDs[contentFieldName]).length > 0) {
					isHTMLLiteral = true;
					if (instance.debug) {
						console.log('DMPContentSwitcher.update(): Replacing content in HTML literal field "' + contentFieldName + '" to "' + a[contentFieldName] + '"');
					}
					$('#DIV_' + FieldIDs[contentFieldName]).find(':not(script, div.validationError)').remove();
					$('#DIV_' + FieldIDs[contentFieldName]).prepend(a[contentFieldName]);
				}

				isImageField = false;
				if (!isNaN(parseInt(PFSF_GetFieldValueByName('FIELD_' + FieldIDs[contentFieldName]), 10)) && $('#FIELD_' + FieldIDs[contentFieldName] + '_IMGNAME').length > 0) {
					isImageField = true;

					$imageLinks = $('div.assetThumbnail > a[title="' + a[contentFieldName] + '"]');
					if ($imageLinks.length > -1) {
						$imageLink = $imageLinks.first();
						if ($imageLink.attr('href')) {
							imageIDMatch = $imageLink.attr('href').match(/varvalue=(\d+)/);
							if (imageIDMatch && imageIDMatch.length > 1) {
								imageID = imageIDMatch[1];
								$('#FIELD_' + FieldIDs[contentFieldName]).val(imageID);
								$('#FIELD_' + FieldIDs[contentFieldName] + '_IMGNAME').val(a[contentFieldName]);
								if (instance.debug) {
									console.log('DMPContentSwitcher.update(): Replacing content in image field "' + contentFieldName + '" to "' + a[contentFieldName] + '"');
								}
							}
						} 
					}
				}

				if (!isDMPEditorField && !isHTMLLiteral && !isImageField) {
					if (instance.debug) {
						console.log('DMPContentSwitcher.update(): Replacing content in normal field "' + contentFieldName + '" to "' + a[contentFieldName] + '"');
					}
					PFSF_SetControlValue(PFSF_Find('FIELD_' + FieldIDs[contentFieldName]), a[contentFieldName]);
				}
			}
			for (j = 0, o = instance.selectionFieldNames.length; j < o; ++j) {
				instance.previousSelections[j] = instance.selections[j];
			}
			if (hasDMPEditorFields) {
				for (var j = 0, o = dmpEditorsToUpdate.length; j < o; j++) {
					DMPEditor.update(dmpEditorsToUpdate[j].instanceID, dmpEditorsToUpdate[j].fieldID);
				}
			}
			if (isImageSelected) {
				PFSF_AjaxUpdateForm("", true);
			}
		}
	}
}