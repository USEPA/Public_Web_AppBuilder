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

define([
    'dojo/_base/declare',
    'jimu/BaseWidgetSetting',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/_base/lang',
    'dojo/on',
    "dojo/dom-style",
    'dijit/form/NumberTextBox',
    'dijit/form/CheckBox'
  ],
  function(
    declare,
    BaseWidgetSetting,
    _WidgetsInTemplateMixin,
    lang,
    on,
    domStyle) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {

      baseClass: 'jimu-widget-overviewmap-setting',

      startup: function() {
        this.inherited(arguments);
        if (!this.config.overviewMap) {
          this.config.overviewMap = {};
        }
        this.setConfig(this.config);
        this.own(on(this.minWidth, 'change', lang.hitch(this, this.onTextBoxChange, "minWidth")));
        this.own(on(this.minHeight, 'change', lang.hitch(this, this.onTextBoxChange, "minHeight")));
        this.own(on(this.maxWidth, 'change', lang.hitch(this, this.onTextBoxChange, "maxWidth")));
        this.own(on(this.maxHeight, 'change', lang.hitch(this, this.onTextBoxChange, "maxHeight")));
      },

      onTextBoxChange: function(type, newValue){
        if(!newValue){
          newValue = 0;
        }
        if(type === "minWidth"){
          domStyle.set(this.minDiv, "width", newValue + "px");
        }else if(type === "minHeight"){
          domStyle.set(this.minDiv, "height", newValue + "px");
        }else if(type === "maxWidth"){
          domStyle.set(this.maxDiv, "width", newValue + "px");
        }else if(type === "maxHeight"){
          domStyle.set(this.maxDiv, "height", newValue + "px");
        }
      },

      setConfig: function(config) {
        this.config = config;
        this.visibleCheckbox.set('checked', config.overviewMap.visible);
        if (config.minWidth) {
          this.minWidth.set('value', config.minWidth);
        }
        if (config.minHeight) {
          this.minHeight.set('value', config.minHeight);
        }
        if (config.maxWidth) {
          this.maxWidth.set('value', config.maxWidth);
        }
        if (config.maxHeight) {
          this.maxHeight.set('value', config.maxHeight);
        }
      },

      getConfig: function() {
        this.config.overviewMap.visible = this.visibleCheckbox.checked;
        this.config.minWidth = parseInt(this.minWidth.get('value'), 10);
        this.config.minHeight = parseInt(this.minHeight.get('value'), 10);
        this.config.maxWidth = parseInt(this.maxWidth.get('value'), 10);
        this.config.maxHeight = parseInt(this.maxHeight.get('value'), 10);
        return this.config;
      }


    });
  });