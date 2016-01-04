///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define(['dojo/_base/declare',
        'dijit/_WidgetsInTemplateMixin',
        'jimu/BaseWidgetSetting',
        'esri/symbols/jsonUtils',
        'dojo/text!./SymChooser.html'],
function(declare,
        _WidgetsInTemplateMixin,
        BaseWidgetSetting,
        symbolJsonUtils,
        template) {
  return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
    //these two properties is defined in the BaseWidget
    templateString : template,
    baseClass : 'solutions-widget-batcheditor-setting',
    data : null,
    selectionSymbols : null,

    constructor : function(/*Object*/args) {
      this.data = args.data;
      this.selectionSymbols = args.selectionSymbols;
    },

    postCreate : function() {
      this.inherited(arguments);
      this.showSymbolSelector();
    },

    showSymbolSelector : function() {
      var sym = null;
      var data = this.data;

      if (this.selectionSymbols[data.id]) {
        sym = symbolJsonUtils.fromJson(this.selectionSymbols[data.id]);
      }
      if (sym === null) {
        if (data.geometryType === "esriGeometryPolygon") {
          this.symbolSelector.showByType('fill');
        } else if (data.geometryType === "esriGeometryPoint") {
          this.symbolSelector.showByType('marker');
        } else if (data.geometryType === "esriGeometryPolyline") {
          this.symbolSelector.showByType('line');
        }
      } else {
        this.symbolSelector.showBySymbol(sym);
      }

    },
    okPress : function() {
      return this.symbolSelector;
    }
  });
});