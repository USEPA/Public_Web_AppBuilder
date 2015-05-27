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
    'dojo/_base/lang',
    'dojo/on',
    "dojo/Deferred",
    "dijit/form/Select"
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    lang,
    on,
    Deferred) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-demo-setting',

      startup: function() {
	    this.inherited(arguments);
        this.setConfig(this.config);

      },


      setConfig: function(config) {
        this.config = config;
		this.AddressServiceURL.set('value', this.config.AddressURL);
		this.GridServiceURL.set('value', this.config.GridURL);
		this.GeometryServiceURL.set('value', this.config.GeometryURL);
		this.WKIDhtml.set('value', this.config.WKID);
		this.ZoomLvl.set('value', this.config.ZoomLvlconfig);

      },


      getConfig: function() {
		this.config.AddressURL = this.AddressServiceURL.get('value');
		this.config.GridURL = this.GridServiceURL.get('value');
		this.config.GeometryURL= this.GeometryServiceURL.get('value');
		this.config.WKID = this.WKIDhtml.get('value');
		this.config.ZoomLvlconfig = this.ZoomLvl.get('value');
		return this.config;
      }

    });
  });