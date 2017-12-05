function FormGetFieldValue (fieldName)
{
	return PFSF_GetFieldValueByName("FIELD_" + FieldIDs[fieldName]);
}

function FormSetFieldValue (fieldName, fieldValue)
{
	PFSF_SetControlValue(PFSF_Find('FIELD_' + FieldIDs[fieldName]), fieldValue);
}

function FormGetField (fieldName)
{
	return PFSF_Find('FIELD_' + FieldIDs[fieldName]);
}

function FormUpdatePreview ()
{
	PFSF_AjaxUpdateForm();
	return true;
}

function IsNewDocument ()
{	
	if ((FormGetFieldValue("IsNewDocument").toLowerCase() == "true"))
	{
		FormSetFieldValue("IsNewDocument", "false");
		if (typeof firstLoad != undefined)
		{
			firstLoad = false;
		}
		return true;
	}
	else
		return false;
}

function FormHideField (fieldName)
{
	PFSF_ShowElement(false, PFSF_Find('FIELD_' + FieldIDs[fieldName]));
	PFSF_ShowElement(false, PFSF_Find('DIV_' + FieldIDs[fieldName]));
}

function FormShowField (fieldName)
{
	PFSF_ShowElement(true, PFSF_Find('FIELD_' + FieldIDs[fieldName]));
	PFSF_ShowElement(true, PFSF_Find('DIV_' + FieldIDs[fieldName]));
}

function FormShowOnlyFields (fieldNamesList)
{
	// first make everything visible
	for (var fieldName in FieldIDs)
	{
		FormShowField (fieldName);
	}
	PFSF_ShowHideConditionalFields(10);
	var fieldNamesString = fieldNamesList + ",";
	for (fieldName in FieldIDs)
	{
		var theField = PFSF_Find('FIELD_' + FieldIDs[fieldName]);
		if (theField == null)
		{
			theField = PFSF_Find('DIV_' + FieldIDs[fieldName]);
		}
		if (theField == null)
		{
			alert(fieldName + " not found!");
		}
		// only show if it's not currently hidden
		if (theField != null && !(theField.style == null || theField.style.display == null || theField.style.display == "none")
			&& fieldNamesString.indexOf(fieldName + ",") == -1)
		{
			FormHideField (fieldName);
		}
	}
}

function FormHideOnlyFields (fieldNamesList)
{
	// first make everything visible
	for (var fieldName in FieldIDs)
	{
		FormShowField (fieldName);
	}
	PFSF_ShowHideConditionalFields(10);
	var fieldNamesString = fieldNamesList + ",";
	for (fieldName in FieldIDs)
	{
		var theField = PFSF_Find('FIELD_' + FieldIDs[fieldName]);
		if (theField == null)
		{
			theField = PFSF_Find('DIV_' + FieldIDs[fieldName]);
		}
		if (theField == null)
		{
			alert(fieldName + " not found!");
		}
		// only hide if it's not currently hidden
		if (!(theField.style == null || theField.style.display == null || theField.style.display == "none")
			&& fieldNamesString.indexOf(fieldName + ",") != -1)
		{
			FormHideField (fieldName);
		}
	}
}