///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
define([
  'dojo/_base/declare',
  'jimu/BaseWidgetSetting',
  "dijit/_WidgetsInTemplateMixin",
  "dojo/_base/lang",
  "dojo/on",
  "dojo/dom-class",
  "dojo/text!./symbolChooserTemplate.html",
  "jimu/dijit/SymbolChooser",
  "jimu/utils",
  "esri/symbols/jsonUtils",
  "dojo/dom-construct",
  "dojo/domReady!"
], function (
  declare,
  BaseWidgetSetting,
  _WidgetsInTemplateMixin,
  lang,
  on,
  domClass,
  SymbolChooserTemplate,
  SymbolChooser,
  utils,
  jsonUtils,
  domConstruct
) {
  return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
    templateString: SymbolChooserTemplate,

    startup: function () {
      this.inherited(arguments);
    },

    postCreate: function () {
      this.own(on(this.okButton, 'click', lang.hitch(this, this._onOKButtonClicked)));
      this._createSymbolInput();
    },

    _onOKButtonClicked: function () {
      //check if ok button is enabled
      if (!domClass.contains(this.okButton, "jimu-state-disabled")) {
        this.onOkClick();
      }
    },

    onOkClick: function (evt) {
      return evt;
    },

    /**
    * This method creates symbol input settings.
    * @memberOf widgets/isolation-trace/settings/inputSymbolChooser
    */
    _createSymbolInput: function () {
      var objSymbol;
      //if symbol geometry exist
      if (this.data.defaultValue.geometryType) {
        this.data.featureSetMode = 'draw';
        objSymbol = {};
        // if symbols parameter available in input parameters then takes symbol details
        // otherwise using geometry type for fetching the symbol details
        if (this.inputConfig && this.inputConfig.symbol) {
          objSymbol.symbol = jsonUtils.fromJson(this.inputConfig.symbol);
        } else {
          // if symbols parameter available in input parameters then takes symbol details
          // otherwise using geometry type for fetching the symbol details
          if (this.data.symbol) {
            objSymbol.symbol = jsonUtils.fromJson(this.data.symbol);
          } else {
            objSymbol.type = utils.getSymbolTypeByGeometryType(this.data
              .defaultValue.geometryType);
          }
        }
        this.symbolChooser = new SymbolChooser(objSymbol,
          domConstruct.create("div", {}, this.symbolData));
        this.symbolChooser.startup();
        return this.symbolChooser.getSymbol().toJson();
      }
    }
  });
});