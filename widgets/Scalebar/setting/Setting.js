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
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
    'jimu/portalUtils',
    'dojo/_base/lang',
    'dojo/on',
    "dojo/Deferred",
    "dijit/form/Select"
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    PortalUtils,
    lang,
    on,
    Deferred) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-scalebar-setting',

      startup: function() {
        this.inherited(arguments);
        if (!this.config.scalebar) {
          this.config.scalebar = {};
        }
        this.setConfig(this.config);

        this.own(on(this.selectUnit, "change", lang.hitch(this, this.onSelectChange)));
        this.own(on(this.selectStype, "change", lang.hitch(this, this.onSelectChange)));
      },

      _processConfig: function(configJson) {
        var def = new Deferred();
        if (configJson.scalebarUnit && configJson.scalebarStyle) {
          def.resolve(configJson);
        } else {
          PortalUtils.getUnits(this.appConfig.portalUrl).then(lang.hitch(this, function(units) {
            configJson.scalebarUnit = units === 'english' ? 'english' : 'metric';
            def.resolve(configJson);
          }));
        }

        return def.promise;
      },

      setConfig: function(config) {
        this.config = config;

        this._processConfig(config.scalebar).then(lang.hitch(this, function(scalebar) {
          if (scalebar.scalebarUnit) {
            this.selectUnit.set('value', scalebar.scalebarUnit);
          } else {
            this.selectUnit.set('value', "english");
          }
          if (scalebar.scalebarStyle) {
            this.selectStype.set('value', scalebar.scalebarStyle);
          } else {
            this.selectStype.set('value', "line");
          }
        }));
      },

      onSelectChange: function() {
        if (this.selectUnit.value === "dual") {
          this.selectStype.set('value', "line");
        }
      },

      getConfig: function() {
        this.config.scalebar.scalebarUnit = this.selectUnit.value;
        this.config.scalebar.scalebarStyle = this.selectStype.value;
        return this.config;
      }

    });
  });