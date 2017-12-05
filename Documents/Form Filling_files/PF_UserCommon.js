
// ------------ Pageflex AJAX code

function newHttpRequest()
{
  if (window.XMLHttpRequest)
    return new XMLHttpRequest();
  if (window.ActiveXObject)
    return new ActiveXObject("Microsoft.XMLHTTP");
  return null;
}

var PFSF_xmlRequest;
var PFSF_AjaxUrl;
var PFSF_AjaxMessagePrefixes = new Array();
var PFSF_AjaxMessages = new Array();
var PFSF_AjaxSkip = false;
var PFSF_changeStamp = 1;
var PFSF_lastReplyStamp = 0;
var PFSF_dynamicUpdateLevel = 0;

function PFSF_AjaxUpdateForm(urlExtra, forceSynchronous)
{
    //alert("1 - " + PFSF_AjaxUrl);
  if (PFSF_AjaxUrl == "" || PFSF_AjaxUrl == undefined || PFSF_AjaxSkip)
      return false; // didn't submit

  if (typeof StorefrontDelayedEvaluateFieldsHook !=
        typeof StorefrontUndefined_283981501AD46548)
      StorefrontDelayedEvaluateFieldsHook();

  if (PFSF_xmlRequest != null)
      PFSF_xmlRequest.abort();
    
  if (urlExtra == undefined)
    urlExtra = "";

  // alert("Updating " + urlExtra);

  if (urlExtra.substr(0, 5) == "quick")
  {
    // don't wait for preview
  }
  else
  {
    var pleaseWait = PFSF_Find("txtPleaseWait");
    
    if (pleaseWait == undefined || pleaseWait == null)
        pleaseWait = PFSF_Find("StepArea_txtPleaseWait");

    if (pleaseWait != undefined && pleaseWait != null) {
        //alert("Changing graphic");
        pleaseWait.innerHTML = "<span class='previewWaitMessage'><img src='Images/AjaxWait.gif' alt='' height='18' width='18' style='vertical-align: middle;'>&nbsp;" + PFSF_String_PleaseWait + "</span>";
    }
    else {
        var updateProgress = document.getElementById("updateProgress");
        if (updateProgress != undefined && updateProgress != null) {
            updateProgress.style.display = "";
        }
    }
  }

  var req = newHttpRequest();
  PFSF_xmlRequest = req;
  req.open("POST", PFSF_AjaxUrl, !forceSynchronous);
  if (!forceSynchronous)
    req.onreadystatechange = PFSF_CallHandleAjaxResponse; 
  req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;");
  // alert("Sending request");
  var ajq = PFSF_ConstructAjaxQuery();
  var qstr = urlExtra + ajq + "&changeStamp=" + PFSF_changeStamp;
  req.send(qstr);
  if (forceSynchronous)
    PFSF_HandleAjaxResponse(true);
  return true;
}

function PFSF_CallHandleAjaxResponse(evt)
{
    PFSF_HandleAjaxResponse(false);  // in Safari, evt is non-null
}

function PFSF_HandleAjaxResponse(forceSynchronous)
{
  if (forceSynchronous || 
      (PFSF_xmlRequest != null && PFSF_xmlRequest.readyState == 4))
  {
      var pageNumberDisplay = PFSF_Find("txtPleaseWait");
    
      if (pageNumberDisplay == undefined || pageNumberDisplay == null)
         pageNumberDisplay = PFSF_Find("StepArea_txtPleaseWait");

      if (pageNumberDisplay != undefined && pageNumberDisplay != null)
          pageNumberDisplay.innerHTML = "";
      else {
          var updateProgress = document.getElementById("updateProgress");
          if (updateProgress != undefined && updateProgress != null) {
              updateProgress.style.display = "none";
          }
      }
      if (PFSF_GetResponseStatusCode(PFSF_xmlRequest) == 200)
        PFSF_ParseAjaxResponse(PFSF_xmlRequest);
      PFSF_xmlRequest = null;
  }
}

// workaround for NS_ERROR_NOT_AVAILABLE (Mozilla bug)
function PFSF_GetResponseStatusCode(xmlHttpRequest)
{
  var status;
  try {
    status = xmlHttpRequest.status;
  }
  catch(e) { 
    status = 0; // no access to status right now
  }
  return status;
}

function PFSF_HtmlEscape(s)
{
  return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
}

function PFSF_escape(s)
{
  if (s == undefined)
    return "";
  s = escape(s);
  // escape doesn't handle + correctly, so we'll patch
  s = s.replace(/\+/g, "%2B");
  // escape doesn't handle UTF-8 correctly, so we'll patch
  s = s.replace(/\%8/g, "%*2%8");
  s = s.replace(/\%9/g, "%*2%9");
  s = s.replace(/\%A/g, "%*2%A");
  s = s.replace(/\%B/g, "%*2%B");  
  s = s.replace(/\%C/g, "%*3%8");
  s = s.replace(/\%D/g, "%*3%9");
  s = s.replace(/\%E/g, "%*3%A");
  s = s.replace(/\%F/g, "%*3%B");
  s = s.replace(/\%\*/g, "%C");
  return s;
}

function PFSF_GetTextContent(n)
{
  if (n.text != null)
    return n.text;
  if (n.textContent != null)
    return n.textContent;
  if (n.nodeValue != null)
    return n.nodeValue;
  if (n.firstChild != null)
    return n.firstChild.nodeValue;
  return null;
}


// ------------ Pageflex FFF code

var FieldIDs = new Object();
var DefaultIDNames = new Object();

var PFFormMode = '';

var PFSF_FindCache = new Array();
var PFSF_LastNodeWalked = null;
var PFSF_WalkStamp = 0;

function PFSF_WalkNext(n)
{
   if (n.firstChild != null)
       return n.firstChild;
   while (n != null)
   {
      if (n.nextSibling != null)
          return n.nextSibling;
       n = n.parentNode;
   }
   return null;
}

function PFSF_Walk()
{
   if (PFSF_LastNodeWalked == null)
   {
       PFSF_LastNodeWalked = document;
       PFSF_WalkStamp++;
   }
   var n = PFSF_LastNodeWalked;
   while (n != null)
   {
      if (typeof n != 'function' && n["PFSF_Stamp"] == PFSF_WalkStamp)
      {
        // Walking in circles
        n = null;
        break;
      } else if (typeof n == 'function') // skip applet
        n = PFSF_WalkNext(n);

      if (n.sourceIndex != undefined)
          n["PFSF_Stamp"] = PFSF_WalkStamp;

      PFSF_LastNodeWalked = n;
      var id = n.id;
      if ((n.type == "hidden" ||
           n.type == "radio") && 
          n.name != null &&
          n.name != "")
          id = n.name;
      if (id != null && id != "")
      {
         var c = PFSF_FindCache[id];
         if (c == null)
            c = new Array();
         c.push(n);
         PFSF_FindCache[id] = c;
      }
      var nn = n;
      n = PFSF_WalkNext(n);
      if (nn == n)
        break; // found mismatched html tags, we're not making any more forward progress
   }
}

// the equivalent of IE's document.all but will work in all browsers
function PFSF_Find(fid)
{
    if (document.all != undefined)// && document.all.item != undefined)
        return document.all[fid]; //return document.all.item(fid);

//   PFSF_Walk();
//   var c = PFSF_FindCache[fid];

   var c = document.getElementsByName(fid);

   if (c == null || c.length == 0)
       c = document.getElementById(fid);
   if (c == null || c.length == 0)  
     return null;
   if (c.length == 1)
     return c[0];
   return c;
}

function PFSF_GetFieldElementByName(fieldName)
{
    return PFSF_Find("FIELD_" + FieldIDs[fieldName]);
}

function PFSF_SetControlValue(control, v)
{
  if (control == null)
    return false;

  var changed = false;
  var t = control.type;

  // One way for selects....
  if (t == "select-one" || t == "select-multiple") {
  var msib = PFSF_Find(control.name + "_INCLUDE");
  if (msib) {
      var valCom = control.value;
      MSIB_Clear(control.name);
      var msibe = PFSF_Find(control.name + "_EXCLUDE");
      var o = msibe.options;
      var i;
      for (i = 0; i < o.length; i++) {
          var selectThisOne = (("\n" + v + "\n").toLowerCase().indexOf("\n" + o[i].value.toLowerCase() + "\n") != -1);
          if (selectThisOne)
              changed = true;
          o[i].selected = selectThisOne;
      }
      if (changed)
          MSIB_Process(control.name, true);
      changed = (valCom != control.value);
  }
  else {
      var o = control.options;
      var i;
      var foundOldValue = false;
      var foundNewValue = false;
      var newvalue = "";
      var oldvalue = "";
      for (i = 0; i < o.length; i++) {
          if (o[i].selected) {
              oldvalue = o[i].value;
              foundOldValue = true;
              o[i].selected = false;
          }
      }
      for (i = 0; i < o.length; i++) {
          var selectThisOne =
               (("\n" + v + "\n").toLowerCase().
                indexOf("\n" + o[i].value.toLowerCase() + "\n") != -1);
          if (selectThisOne) {
              foundNewValue = true;
              newvalue = o[i].value;
              o[i].selected = true;
              break;    // only set the first one
          }
      }

      if (foundOldValue || foundNewValue) {
          if (!foundOldValue || !foundNewValue || oldvalue != newvalue)
              changed = true;
      }
  }
  }
  else if (t == "radio")
  {
      var checkThisOne = (v == control.value);
      if (control.checked != checkThisOne)
          changed = true;
      control.checked = checkThisOne;
  }
  // ... one way for radios ...
  else if (t == null && control.length > 0)
  {
    var i;
    if (control[0].type == "radio")
    {
        t = "radio";
        for (i=0; i<control.length; i++)
        {
           var checkThisOne = (v == control[i].value);
           if (control[i].checked != checkThisOne)
              changed = true;
           control[i].checked = checkThisOne;
        }
    }
    else
    {
       // hey, that's not a radio control.
       // it's another kind of control that has
       // mutiple instances with the same name!
       // so we'll concatenate all of those values...
       for (i=0; i<control.length; i++)
       {
           if (PFSF_SetControlValue(control[i], v))
              changed = true;
       }
    }
  }
  // ... one way for checkboxes ...
  else if (t == "checkbox")
  {
     var checkThisOne = (v == control.value);
     if (checkThisOne != control.checked)
        changed = true;
     control.checked = checkThisOne;     
  }
  // ... and one way for text, hidden, and password
  else 
  {
     if (control.value != v)
        changed = true;
     control.value = v;
  }
  
  if (v == "" && control.getAttribute != undefined && control.getAttribute("pfsf_relatedid") != undefined)
  {
    PFSF_SetControlValue(PFSF_Find(control.getAttribute("pfsf_relatedid")), "");
  }

  return changed;
}

function PFSF_GetControlValue(control, forXML, isForCompare)
{
  if (control == null)
    return null;

  var v = "";
  var t = control.type;

  // One way for selects....
  if (t == "select-one" || t == "select-multiple")
  {
    var o = control.options;
    var i;
    for (i=0; i<o.length; i++)
    {
     if (o[i].selected)
     {
      if (v != "") v += "\n"
      v += o[i].value;
     }
    }
  }
  // ... one way for radios ...
  else if (t == "radio")
  {
      if (control.checked)
      {
         var controlOrAncestor = control;
         while (controlOrAncestor != null && 
                (controlOrAncestor.style == null ||
                 controlOrAncestor.style.display == null ||
                 controlOrAncestor.style.display == ""))
         {
             controlOrAncestor = controlOrAncestor.parentNode;
         }
         if (controlOrAncestor != null &&
             controlOrAncestor.style != null &&
             controlOrAncestor.style.display == "none")
         {
             // since radio buttons can't be "cleared",
             // if it's hidden and its "when hidden" behavior
             // is "clear" then pretend it has no value
             var i;
             for (i = 0; i < PFSF_conditionalFields.length; i++)
                 if (PFSF_conditionalFields[i].antecedantFieldName == control.name)
                 {
                     if (PFSF_conditionalFields[i].whatToDoWhenHidden == "C")
                         return "";
                     break;
                 }
         }
         v = control.value;
      }
  }
  else if (t == null && control.length > 0)
  {
    var i;
    if (control[0].type == "radio")
    {
        t = "radio";
        for (i=0; i<control.length; i++)
           if (control[i].checked)
              v = control[i].value;
    }
    else
    {
       // hey, that's not a radio control.
       // it's another kind of control that has
       // mutiple instances with the same name!
       // so we'll concatenate all of those values...
       for (i=0; i<control.length; i++)
       {
           var voic = PFSF_GetControlValue(control[i], forXML);
           if (voic == null)
               continue;
           if (v != "" && voic != "") v += "\n"
           v += voic;
       }
    }
  }
  // ... one way for checkboxes ...
  else if (t == "checkbox")
  {
      v = (control.checked ? (control.value != "" && control.value != null ? control.value : "checked") : (forXML || control.attributes['unvalue'] != null ? (control.attributes['unvalue'] ? control.attributes['unvalue'].value : control.attributes['unvalue']) : ""));
  }
  else if (isForCompare && control.getAttribute != undefined && control.getAttribute("pfsf_relatedid") != undefined) {
    v = PFSF_Find(control.getAttribute("pfsf_relatedid")).value;
  }
  else   // ... and one way for text, hidden, and password
     v = control.value;

  return v;
}

function PFSF_GetControlValueLabel(control, forXML)
{
  if (control == null)
    return null;

  var v = "";
  var t = control.type;

  // One way for selects....
  if (t == "select-one" || t == "select-multiple")
  {
    var o = control.options;
    var i;
    for (i=0; i<o.length; i++)
    {
     if (o[i].selected)
     {
      if (v != "") v += "\n"
      v += o[i].text;
     }
    }
  }
  // ... one way for radios ...
  else if (t == "radio")
  {
      if (control.checked)
      {
         var controlOrAncestor = control;
         while (controlOrAncestor != null && 
                (controlOrAncestor.style == null ||
                 controlOrAncestor.style.display == null ||
                 controlOrAncestor.style.display == ""))
         {
             controlOrAncestor = controlOrAncestor.parentNode;
         }
         if (controlOrAncestor != null &&
             controlOrAncestor.style != null &&
             controlOrAncestor.style.display == "none")
         {
             // since radio buttons can't be "cleared",
             // if it's hidden and its "when hidden" behavior
             // is "clear" then pretend it has no value
             var i;
             for (i = 0; i < PFSF_conditionalFields.length; i++)
                 if (PFSF_conditionalFields[i].antecedantFieldName == control.name)
                 {
                     if (PFSF_conditionalFields[i].whatToDoWhenHidden == "C")
                         return "";
                     break;
                 }
         }
         v = control.value;
      }
  }
  else if (t == null && control.length > 0)
  {
      var i;
    if (control[0].type == "radio")
    {
        t = "radio";
        for (i=0; i<control.length; i++)
           if (control[i].checked)
              v = control[i].value;
    }
    else
    {
       // hey, that's not a radio control.
       // it's another kind of control that has
       // mutiple instances with the same name!
       // so we'll concatenate all of those values...
       for (i=0; i<control.length; i++)
       {
           var voic = PFSF_GetControlValueLabel(control[i], forXML);
           if (voic == null)
               continue;
           if (v != "" && voic != "") v += "\n"
           v += voic;
       }
    }
  }
  // ... one way for checkboxes ...
  else if (t == "checkbox")
  {
      v = (control.checked ? (control.value != "" && control.value != null ? control.value : "checked") : (forXML || control.attributes['unvalue'] != null ? (control.attributes['unvalue'] ? control.attributes['unvalue'].value : control.attributes['unvalue']) : ""));
  }
  // ... and one way for text, hidden, and password
  else 
     v = control.value;

  return v;
}

function PFSF_GetFieldValueByName(fieldName, forXML, isForCompare)
{
    var f =  PFSF_Find(fieldName);

    if (!f)
        f = document.getElementById(fieldName);

    if (f == null ||
        f.selectedIndex < 0)
        return "";

    var s = null;
    if (PFFormMode == 'VIEW')
        s = f.value;
    else
        s = PFSF_GetControlValue(f, forXML, isForCompare);

    return s;
}

function PFSF_GetFieldValueLabelByName(fieldName, forXML)//this does not seem to be used anywhere
{
    var f =  PFSF_Find(fieldName);

    if (f == null ||
        f.selectedIndex < 0)
        return "";

    var s = null;
    if (PFFormMode == 'VIEW')
        s = f.value;
    else
        s = PFSF_GetControlValueLabel(f, forXML);

    return s;
}

var PFSF_CKEditorInstanceChanged = new Object();

function PFSF_ClearCKEditorChanged(n) {
    PFSF_CKEditorInstanceChanged[n] = false;
}

function PFSF_SetCKEditorChanged(n) {
    PFSF_CKEditorInstanceChanged[n] = true;
}

function PFSF_TestCKEditorChanged(n) {
    return PFSF_CKEditorInstanceChanged[n];
}

function PFSF_HasClass(elt, clsname) {
    if (elt.className) {
        var arrclasses = elt.className.split(" ");

        for (nnn = 0; nnn < arrclasses.length; nnn++) {
            if (arrclasses[nnn] == clsname)
                return true;
        }
    }

    return false;
}

function PFSF_SetupAntecedantField(f, n) {
    if (f == null)
        return;

    if (f.type == null &&
        f.length > 0 && n == undefined) // it's an array of controls
    {
        var i;
        for (i = 0; i < f.length; i++)
            PFSF_SetupAntecedantField(f[i], i);
    }
    else {
        if (n == undefined) n = 0;
        if (f.type == "text" ||
             f.type == "textarea" ||
             f.type == "password") {

            if (PFSF_HasClass(f, "PF_CKED_hidden")) {
                CKEDITOR.instances[f.id].on('focus',
                    new Function("e", "PFSF_ClearCKEditorChanged('" + f.id + "');"));
                CKEDITOR.instances[f.id].on('change',
                    new Function("e", "PFSF_SetCKEditorChanged('" + f.id + "');"));
                CKEDITOR.instances[f.id].on('blur',
                    new Function("e", 
                    "if (PFSF_TestCKEditorChanged('" + f.id + "')) " +
                    "    PFSF_ShowHideConditionalFields(2, document.getElementById('" + f.id + "'));"));
            }
            else
                document.getElementsByName(f.id)[n].onchange =
                    new Function("e", "PFSF_ShowHideConditionalFields(2, this);");
        }
        else if (f.type == "select-one" ||
             f.type == "select-multiple") {
            document.getElementsByName(f.id)[n].onchange = new Function("e", "PFSF_ShowHideConditionalFields(1, this);");
        }
        else if (f.type == "checkbox" ||
             f.type == "radio") {
            document.getElementsByName(f.id)[n].onclick = new Function("e", "PFSF_ShowHideConditionalFields(2, this);");
        }
        else if (f.type == "hidden") {
            var allNodes = f.parentNode.getElementsByTagName('div');
            if (allNodes.length == 0) //IE FIX
                allNodes = f.parentNode.parentNode.getElementsByTagName('div');
            for (var i = 0; i < allNodes.length; i++)
            {
                if (allNodes[i].attributes['groupid'] && allNodes[i].attributes['groupid'].value == f.name)
                {
                    var aFunct = new Function("e", "PFSF_ShowHideConditionalFields(2, this);");

                    if (allNodes[i].addEventListener) {
                        allNodes[i].addEventListener('click', aFunct, false);
                    }
                    else {
                        allNodes[i].attachEvent('onclick', aFunct, false);
                    }
                } 
            }
        }
    }
}

function PFSF_ShowElement(showIt, elt)
{
   if (elt == null || elt.style == null)
     return;
   if (!showIt)
   {
      elt.style.display = "none";
      return;
   }
   var bIsIE = (navigator.appName.indexOf("Microsoft") > -1); 
   if (elt.tagName == "INPUT")
   {
      elt.style.display = "inline";
      return;
   } 
   else if (!bIsIE && (elt.tagName == "TR" || elt.tagName == "TD"))
   {
      // non-IE uses table-row/table-cell instead of block
      elt.style.display = (elt.tagName == "TR") ? "table-row" : "table-cell";
      return;
   }
   elt.style.display = "block";
   return;
}

function PFSF_ShowField(showIt, fieldName, defaultValue, whatToDoWhenHidden)
{
    var fid = FieldIDs[fieldName];
    var theField = PFSF_Find("FIELD_" + fid);
    var valueWasChanged = false;
    if (theField != null)
    {
        var oneElement = theField;
        if (theField.length > 0)
           oneElement = theField[0];

        if (oneElement.style == null || 
            oneElement.style.display == null ||
            oneElement.style.display == "none") // was hidden
        {
          var fidName = "FIELD_" + FieldIDs[fieldName];
          if (showIt && // transitioning to visible
              whatToDoWhenHidden != 'K') // and wasn't "keep"
          {
             if (PFSF_GetFieldValueByName(fidName, false) == "")
                valueWasChanged = PFSF_SetControlValue(theField, defaultValue);
          }
        }
        else // was visible
        {
          if (!showIt) // transitioning to hidden
          {
            if (whatToDoWhenHidden == 'R') // reset to default
            {
                PFSF_SetControlValue(PFSF_Find("FIELD_" + fid + "_IMGNAME"),
                                     DefaultIDNames["Asset_" + defaultValue]);
                valueWasChanged = PFSF_SetControlValue(theField, defaultValue);
            }
            else if (whatToDoWhenHidden == 'C') // clear it
            {
              valueWasChanged = PFSF_SetControlValue(theField, '');
              PFSF_SetControlValue(PFSF_Find("FIELD_" + fid + "_IMGNAME"), '');
            }
          }
        }
    }

    PFSF_ShowElement(showIt, PFSF_Find("LABEL_" + fid));
    var ff = PFSF_Find("FIELD_" + fid);
    if (ff && !PFSF_HasClass(ff, "PF_CKED_hidden")) {
        PFSF_ShowElement(showIt, ff);
    }

    //if (ff && !ff.className.split(" ").indexOf("PF_CKED_hidden") >= 0)
    //    PFSF_ShowElement(showIt, ff);
    PFSF_ShowElement(showIt, PFSF_Find("VALUE_" + fid));
    PFSF_ShowElement(showIt, PFSF_Find("ROW_" + fid));
    PFSF_ShowElement(showIt, PFSF_Find("DIV_" + fid));
    return valueWasChanged;
}

function PFSF_ShowHideOneConditionalField(
        antecedantFieldName,
        comparisonOperator,
        comparisonValue,
        consequentFieldName,
        defaultValue,
        whatToDoWhenHidden)
{
    var antecedantValue = PFSF_GetFieldValueByName(antecedantFieldName, false, true);
    if (antecedantValue == null)
        antecedantValue = "";
    if (comparisonValue == null)
        comparisonValue = "";
    var showIt = true;
    switch (comparisonOperator)
    {
        case '!':
            showIt = false;
            break;

        case 'eq': 
            showIt = (antecedantValue.toLowerCase() == 
                      comparisonValue.toLowerCase()); 
            break;

        case 'bw': 
            showIt = (antecedantValue.toLowerCase().
                        substr(0, comparisonValue.length) ==
                      comparisonValue.toLowerCase()); 
            break;

        case 'ew': 
            showIt = (antecedantValue.toLowerCase().
                        substr(antecedantValue.length-comparisonValue.length) ==
                      comparisonValue.toLowerCase()); 
            break;

        case 'cn': 
            showIt = (antecedantValue.toLowerCase().indexOf(
                      comparisonValue.toLowerCase()) != -1); 
            break;

        case 'sl':  // selected (for multi-valued)
            showIt = (("\n" + antecedantValue.toLowerCase() + "\n").indexOf(
                      ("\n" + comparisonValue.toLowerCase() + "\n")) != -1); 
            break;

        case 'vl': // is valid (against the regex)
        case 're': 
            showIt = antecedantValue.match(new RegExp(comparisonValue, "")) != null;
            break;

        case 'rr': // required range
        case 'nr': // numeric range
            try {
                if (antecedantValue == "")
                    showIt = (comparisonOperator == 'nr');  // false if number required
                else {
                    var x = parseInt(antecedantValue);
                    var a = comparisonValue.split("<=");  // e.g. 1<=10
                    if (a[0] != "" && x < parseInt(a[0]))
                        showIt = false;
                    else if (a[1] != "" && parseInt(a[1]) < x)
                        showIt = false;
                    else
                        showIt = true;
                }
            }
            catch (eee) {
                showIt = false;
            }
            break;

        case '!eq': 
            showIt = !(antecedantValue.toLowerCase() == 
                      comparisonValue.toLowerCase()); 
            break;

        case '!bw': 
            showIt = !(antecedantValue.toLowerCase().
                        substr(0, comparisonValue.length) ==
                      comparisonValue.toLowerCase()); 
            break;

        case '!ew': 
            showIt = !(antecedantValue.toLowerCase().
                        substr(antecedantValue.length-comparisonValue.length) ==
                      comparisonValue.toLowerCase()); 
            break;

        case '!cn': 
            showIt = !(antecedantValue.toLowerCase().indexOf(
                      comparisonValue.toLowerCase()) != -1); 
            break;

        case '!sl':  // selected (for multi-valued)
            showIt = !(("\n" + antecedantValue.toLowerCase() + "\n").indexOf(
                       ("\n" + comparisonValue.toLowerCase() + "\n")) != -1); 
            break;

        case '!vl': // is valid (against the regex)
        case '!re': 
            showIt = !(antecedantValue.match(new RegExp(comparisonValue, "")) != null);
            break;

        case '!rr': // required range
        case '!nr': // numeric range
            try {
                if (antecedantValue == "")
                    showIt = (comparisonOperator == 'nr');  // false if number required
                else {
                    var x = parseInt(antecedantValue);
                    var a = comparisonValue.split("<=");  // e.g. 1<=10
                    if (a[0] != "" && x < parseInt(a[0]))
                        showIt = false;
                    else if (a[1] != "" && parseInt(a[1]) < x)
                        showIt = false;
                    else
                        showIt = true;
                }
            }
            catch (eee) {
                showIt = false;
            }

            showIt = !showIt;   // reverse
            break;

    }

    if (false) // for debugging
      alert("AFN=" + antecedantFieldName + "\n" +
            "AFV=" + antecedantValue + "\n" +
            "COP=" + comparisonOperator + "\n" +
            "CMV=" + comparisonValue + "\n" +
            "SIT=" + showIt + "\n" +
            "CFN=" + consequentFieldName);

    return PFSF_ShowField(showIt, consequentFieldName, defaultValue, whatToDoWhenHidden);
}

var infiniteLoopErrorMsg;
function PFSF_ShowHideConditionalFields(dynamicUpdateLevel, originatingObject, extraFields)
{
    if (typeof StorefrontEvaluateFieldsHook !=
        typeof StorefrontUndefined_283981501AD46548)
        StorefrontEvaluateFieldsHook(originatingObject);

    var restartCount = 0;
    var i;
    for (i = 0; i < PFSF_conditionalFields.length; i++)
        if (PFSF_ShowHideOneConditionalField(
                PFSF_conditionalFields[i].antecedantFieldName,
                PFSF_conditionalFields[i].comparisonOperator,
                PFSF_conditionalFields[i].comparisonValue,
                PFSF_conditionalFields[i].consequentFieldName,
                PFSF_conditionalFields[i].defaultValue,
                PFSF_conditionalFields[i].whatToDoWhenHidden))
        {
            if (restartCount++ < 32) // protect against infinite loops
               i = -1; // if one changed, start over
            else alert(infiniteLoopErrorMsg);
        }

   PFSF_changeStamp++;

   if (dynamicUpdateLevel != undefined && dynamicUpdateLevel > PFSF_dynamicUpdateLevel )
       return;

   if (extraFields == undefined)
       extraFields = "";

 if ((PFSF_AjaxUrl == "") && (PFSF_UpdateButtonID != '')) {
     if ((dynamicUpdateLevel != undefined) && (dynamicUpdateLevel.type != 'load'))
         __doPostBack(PFSF_UpdateButtonID, '');
 }
 else
     PFSF_AjaxUpdateForm('xx=sh&' + extraFields);

 
}

function PFSF_SetupAntecedantFields()
{
  for (var fieldName in FieldIDs)
     PFSF_SetupAntecedantField(PFSF_Find("FIELD_" + FieldIDs[fieldName]));
}

var PFSF_conditionalFields = new Array();

function PFSF_HTMLunescape(s)
{
  return s
   .replace(/&lt;/g, "<")
   .replace(/&gt;/g, ">")
   .replace(/&quot;/g, "\"")  // " to balance the quote for Emacs HTML mode
   .replace(/&#39;/g, "\'")
   .replace(/&amp;/g, "&")
  ;
}

function PFSF_CreateConditionalImageField(
        antecedantFieldName,
        comparisonOperator,
        comparisonValue,
        consequentFieldName,
        defaultAssetID,
        defaultAssetCaption,
        whatToDoWhenHidden)
{
    DefaultIDNames['Asset_' + defaultAssetID] = defaultAssetCaption;

    PFSF_CreateConditionalField(
        antecedantFieldName,
        comparisonOperator,
        comparisonValue,
        consequentFieldName,
        defaultAssetID,
        whatToDoWhenHidden);
}


function PFSF_CreateConditionalField(
        antecedantFieldName,
        comparisonOperator,
        comparisonValue,
        consequentFieldName,
        defaultValue,
        whatToDoWhenHidden)
{
    var newObject = new Object();
    newObject.antecedantFieldName = antecedantFieldName;
    newObject.comparisonOperator = comparisonOperator;
    newObject.comparisonValue = PFSF_HTMLunescape(comparisonValue);
    newObject.consequentFieldName = consequentFieldName;
    newObject.defaultValue = PFSF_HTMLunescape(defaultValue);
    newObject.whatToDoWhenHidden = whatToDoWhenHidden;
    PFSF_conditionalFields.push(newObject);
}

// MultiSelect IncludeBox
function MSIB_Process(base, shouldAdd /* true = add, false = remove */)
{
  var e = document.forms[0][base+(shouldAdd?"_EXCLUDE":"_INCLUDE")];
  var a = document.forms[0][base];
  var ei;
  var ai;
  for (ei=0; ei<e.options.length; ei++)
  {
    if (e.options[ei].selected)
      for (ai=0; ai<a.options.length; ai++)
        if (a.options[ai].value == e.options[ei].value)
          a.options[ai].selected = shouldAdd;
  }
  MSIB_Populate(base);
}
function MSIB_Clear(base) {
    var e = document.forms[0][base + "_INCLUDE"];
    var a = document.forms[0][base];
    var ei;
    var ai;
    for (ei = 0; ei < e.options.length; ei++) {
            for (ai = 0; ai < a.options.length; ai++)
            if (a.options[ai].value == e.options[ei].value)
            a.options[ai].selected = false;
    }
    MSIB_Populate(base);
}
function MSIB_Populate(base)
{
  var i = document.forms[0][base+"_INCLUDE"];
  var e = document.forms[0][base+"_EXCLUDE"];
  var a = document.forms[0][base];
  var o = a.options;
  i.options.length = 0;
  e.options.length = 0;
  var u;
  for (u=0; u<o.length; u++)
  {
    var no = new Option(o[u].text, o[u].value);
 
    if (o[u].selected) 
      i.options[i.options.length] = no;
    else
      e.options[e.options.length] = no;
  }
}


// adapted from AdminInteractiveSupport.inc

function PFSF_FindStyleInOneStylesheetAndItsIncludes(stylesheet, selectorText)
{
   var rules = new Array();
   // ns6 and ff don't support the selectorText property - https://bugzilla.mozilla.org/show_bug.cgi?id=51944
   //if (stylesheet.cssRules)
      //rules = stylesheet.cssRules;
   if (stylesheet.rules)
      rules = stylesheet.rules

   for (var i=0; i<rules.length; i++)
      if (rules[i].selectorText.toLowerCase() == selectorText)
          return rules[i];

   var imports = new Array();
   if (stylesheet.imports)
      imports = stylesheet.imports;
   for (var j=0; j<imports.length; j++)
   {
      var retval = PFSF_FindStyleInOneStylesheetAndItsIncludes(
         stylesheet.imports[j], selectorText);
      if (retval != null)
         return retval;
   }
}

var PFSF_styleCache = new Object();

function PFSF_FindStyle(className, elementName)
{
   var selectorText = (elementName + '.' + className).toLowerCase();
   if (PFSF_styleCache[selectorText] != null)
      return PFSF_styleCache[selectorText];

   for (var styleSheetIndex=0; 
        styleSheetIndex<document.styleSheets.length;
        styleSheetIndex++)
   {
      var retval = PFSF_FindStyleInOneStylesheetAndItsIncludes(
         document.styleSheets[styleSheetIndex], selectorText);
      if (retval != null)
      {
         PFSF_styleCache[selectorText] = retval;
         return retval;
      }
   }
   return null;
}

function PFSF_InsertRule(styleSheet, rule, index)
{  
   if (styleSheet.insertRule)  
   {
      styleSheet.insertRule(rule, styleSheet.cssRules.length); // DOM
      return true;
   }
   else if (styleSheet.addRule) 
   {
      styleSheet.addRule(rule.substring(0, rule.indexOf("{")), rule.substring(rule.indexOf("{") + 1, rule.indexOf("}")), index); // IE
      return true;
   }
   return false;
}

function PFSF_DeleteRule(styleSheet, index)
{  
   if (styleSheet.deleteRule)  
   {
      styleSheet.deleteRule(index); // DOM
      return true;
   }
   else if (styleSheet.removeRule) 
   {
      styleSheet.removeRule(index); // IE
      return true;
   }
   return false;
}


/* rounded corner divs javascript */
/* Add this line of javascript to page to use:
Rounded(class); */
function NiftyCheck() {
    if (!document.getElementById || !document.createElement) {
        return false;
    }
    var b = navigator.userAgent.toLowerCase();
    if (b.indexOf("msie 5") > 0 && b.indexOf("opera") == -1) {
        return false;
    }
    return true;
}

function Rounded(className, addMargins) {
    var bk;
    if (!NiftyCheck()) return;
    var v = getElements(className);
    var l = v.length;
    for (var i = 0; i < l; i++) {
        if (addMargins) {
            bk = get_current_style(v[i].parentNode, "background-color", "transparent");
            color = get_current_style(v[i].parentNode.parentNode, "background-color", "transparent");
            height = get_current_style(v[i].parentNode, "height", "0px");
            size = get_current_style(v[i].parentNode, "padding-top", "0px");
            v[i].style.marginRight = size;
            v[i].style.marginLeft = size;
            if (height.indexOf("px") > -1)
                v[i].style.height = height;
            v[i].parentNode.style.height = "auto";
            v[i].parentNode.style.paddingTop = "0px";
            v[i].parentNode.style.paddingLeft = "0px";
            v[i].parentNode.style.paddingRight = "0px";
            v[i].parentNode.style.paddingBottom = "0px";
        }
        else {
            color = get_current_style(v[i], "background-color", "transparent");
            bk = get_current_style(v[i].parentNode, "background-color", "transparent");
            size = get_current_style(v[i], "padding-top", "0px");
        }
        /*
            eleContent = document.createElement("div");
            //eleContent.setAttribute("class", className + "Content"); //do text align center in the css
            while (v[i].childNodes.length >= 1)
                eleContent.appendChild(v[i].firstChild);
          if (borderstyle == "solid") {
            ele = document.createElement("div");
            v[i].style.borderStyle = "none";
            ele.style.backgroundColor = bk;
            ele.style.marginRight = borderwidth;
            ele.style.marginLeft = borderwidth;
            //ele.setAttribute("class", className + "Child"); 
            ele.appendChild(eleContent);
            v[i].appendChild(ele);
        }
        else
            v[i].appendChild(eleContent);*/
        if (size.indexOf("px") > -1)
            size = size.substring(0, size.indexOf("px"));
        else
            size = 5;


        AddRounded(v[i], bk, color, size, size, true);
        AddRounded(v[i], bk, color, size, size, false);
        /*if (borderstyle == "solid") {
            AddRounded(ele, color, bk, borderwidth, borderwidth, true);
            AddRounded(ele, color, bk, borderwidth, borderwidth, false); //switch colors
        }*/
    }
}

Math.sqr = function(x) {
    return x * x;
};

function Blend(a, b, alpha) {
    a = ChangeColorToHex(a);
    b = ChangeColorToHex(b);
    
    var ca = Array(
    parseInt('0x' + a.substring(1, 3)),
    parseInt('0x' + a.substring(3, 5)),
    parseInt('0x' + a.substring(5, 7))
  );
    var cb = Array(
    parseInt('0x' + b.substring(1, 3)),
    parseInt('0x' + b.substring(3, 5)),
    parseInt('0x' + b.substring(5, 7))
  );
    return '#' + ('0' + Math.round(ca[0] + (cb[0] - ca[0]) * alpha).toString(16)).slice(-2).toString(16)
             + ('0' + Math.round(ca[1] + (cb[1] - ca[1]) * alpha).toString(16)).slice(-2).toString(16)
             + ('0' + Math.round(ca[2] + (cb[2] - ca[2]) * alpha).toString(16)).slice(-2).toString(16);
}
function ChangeColorToHex(ColorName) {
if (ColorName.substring(0, 1) != "#") {
        var hex = '';
        switch (ColorName.toLowerCase()) {
                case 'aliceblue':
                    hex = '#F0F8FF';
                    break;
                case 'antiquewhite':
                    hex = '#faebd7';
                    break;
                case 'aqua':
                    hex = '#00ffff';
                    break;
                case 'aquamarine':
                    hex = '#7fffd4';
                    break;
                case 'azure':
                    hex = '#f0ffff';
                    break;
                case 'beige':
                    hex = '#f5f5dc';
                    break;
                case 'bisque':
                    hex = '#ffe4c4';
                    break;
                case 'black':
                    hex = '#000000';
                    break;
                case 'blanchedalmond':
                    hex = '#ffebcd';
                    break;
                case 'blue':
                    hex = '#0000ff';
                    break;
                case 'blueviolet':
                    hex = '#8a2be2';
                    break;
                case 'brown':
                    hex = '#a52a2a';
                    break;
                case 'burlywood':
                    hex = '#deb887';
                    break;
                case 'cadetblue':
                    hex = '#5f9ea0';
                    break;
                case 'chartreuse':
                    hex = '#7fff00';
                    break;
                case 'chocolate':
                    hex = '#d2691e';
                    break;
                case 'coral':
                    hex = '#ff7f50';
                    break;
                case 'cornflowerblue':
                    hex = '#6495ed';
                    break;
                case 'cornsilk':
                    hex = '#fff8dc';
                    break;
                case 'crimson':
                    hex = '#dc143c';
                    break;
                case 'cyan':
                    hex = '#00ffff';
                    break;
                case 'darkblue':
                    hex = '#00008b';
                    break;
                case 'darkcyan':
                    hex = '#008b8b';
                    break;
                case 'darkgoldenrod':
                    hex = '#b8860b';
                    break;
                case 'darkgray':
                    hex = '#a9a9a9';
                    break;
                case 'darkgreen':
                    hex = '#006400';
                    break;
                case 'darkkhaki':
                    hex = '#bdb76b';
                    break;
                case 'darkmagenta':
                    hex = '#8b008b';
                    break;
                case 'darkolivegreen':
                    hex = '#556b2f';
                    break;
                case 'darkorange':
                    hex = '#ff8c00';
                    break;
                case 'darkorchid':
                    hex = '#9932cc';
                    break;
                case 'darkred':
                    hex = '#8b0000';
                    break;
                case 'darksalmon':
                    hex = '#e9967a';
                    break;
                case 'darkseagreen':
                    hex = '#8fbc8f';
                    break;
                case 'darkslateblue':
                    hex = '#483d8b';
                    break;
                case 'darkslategray':
                    hex = '#2f4f4f';
                    break;
                case 'darkturquoise':
                    hex = '#00ced1';
                    break;
                case 'darkviolet':
                    hex = '#9400d3';
                    break;
                case 'deeppink':
                    hex = '#ff1493';
                    break;
                case 'deepskyblue':
                    hex = '#00bfff';
                    break;
                case 'dimgray':
                    hex = '#696969';
                    break;
                case 'dodgerblue':
                    hex = '#1e90ff';
                    break;
                case 'firebrick':
                    hex = '#b22222';
                    break;
                case 'floralwhite':
                    hex = '#fffaf0';
                    break;
                case 'forestgreen':
                    hex = '#228b22';
                    break;
                case 'fuchsia':
                    hex = '#ff00ff';
                    break;
                case 'gainsboro':
                    hex = '#dcdcdc';
                    break;
                case 'ghostwhite':
                    hex = '#f8f8ff';
                    break;
                case 'gold':
                    hex = '#ffd700';
                    break;
                case 'goldenrod':
                    hex = '#daa520';
                    break;
                case 'gray':
                    hex = '#808080';
                    break;
                case 'green':
                    hex = '#008000';
                    break;
                case 'greenyellow':
                    hex = '#adff2f';
                    break;
                case 'honeydew':
                    hex = '#f0fff0';
                    break;
                case 'hotpink':
                    hex = '#ff69b4';
                    break;
                case 'indianred':
                    hex = '#cd5c5c';
                    break;
                case 'indigo':
                    hex = '#4b0082';
                    break;
                case 'ivory':
                    hex = '#fffff0';
                    break;
                case 'khaki':
                    hex = '#f0e68c';
                    break;
                case 'lavender':
                    hex = '#e6e6fa';
                    break;
                case 'lavenderblush':
                    hex = '#fff0f5';
                    break;
                case 'lawngreen':
                    hex = '#7cfc00';
                    break;
                case 'lemonchiffon':
                    hex = '#fffacd';
                    break;
                case 'lightblue':
                    hex = '#add8e6';
                    break;
                case 'lightcoral':
                    hex = '#f08080';
                    break;
                case 'lightcyan':
                    hex = '#e0ffff';
                    break;
                case 'lightgoldenrodyellow':
                    hex = '#fafad2';
                    break;
                case 'lightgrey':
                    hex = '#d3d3d3';
                    break;
                case 'lightgreen':
                    hex = '#90ee90';
                    break;
                case 'lightpink':
                    hex = '#ffb6c1';
                    break;
                case 'lightsalmon':
                    hex = '#ffa07a';
                    break;
                case 'lightseagreen':
                    hex = '#20b2aa';
                    break;
                case 'lightskyblue':
                    hex = '#87cefa';
                    break;
                case 'lightslategray':
                    hex = '#778899';
                    break;
                case 'lightsteelblue':
                    hex = '#b0c4de';
                    break;
                case 'lightyellow':
                    hex = '#ffffe0';
                    break;
                case 'lime':
                    hex = '#00ff00';
                    break;
                case 'limegreen':
                    hex = '#32cd32';
                    break;
                case 'linen':
                    hex = '#faf0e6';
                    break;
                case 'magenta':
                    hex = '#ff00ff';
                    break;
                case 'maroon':
                    hex = '#800000';
                    break;
                case 'mediumaquamarine':
                    hex = '#66cdaa';
                    break;
                case 'mediumblue':
                    hex = '#0000cd';
                    break;
                case 'mediumorchid':
                    hex = '#ba55d3';
                    break;
                case 'mediumpurple':
                    hex = '#9370d8';
                    break;
                case 'mediumseagreen':
                    hex = '#3cb371';
                    break;
                case 'mediumslateblue':
                    hex = '#7b68ee';
                    break;
                case 'mediumspringgreen':
                    hex = '#00fa9a';
                    break;
                case 'mediumturquoise':
                    hex = '#48d1cc';
                    break;
                case 'mediumvioletred':
                    hex = '#c71585';
                    break;
                case 'midnightblue':
                    hex = '#191970';
                    break;
                case 'mintcream':
                    hex = '#f5fffa';
                    break;
                case 'mistyrose':
                    hex = '#ffe4e1';
                    break;
                case 'moccasin':
                    hex = '#ffe4b5';
                    break;
                case 'navajowhite':
                    hex = '#ffdead';
                    break;
                case 'navy':
                    hex = '#000080';
                    break;
                case 'oldlace':
                    hex = '#fdf5e6';
                    break;
                case 'olive':
                    hex = '#808000';
                    break;
                case 'olivedrab':
                    hex = '#6b8e23';
                    break;
                case 'orange':
                    hex = '#ffa500';
                    break;
                case 'orangered':
                    hex = '#ff4500';
                    break;
                case 'orchid':
                    hex = '#da70d6';
                    break;
                case 'palegoldenrod':
                    hex = '#eee8aa';
                    break;
                case 'palegreen':
                    hex = '#98fb98';
                    break;
                case 'paleturquoise':
                    hex = '#afeeee';
                    break;
                case 'palevioletred':
                    hex = '#d87093';
                    break;
                case 'papayawhip':
                    hex = '#ffefd5';
                    break;
                case 'peachpuff':
                    hex = '#ffdab9';
                    break;
                case 'peru':
                    hex = '#cd853f';
                    break;
                case 'pink':
                    hex = '#ffc0cb';
                    break;
                case 'plum':
                    hex = '#dda0dd';
                    break;
                case 'powderblue':
                    hex = '#b0e0e6';
                    break;
                case 'purple':
                    hex = '#800080';
                    break;
                case 'red':
                    hex = '#ff0000';
                    break;
                case 'rosybrown':
                    hex = '#bc8f8f';
                    break;
                case 'royalblue':
                    hex = '#4169e1';
                    break;
                case 'saddlebrown':
                    hex = '#8b4513';
                    break;
                case 'salmon':
                    hex = '#fa8072';
                    break;
                case 'sandybrown':
                    hex = '#f4a460';
                    break;
                case 'seagreen':
                    hex = '#2e8b57';
                    break;
                case 'seashell':
                    hex = '#fff5ee';
                    break;
                case 'sienna':
                    hex = '#a0522d';
                    break;
                case 'silver':
                    hex = '#c0c0c0';
                    break;
                case 'skyblue':
                    hex = '#87ceeb';
                    break;
                case 'slateblue':
                    hex = '#6a5acd';
                    break;
                case 'slategray':
                    hex = '#708090';
                    break;
                case 'snow':
                    hex = '#fffafa';
                    break;
                case 'springgreen':
                    hex = '#00ff7f';
                    break;
                case 'steelblue':
                    hex = '#4682b4';
                    break;
                case 'tan':
                    hex = '#d2b48c';
                    break;
                case 'teal':
                    hex = '#008080';
                    break;
                case 'thistle':
                    hex = '#d8bfd8';
                    break;
                case 'tomato':
                    hex = '#ff6347';
                    break;
                case 'turquoise':
                    hex = '#40e0d0';
                    break;
                case 'violet':
                    hex = '#ee82ee';
                    break;
                case 'wheat':
                    hex = '#f5deb3';
                    break;
                case 'white':
                    hex = '#ffffff';
                    break;
                case 'whitesmoke':
                    hex = '#f5f5f5';
                    break;
                case 'yellow':
                    hex = '#ffff00';
                    break;
                case 'yellowgreen':
                    hex = '#9acd32';
                    break;
                default:
                    hex = '';
            }
            return hex;
        }
        return ColorName;
}

function AddRounded(el, bk, color, sizex, sizey, top) {
    if (!sizex && !sizey)
        return;
    var i, j;
    var d = document.createElement("div");
    d.style.backgroundColor = bk;
    var lastarc = 0;
    for (i = 1; i <= sizey; i++) {
        var coverage, arc2, arc3;
        // Find intersection of arc with bottom of pixel row
        arc = Math.sqrt(1.0 - Math.sqr(1.0 - i / sizey)) * sizex;
        // Calculate how many pixels are bg, fg and blended.
        var n_bg = sizex - Math.ceil(arc);
        var n_fg = Math.floor(lastarc);
        var n_aa = sizex - n_bg - n_fg;
        // Create pixel row wrapper
        var x = document.createElement("div");
        var y = d;
        x.style.margin = "0px " + n_bg + "px";
        x.style.height = '1px';
        x.style.overflow = 'hidden';
        // Make a wrapper per anti-aliased pixel (at least one)
        for (j = 1; j <= n_aa; j++) {
            // Calculate coverage per pixel
            // (approximates circle by a line within the pixel)
            if (j == 1) {
                if (j == n_aa) {
                    // Single pixel
                    coverage = ((arc + lastarc) * .5) - n_fg;
                }
                else {
                    // First in a run
                    arc2 = Math.sqrt(1.0 - Math.sqr((sizex - n_bg - j + 1) / sizex)) * sizey;
                    coverage = (arc2 - (sizey - i)) * (arc - n_fg - n_aa + 1) * .5;
                    // Coverage is incorrect. Why?
                    coverage = 0;
                }
            }
            else if (j == n_aa) {
                // Last in a run
                arc2 = Math.sqrt(1.0 - Math.sqr((sizex - n_bg - j + 1) / sizex)) * sizey;
                coverage = 1.0 - (1.0 - (arc2 - (sizey - i))) * (1.0 - (lastarc - n_fg)) * .5;
            }
            else {
                // Middle of a run
                arc3 = Math.sqrt(1.0 - Math.sqr((sizex - n_bg - j) / sizex)) * sizey;
                arc2 = Math.sqrt(1.0 - Math.sqr((sizex - n_bg - j + 1) / sizex)) * sizey;
                coverage = ((arc2 + arc3) * .5) - (sizey - i);
            }

            x.style.backgroundColor = Blend(bk, color, coverage);
            if (top)
                y.appendChild(x);
            else
                y.insertBefore(x, y.firstChild);
            y = x;
            var x = document.createElement("div");
            x.style.height = '1px';
            x.style.overflow = 'hidden';
            x.style.margin = "0px 1px";
        }
        x.style.backgroundColor = color;
        if (top)
            y.appendChild(x);
        else
            y.insertBefore(x, y.firstChild);
        lastarc = arc;
    }
    if (top)
        el.insertBefore(d, el.firstChild);
    else
        el.appendChild(d);
}

function getElements(className) {
    var elements = [];
    var el = document.getElementsByTagName('DIV');
    var regexp = new RegExp("\\b" + className + "\\b");
    for (var i = 0; i < el.length; i++) {
        if (regexp.test(el[i].className))
            elements.push(el[i]);
    }
    return elements;
}

function get_current_style(element, property, not_accepted) {
    var ee, i, val, apr;
    try {
        var cs = document.defaultView.getComputedStyle(element, '');
        val = cs.getPropertyValue(property);
    }
    catch (ee) {
        if (element.currentStyle) {
            apr = property.split("-");
            for (i = 1; i < apr.length; i++) apr[i] = apr[i].toUpperCase();
            apr = apr.join("");
            val = element.currentStyle.getAttribute(apr);
        }
    }
    if ((val.indexOf("rgba") > -1 || val == not_accepted) && element.parentNode) {
        if (element.parentNode != document)
            val = get_current_style(element.parentNode, property, not_accepted);
        else
            val = '#FFFFFF';
    }
    if (val.indexOf("rgb") > -1 && val.indexOf("rgba") == -1)
        val = rgb2hex(val);
    if (val.length == 4)
        val = '#' + val.substring(1, 1) + val.substring(1, 1) + val.substring(2, 1) + val.substring(2, 1) + val.substring(3, 1) + val.substring(3, 1);
    return val;
}

function rgb2hex(value) {
    var x = 255;
    var hex = '';
    var i;
    var regexp = /([0-9]+)[, ]+([0-9]+)[, ]+([0-9]+)/;
    var array = regexp.exec(value);
    for (i = 1; i < 4; i++) hex += ('0' + parseInt(array[i]).toString(16)).slice(-2);
    return '#' + hex;
}
/* rounded corner divs javascript */


function clickButtonOnEnterKey(buttonUniqueID, e) {
    if (getKeyCode(e) == 13) {
        __doPostBack(buttonUniqueID, '');
        setKeyCodeBlank(e); 
        return false;
    }
    return true;
}

