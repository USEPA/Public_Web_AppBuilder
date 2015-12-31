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
/**
 * Stream widget panel.
 * @module widgets/Stream/FilterItem
 */
define(['dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/on',
  'dojo/json',
  'dojo/dom-style',
  'dojo/dom-construct',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dojo/text!./FilterItem.html',
  'jimu/dijit/CheckBox',
  'dijit/form/RadioButton',
  'jimu/dijit/FilterParameters',
  'jimu/filterUtils',
  'jimu/utils'
],
function(declare, lang, on, JSON, domStyle, domConstruct, _WidgetBase, _TemplatedMixin, template,
  CheckBox, RadioButton, FilterParameters, FilterUtils, utils) {
  return /**@alias module:widgets/Stream/FilterItem */ declare([_WidgetBase, _TemplatedMixin], {
    baseClass: 'jimu-widget-stream-filterItem',
    templateString: template,
    streamLayer: null,
    config: null,
    type: null, // 'checkbox' or 'radio'
    checked: false,
    uid: '',
    index: 0,
    askForValues: true,

    postCreate: function() {
      this.inherited(arguments);

      this._init();
    },

    _init: function(){
      var controlDiv, layerDefinition;
      //create control
      if(this.type === 'checkbox'){
        this.control = new CheckBox({
          checked: this.checked,
          label: this.config.name,
          onChange: lang.hitch(this, this._checkBoxChange)
        });
        this.control.placeAt(this.controlSection);
      }else if(this.type === 'radio'){
        controlDiv = domConstruct.create('div', {}, this.controlSection);
        this.control = new RadioButton({
          checked: this.checked,
          value: this.config.name,
          name: this.uid + '_attFilterItem',
          id: this.uid + '_attFilterItem_' + this.index
        });
        this.own(on(this.control, 'change', lang.hitch(this, function(checked){
          this._checkBoxChange(checked);
        })));
        this.control.placeAt(controlDiv);

        domConstruct.create('label', {
          'class': 'jimu-widget-normal',
          innerHTML: utils.sanitizeHTML(this.config.name),
          'for': this.uid + '_attFilterItem_' + this.index
        }, controlDiv);
      }

      //create filter content
      this.attrParamsDijit = new FilterParameters();
      this.attrParamsDijit.placeAt(this.attrFilterParams);
      this.attrParamsDijit.startup();

      layerDefinition = JSON.parse(this.streamLayer._json);
      this.attrParamsDijit.build(this.streamLayer.url, layerDefinition,
        this.config.filterInfo);

      var filterUtils = new FilterUtils();
      this.askForValues = filterUtils.isAskForValues(this.config.filterInfo);

      if(this.askForValues){
        //bind event to apply button
        this.own(on(this.applyAttrFilterBtn, 'click', lang.hitch(this, this._applyFilter)));
      }else{
        domStyle.set(this.applyAttrFilterBtn, 'display', 'none');
      }
    },

    unCheck: function(){
      if(this.type === 'checkbox'){
        this.control.setValue(false);
      }else if(this.type === 'radio'){
        this.control.set('checked', false);
      }
      domStyle.set(this.filterSection, 'display', 'none');
    },

    _applyFilter: function(){
      var whereClause = this.attrParamsDijit.getFilterExpr();
      if(whereClause && typeof whereClause === 'string'){
        this.streamLayer.setDefinitionExpression(whereClause);
        this.streamLayer.clear();
      }
    },

    _checkBoxChange: function(checked){
      if(!checked){
        domStyle.set(this.filterSection, 'display', 'none');

        if(this.type === 'checkbox' && this.streamLayer){
          this.streamLayer.setDefinitionExpression(null);
        }
      }else{
        if(this.askForValues){
          //show filter section if filter asks for value
          domStyle.set(this.filterSection, 'display', '');
        }else{
          //apply attribute filter directly
          this._applyFilter();
        }
      }
    }
  });
});
