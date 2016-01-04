/*global define */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true,indent:4 */
/** @license
| Copyright 2013 Esri
|
| Licensed under the Apache License, Version 2.0 (the "License");
| you may not use this file except in compliance with the License.
| You may obtain a copy of the License at
|
|    http://www.apache.org/licenses/LICENSE-2.0
|
| Unless required by applicable law or agreed to in writing, software
| distributed under the License is distributed on an "AS IS" BASIS,
| WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
| See the License for the specific language governing permissions and
| limitations under the License.
*/
//============================================================================================================================//
define([
  "dojo/_base/declare",
  "dojo/text!./summarySetting.html",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dojo/dom-class",
  "dojo/dom-construct",
  "dojo/_base/lang",
  "dojo/on",
  "dojo/dom-attr",
  "dojo/dom",
  'dijit/Editor',
  'dojo/_base/html',
  "dojo/_base/array",
  "jimu/dijit/Message",
  "dijit/_editor/plugins/TextColor"
], function (
  declare,
  summarySetting,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  domClass,
  domConstruct,
  lang,
  on,
  domAttr,
  dom,
  Editor,
  html,
  array,
  Message
) {
  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    templateString: summarySetting,
    _selectedOutputParameter: null, // to store selected output parameter
    _inputOutputSelect: null, // to store input parameter control
    _operatorSelect: null, // to store operator parameter control
    _fieldSelect: null, // to store field parameter control
    _inputOutputParamArray: [], // to store input output parameter Array
    _selectedInput: null, // to store input option object evt
    _selectedOutput: null, // to store output option object evt
    _selectedField: null, // to store feild option object evt
    _selectedOperator: null, // to store operator option object evt
    _summaryExpressionEditor: null, // to store object of summary expression editor
    _editorObj: null, // to store editor object
    _outputLayerSettingsArr: [], // to store settings of output configuration
    _selectedOutputGeometryType: null, // to store geometry type of selected output

    postCreate: function () {
      this._initEditor();
      this.inherited(arguments);
    },

    startup: function () {
      this.inherited(arguments);
    },

    /**
    * This function is used to init dojo editor
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    **/
    _initEditor: function () {
      if (!this._editorObj) {
        this._editorObj = new Editor({
          plugins: [
            "bold", "italic", "underline", "|", "cut", "copy",
            "paste", "|", "foreColor"
          ]
        }, this.editorContainer);
        html.setStyle(this._editorObj.domNode, {
          "width": '100%',
          "height": '100%'
        });
        this.own(on(this._editorObj, "focus", lang.hitch(this,
          function () {
            domClass.remove(this.verifySummaryExpression,
              "jimu-state-disabled");
          })));
        this.own(on(this._editorObj, "blur", lang.hitch(this,
          function () {
            var editorText, regExp;
            editorText = this._editorObj.focusNode.innerHTML;
            editorText = editorText.replace(/&nbsp;/g, '');
            regExp = new RegExp("<div><br></div>", 'g');
            editorText = editorText.replace(regExp, "");
            regExp = new RegExp("<p><br></p>", 'g');
            editorText = editorText.replace(regExp, "");
            regExp = new RegExp("<p></p>", 'g');
            editorText = editorText.replace(regExp, "");
            editorText = editorText.replace(/<br>/g, "");
            editorText = lang.trim(editorText);

            if ((editorText === null) || (editorText === "")) {
              this._editorObj.set("value", "");
              domClass.add(this.verifySummaryExpression,
                "jimu-state-disabled");
            } else {
              domClass.remove(this.verifySummaryExpression,
                "jimu-state-disabled");
            }
          })));

        this._editorObj.onLoadDeferred.then(lang.hitch(this, function () {
          if ((this._editorObj) && (this._editorObj.hasOwnProperty(
              'editNode'))) {
            if ("title" in this._editorObj.editNode) {
              if (this._editorObj.editNode.title === null ||
                this._editorObj.editNode.title === "") {
                this._editorObj.editNode.title = this.nls.summaryTab
                  .summaryEditorText;
              }
            }
          }
        }));

        this._editorObj.startup();
      }
    },

    /**
    * This function is used to display input & output parameter
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    **/
    displayInputOutputParameters: function () {
      domConstruct.empty(this.inputOutputParameterPanel);
      this._displayInputOutputPanelParameters();
      this._regainExistingConfigurationData();
    },

    /**
    * This function is used to regain existing configuration settings.
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    **/
    _regainExistingConfigurationData: function () {
      if (this.config.summaryExpression) {
        this._editorObj.focus();
        this._editorObj.set("value", this.config.summaryExpression.summaryExpressionValue);
        if (this.config.summaryExpression.summaryExpressionValue ===
          null || this.config.summaryExpression.summaryExpressionValue ===
          "") {
          domClass.add(this.verifySummaryExpression,
            "jimu-state-disabled");
        } else {
          domClass.remove(this.verifySummaryExpression,
            "jimu-state-disabled");
        }
      }
    },

    /**
    * This function used to add parameter in input output panel
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    */
    _displayInputOutputPanelParameters: function () {
      var inputOption, i;
      this._inputOutputParamArray = [];
      this._inputOutputSelect = domConstruct.create("select", {
        "class": "esriCTPanelSelect",
        "size": 2
      }, this.inputOutputParameterPanel);
      for (i = 0; i < this.inputParametersArray.length; i++) {
        inputOption = domConstruct.create("option", {});
        inputOption.innerHTML = this.inputParametersArray[i].name;
        inputOption.value = this.inputParametersArray[i].name;
        inputOption.title = this.inputParametersArray[i].name;
        domAttr.set(inputOption, "Type", "Input");
        this._inputOutputSelect.appendChild(inputOption);
        domClass.add(inputOption, "esriCTInputOutputOptions");
        this._inputOutputParamArray.push(this.inputParametersArray[i]);
      }
      for (i = 0; i < this.outputParametersArray.length; i++) {
        inputOption = domConstruct.create("option", {});
        inputOption.innerHTML = this.outputParametersArray[i].name;
        inputOption.value = this.outputParametersArray[i].name;
        inputOption.title = this.outputParametersArray[i].name;
        domAttr.set(inputOption, "Type", "Output");
        if (this.outputParametersArray[i] && this.outputParametersArray[
            i].defaultValue && this.outputParametersArray[i].defaultValue
          .geometryType) {
          domAttr.set(inputOption, "GeometryType", this.outputParametersArray[
            i].defaultValue.geometryType);
        } else {
          domAttr.set(inputOption, "GeometryType", null);
        }
        this._inputOutputSelect.appendChild(inputOption);
        domClass.add(inputOption, "esriCTInputOutputOptions");
        this._inputOutputParamArray.push(this.outputParametersArray[i]);
      }
      domAttr.set(this._inputOutputSelect, "size", this._inputOutputParamArray
        .length);
      this._onInputOutputClick();
      this._insertBlankSelectInFieldPanel();
      this._insertBlankSelectInOperatorPanel();
      this._allocateEqualSizeToPanels();
    },

    /**
    * This function is used to insert blank options in field panel
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    */
    _insertBlankSelectInFieldPanel: function () {
      var fieldOption;
      this._fieldSelect = domConstruct.create("select", {
        "class": "esriCTFieldPanelSelect",
        "size": 2
      }, this.fieldPanel);
      fieldOption = domConstruct.create("option", {});
      fieldOption.innerHTML = "";
      domAttr.set(fieldOption, "disabled", true);
      this._fieldSelect.appendChild(fieldOption);
      domClass.add(fieldOption, "esriCTBlankOptions");
    },

    /**
    * This function is used to insert blank options in field panel
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    */
    _insertBlankSelectInOperatorPanel: function () {
      var operatorOption;
      this._operatorSelect = domConstruct.create("select", {
        "class": "esriCTOperatorPanelSelect",
        "size": 2
      }, this.operatorPanel);
      operatorOption = domConstruct.create("option", {});
      operatorOption.innerHTML = "";
      domAttr.set(operatorOption, "disabled", true);
      this._operatorSelect.appendChild(operatorOption);
      domClass.add(operatorOption, "esriCTBlankOptions");
    },

    /**
    * This function is used to empty field panel
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    */
    _emptyFieldPanel: function () {
      domConstruct.empty(this.fieldPanel);
      this._fieldSelect = null;
    },

    /**
    * This function is used to empty operator panel
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    */
    _emptyOperatorPanel: function () {
      domConstruct.empty(this.operatorPanel);
      this._operatorSelect = null;
    },

    /**
    * This function is used to display input/output operators
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    */
    _onInputOutputClick: function () {
      var type, taskDataContainer;
      this.own(on(this._inputOutputSelect, "click", lang.hitch(this,
        function (evt) {
          type = domAttr.get(evt.currentTarget[evt.currentTarget
            .selectedIndex], "Type");
          if (type === "Input") {
            domClass.add(this.addSummaryExpression,
              "jimu-state-disabled");
            taskDataContainer = dom.byId("taskDataContainerId");
            taskDataContainer.scrollTop = 0;
            this._selectedInput = this._selectedOutput = this._selectedField =
              this._selectedOperator = null;
            this._selectedInput = evt.currentTarget[evt.currentTarget
              .selectedIndex];
            this._emptyFieldPanel();
            this._emptyOperatorPanel();
            this._insertBlankSelectInFieldPanel();
            this._displayOperators(true, false, false, false);
            domClass.remove(this.operatorPanel, "esriCTHidden");
          } else if (type === "Output") {
            this._selectedOutputGeometryType = domAttr.get(evt.currentTarget[
              evt.currentTarget
              .selectedIndex], "GeometryType");
            taskDataContainer = dom.byId("taskDataContainerId");
            taskDataContainer.scrollTop = 0;
            this._selectedInput = this._selectedOutput = this._selectedField =
              this._selectedOperator = null;
            this._selectedOutput = evt.currentTarget[evt.currentTarget
              .selectedIndex];
            this._selectedOutputParameter = evt;
            this._emptyFieldPanel();
            this._emptyOperatorPanel();
            this._displayOutputFields();
            this._fetchAndDisplayOutputOperators();
          }
        })));
    },

    /**
    * This function is used to fetch & display output operators
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    */
    _fetchAndDisplayOutputOperators: function () {
      domClass.add(this.addSummaryExpression,
        "jimu-state-disabled");
      if (this._selectedOutputGeometryType !== "esriGeometryPoint") {
        this._displayOperators(false, true, false, false);
      } else {
        this._outputLayerSettingsArr = [];
        if (this.outputSettingArray) {
          array.forEach(this.outputSettingArray, lang.hitch(
            this,
            function (widgetNode) {
              if (widgetNode) {
                this._outputLayerSettingsArr.push(
                  widgetNode.getOutputForm());
              }
            }));
        }
        for (var i = 0; i < this._outputLayerSettingsArr.length; i++) {
          if (this._outputLayerSettingsArr[i].paramName ===
            this._selectedOutput.value) {
            if (this._outputLayerSettingsArr[i].bypassDetails
              .skipable) {
              this._displayOperators(false, true, false,
                true);
            } else {
              this._displayOperators(false, true, false,
                false);
            }
            break;
          }
        }
      }
      this._fieldSelect.selectedIndex = "-1";
    },

    /**
    * This function is used to display fields
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    */
    _displayOutputFields: function () {
      var fieldOption, i, fieldOptionArray = [];
      domConstruct.empty(this.fieldPanel);
      fieldOptionArray = this._inputOutputParamArray[this._selectedOutputParameter
        .currentTarget.selectedIndex].defaultValue.fields;
      this._fieldSelect = domConstruct.create("select", {
        "class": "esriCTFieldPanelSelect"
      }, this.fieldPanel);
      for (i = 0; i < fieldOptionArray.length; i++) {
        if (fieldOptionArray[i].type === "esriFieldTypeDouble" ||
          fieldOptionArray[i].type === "esriFieldTypeSmallInteger" ||
          fieldOptionArray[i].type === "esriFieldTypeInteger") {
          fieldOption = domConstruct.create("option", {});
          fieldOption.innerHTML = fieldOptionArray[i].name;
          fieldOption.value = fieldOptionArray[i].name;
          fieldOption.title = fieldOptionArray[i].name;
          this._fieldSelect.appendChild(fieldOption);
          domClass.add(fieldOption, "esriCTInputOutputOptions");
        }
      }
      this._onFieldClick();
      this._allocateEqualSizeToPanels();
    },

    /**
    * This function is used to display fields operator
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    */
    _onFieldClick: function () {
      this.own(on(this._fieldSelect, "click", lang.hitch(this,
        function (evt) {
          domClass.add(this.addSummaryExpression,
            "jimu-state-disabled");
          this._selectedField = null;
          this._selectedField = evt.currentTarget[evt.currentTarget
            .selectedIndex];
          this._displayOperators(false, false, true, false);
          this._allocateEqualSizeToPanels();
        })));
    },

    /**
    * This function is used to display input/output/field operator
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    */
    _displayOperators: function (inputOperator, outputOperator,
      fieldOperator, displayOutputSkipCountOption) {
      var operatorOption, i, operatorParameterArray;
      operatorParameterArray = [];
      domConstruct.empty(this.operatorPanel);
      if (inputOperator) {
        operatorParameterArray.push(this.nls.summaryTab.inputOperatorCountOption);
      } else if (outputOperator) {
        operatorParameterArray.push(this.nls.summaryTab.outputOperatorCountOption);
        if (displayOutputSkipCountOption) {
          operatorParameterArray.push(this.nls.summaryTab.outputOperatorSkipCountOption);
        }
      } else if (fieldOperator) {
        operatorParameterArray.push(this.nls.summaryTab.fieldOperatorSumOption);
        operatorParameterArray.push(this.nls.summaryTab.fieldOperatorMinOption);
        operatorParameterArray.push(this.nls.summaryTab.fieldOperatorMaxOption);
        operatorParameterArray.push(this.nls.summaryTab.fieldOperatorMeanOption);
      }
      this._operatorSelect = domConstruct.create("select", {
        "class": "esriCTPanelSelect",
        "size": 2
      }, this.operatorPanel);
      for (i = 0; i < operatorParameterArray.length; i++) {
        operatorOption = domConstruct.create("option", {});
        operatorOption.innerHTML = operatorParameterArray[i];
        operatorOption.value = operatorParameterArray[i];
        operatorOption.title = operatorParameterArray[i];
        this._operatorSelect.appendChild(operatorOption);
        domClass.add(operatorOption, "esriCTInputOutputOptions");
      }
      this._selectOperator();
      this._allocateEqualSizeToPanels();
    },

    /**
    * This function is used to refresh operator list
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    */
    refreshOperator: function () {
      if (!this._selectedField) {
        if (this._selectedOutput) {
          this._fetchAndDisplayOutputOperators();
          if (this._selectedOperator && (this._selectedOperator.value ===
            this.nls.summaryTab.outputOperatorCountOption)) {
            if (this._operatorSelect) {
              this._operatorSelect.selectedIndex = 0;
              domClass.remove(this.addSummaryExpression,
              "jimu-state-disabled");
            }
          }
        }
      }
    },

    /**
    * This function is used to select operator
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    */
    _selectOperator: function () {
      this.own(on(this._operatorSelect, "click", lang.hitch(this,
        function (evt) {
          this._selectedOperator = null;
          this._selectedOperator = evt.currentTarget[evt.currentTarget
            .selectedIndex];
          if ((this._selectedInput !== null || this._selectedOutput !==
              null) && this._selectedOperator !== null) {
            domClass.remove(this.addSummaryExpression,
              "jimu-state-disabled");
          }
        })));
    },

    /**
    * This function is used to get max length of parameters of inputOutput/field/operator parameters
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    */
    _allocateEqualSizeToPanels: function () {
      var inputOutputPanelLength, fieldPanelLength,
        operatorPanelLength, selectSize;
      inputOutputPanelLength = 0;
      fieldPanelLength = 0;
      operatorPanelLength = 0;
      if (this._inputOutputSelect && this._inputOutputSelect.length >
        0) {
        inputOutputPanelLength = this._inputOutputSelect.length;
      }
      if (this._fieldSelect && this._fieldSelect.length > 0) {
        fieldPanelLength = this._fieldSelect.length;
      }
      if (this._operatorSelect && this._operatorSelect.length > 0) {
        operatorPanelLength = this._operatorSelect.length;
      }
      selectSize = Math.max(inputOutputPanelLength, fieldPanelLength,
        operatorPanelLength);
      if (this._inputOutputSelect) {
        domAttr.set(this._inputOutputSelect, "size", selectSize);
      }
      if (this._fieldSelect) {
        domAttr.set(this._fieldSelect, "size", selectSize);
      }
      if (this._operatorSelect) {
        domAttr.set(this._operatorSelect, "size", selectSize);
      }
      this._removeClassFromChildNodes();
      if (this._inputOutputSelect && (this._inputOutputSelect.length ===
          selectSize)) {
        domClass.add(this._inputOutputSelect.childNodes[selectSize -
          1], "esriCTInputOutputOptionsBorderNone");
      }
      if (this._fieldSelect && (this._fieldSelect.length ===
          selectSize)) {
        domClass.add(this._fieldSelect.childNodes[selectSize - 1],
          "esriCTInputOutputOptionsBorderNone");
      }
      if (this._operatorSelect && (this._operatorSelect.length ===
          selectSize)) {
        domClass.add(this._operatorSelect.childNodes[selectSize - 1],
          "esriCTInputOutputOptionsBorderNone");
      }
    },

    /**
    * This function is used to remove class from childnodes.
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    */
    _removeClassFromChildNodes: function () {
      var i;
      if (this._inputOutputSelect) {
        for (i = 0; i < this._inputOutputSelect.childNodes.length; i++) {
          domClass.remove(this._inputOutputSelect.childNodes[i],
            "esriCTInputOutputOptionsBorderNone");
        }
      }
      if (this._fieldSelect) {
        for (i = 0; i < this._fieldSelect.childNodes.length; i++) {
          domClass.remove(this._fieldSelect.childNodes[i],
            "esriCTInputOutputOptionsBorderNone");
        }
      }
      if (this._operatorSelect) {
        for (i = 0; i < this._operatorSelect.childNodes.length; i++) {
          domClass.remove(this._operatorSelect.childNodes[i],
            "esriCTInputOutputOptionsBorderNone");
        }
      }
    },

    /**
    * This function is used to add expression in textarea
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    */
    _onClickAddExpressionBtn: function () {
      if (!(domClass.contains(this.addSummaryExpression,
          "jimu-state-disabled"))) {
        var verifyFlag = false;
        if (this._selectedInput !== null && this._selectedOperator !==
          null) {
          this._editorObj.focus();
          this._editorObj.execCommand("inserthtml", "{" + this._selectedInput
            .value + ":" + this._selectedOperator.value + "}");
          verifyFlag = true;
        } else if ((this._selectedOutput !== null && this._selectedField ===
            null) && this._selectedOperator !== null) {
          this._editorObj.focus();
          this._editorObj.execCommand("inserthtml", "{" + this._selectedOutput
            .value + ":" + this._selectedOperator.value + "}");
          verifyFlag = true;
        } else if ((this._selectedOutput !== null && this._selectedField !==
            null) && this._selectedOperator !== null) {
          this._editorObj.focus();
          this._editorObj.execCommand("inserthtml", "{" + this._selectedOutput
            .value + ":" + this._selectedField.value + ":" + this._selectedOperator
            .value + "}");
          verifyFlag = true;
        }
        if (verifyFlag === true && (domClass.contains(this.verifySummaryExpression,
            "jimu-state-disabled"))) {
          domClass.remove(this.verifySummaryExpression,
            "jimu-state-disabled");
        }
      }
    },

    /**
    * This function is used to verify expression of textarea
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    */
    _onClickVerifyExpressionBtn: function () {
      if (!(domClass.contains(this.verifySummaryExpression,
          "jimu-state-disabled"))) {
        this.validateExpression(true);
      }
    },

    /**
    * This function display error message in jimu alert box.
    * @param {string} err gives the error message
    * @memberOf widgets/isolation-trace/settings/settings
    **/
    _errorMessage: function (err) {
      var errorMessage = new Message({
        message: err
      });
      errorMessage.message = err;
    },

    /**
    * This function is used to get configuration data.
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    **/
    getSummaryExpressionConfigData: function () {
      var obj;
      obj = {};
      obj.summaryExpressionValueArr = [];
      obj.summaryExpressionValue = this._editorObj.value;
      obj.summaryExpressionValue.replace(/\{(.+?)\}/g, function (_, m) { // jshint ignore:line
        var expressionObj = {};
        expressionObj.value = m;
        expressionObj.trimmedValue = m.replace(/\s/g, "");
        obj.summaryExpressionValueArr.push(expressionObj);
      });
      obj.summaryExpressionTrimmedValue = this._getSummaryExpressionFilteredValue(
        obj.summaryExpressionValueArr);
      obj.summaryExpressionNLS = this.nls.summaryTab;
      return obj;
    },

    /**
    * This function is used to trim white spaces in valid expression
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    **/
    _getSummaryExpressionFilteredValue: function (replaceValueArr) {
      var i, expressionValue, regExp;
      expressionValue = this._editorObj.value;
      for (i = 0; i < replaceValueArr.length; i++) {
        regExp = new RegExp(replaceValueArr[i].value, 'g');
        expressionValue = expressionValue.replace(regExp,
          replaceValueArr[i].trimmedValue);
      }
      return expressionValue;
    },

    /**
    * This function is used to validate expression on OK button
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    **/
    validateExpressionOnOkClick: function () {
      var errObj = this.validateExpression(false);
      return errObj;
    },

    /**
    * This function is used to validate each expressions entry
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    **/
    _validateExpressionEntry: function (expressionArray) {
      var entryMatched, i, expressionItemArr, j;
      for (i = 0; i < expressionArray.length; i++) {
        expressionItemArr = expressionArray[i].split(":");
        for (j = 0; j < expressionItemArr.length; j++) {
          if (j === 0) {
            entryMatched = this._validateInputOutputEntry(
              expressionItemArr[0]);
            if (!entryMatched) {
              return false;
            }
          } else if (j === 1 && expressionItemArr.length === 2) {
            entryMatched = this._validateInputOutputOperatorEntry(
              expressionItemArr[0], expressionItemArr[1]);
            if (!entryMatched) {
              return false;
            }
          } else if (j === 1 && expressionItemArr.length === 3) {
            entryMatched = this._validateFieldEntry(expressionItemArr[
              0], expressionItemArr[1]);
            if (!entryMatched) {
              return false;
            }
          } else if (j === 2 && expressionItemArr.length === 3) {
            entryMatched = this._validateFieldOperatorEntry(
              expressionItemArr[2]);
            if (!entryMatched) {
              return false;
            }
          }
        }
      }
      return true;
    },

    /**
    * This function is used to validate each expressions input & output entry
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    **/
    _validateInputOutputEntry: function (expressionItem) {
      var i, entryMatched;
      entryMatched = false;
      for (i = 0; i < this.inputParametersArray.length; i++) {
        if (expressionItem === this.inputParametersArray[i].name) {
          entryMatched = true;
        }
      }
      for (i = 0; i < this.outputParametersArray.length; i++) {
        if (expressionItem === this.outputParametersArray[i].name) {
          entryMatched = true;
        }
      }
      return entryMatched;
    },

    /**
    * This function is used to validate each expressions input & output operator entry
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    **/
    _validateInputOutputOperatorEntry: function (inputOutputEntry,
      expressionItem) {
      var i, entryMatched;
      entryMatched = false;
      this._outputLayerSettingsArr = [];
      if (this.outputSettingArray) {
        array.forEach(this.outputSettingArray, lang.hitch(this,
          function (widgetNode) {
            if (widgetNode) {
              this._outputLayerSettingsArr.push(widgetNode.getOutputForm());
            }
          }));
      }
      for (i = 0; i < this._outputLayerSettingsArr.length; i++) {
        if (this._outputLayerSettingsArr[i].paramName ===
          inputOutputEntry) {
          if (this._outputLayerSettingsArr[i].bypassDetails.skipable) {
            if ((expressionItem === this.nls.summaryTab.outputOperatorCountOption) ||
              (expressionItem === this.nls.summaryTab.outputOperatorSkipCountOption)
            ) {
              entryMatched = true;
            }
          } else {
            if (expressionItem === this.nls.summaryTab.outputOperatorCountOption) {
              entryMatched = true;
            }
          }
          break;
        }
      }
      if (!entryMatched) {
        for (i = 0; i < this.inputParametersArray.length; i++) {
          if (this.inputParametersArray[i].name === inputOutputEntry) {
            if (expressionItem === this.nls.summaryTab.inputOperatorCountOption) {
              entryMatched = true;
            }
            break;
          }
        }
      }
      return entryMatched;
    },

    /**
    * This function is used to validate each expressions field entry
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    **/
    _validateFieldEntry: function (layerName, fieldName) {
      var entryMatched = false;
      for (var i = 0; i < this._inputOutputParamArray.length; i++) {
        if (layerName === this._inputOutputParamArray[i].name) {
          for (var j = 0; j < this._inputOutputParamArray[i].defaultValue
            .fields.length; j++) {
            if (fieldName === this._inputOutputParamArray[i].defaultValue
              .fields[j].name) {
              entryMatched = true;
            }
          }
        }
      }
      return entryMatched;
    },

    /**
    * This function is used to validate each expressions field operator entry
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    **/
    _validateFieldOperatorEntry: function (expressionItem) {
      var entryMatched = false;
      if ((expressionItem === this.nls.summaryTab.fieldOperatorSumOption) ||
        (expressionItem === this.nls.summaryTab.fieldOperatorMinOption) ||
        (expressionItem === this.nls.summaryTab.fieldOperatorMaxOption) ||
        (expressionItem === this.nls.summaryTab.fieldOperatorMeanOption)
      ) {
        entryMatched = true;
      }
      return entryMatched;
    },

    /**
    * This function is used to validate expression on click of OK/Verify button
    * @memberOf widgets/NetworkTrace/settings/summarySettings
    **/
    validateExpression: function (isVerifyBtnClicked) {
      var expression, expressionArray, trimmedString,
        validExp;
      expressionArray = [];
      expression = this._editorObj.value;
      if ((expression !== "") && (expression !== null) && (
          expressionArray.length === 0)) {
        expression.replace(/\{(.+?)\}/g, function (_, m) { // jshint ignore:line
          trimmedString = m.replace(/\s/g, "");
          expressionArray.push(trimmedString);
        });
        validExp = true;
      } else {
        validExp = true;
      }
      if (expressionArray.length > 0) {
        validExp = this._validateExpressionEntry(expressionArray);
      }
      if (expression.indexOf("{}") !== -1) {
        validExp = false;
      }
      if (validExp === true) {
        if (isVerifyBtnClicked) {
          this._errorMessage(this.nls.validationErrorMessage.validSummaryExpression);
        } else {
          return {
            returnErr: "",
            returnFlag: false
          };
        }
      } else {
        if (isVerifyBtnClicked) {
          this._errorMessage(this.nls.validationErrorMessage.invalidSummaryExpression);
        } else {
          return {
            returnErr: this.nls.validationErrorMessage.invalidSummaryExpression,
            returnFlag: true
          };
        }
      }
    }
  });
});