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
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/_base/query',
	'dijit/form/RadioButton',
	'dijit/form/CheckBox',
	'dijit/form/Form',
    'dojo/_base/config',
    'dojo/on',
    'dojo/Deferred',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
    'jimu/dijit/URLInput',
    'jimu/dijit/Message',
    'jimu/portalUtils',
    'dijit/form/NumberSpinner',
    'dijit/form/ValidationTextBox',
    'dijit/form/Select'
  ],
  function(declare, lang, array, html, query, RadioButton, CheckBox, Form, dojoConfig, on, Deferred,
   _WidgetsInTemplateMixin, BaseWidgetSetting, URLInput, Message, portalUtils,
    NumberSpinner, ValidationTextBox, Select) {/*jshint unused: false*/
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-StreetViewPopup-setting',
      _geomService:'http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer',


      postCreate: function(){
        this.inherited(arguments);
      },

      startup: function(){
        this.inherited(arguments);
		
		if(!this.config){
			this.config = {
				"geomService": "http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer",
				"popWidth": "800",
				"popHeight": "500",
				"symbolStyle": "diamond",
				"symbolColor": "yellow",
				"symbolSize": "20",
				"panel":"mbs",
				"gm":"0",
				"mi":"3",
				};
          return;
        }
        this.setConfig(this.config);
      },

      setConfig: function(config) {
        this.config = config;
        if(!this.config){
          return;
        }
		
		this.geomServiceUrl.set('value', this.config.geomService ||"");
		this.symbolStyle.set('value', this.config.symbolStyle);
		this.symbolColor.set('value', this.config.symbolColor);
		this.symbolSize.set('value', this.config.symbolSize);
		this.popWidth.set('value', this.config.popWidth);
		this.popHeight.set('value', this.config.popHeight);
		this.googleMapType.set('value', this.config.gm);
		this.markerImage.set('value', this.config.mi);
		
      },
      

      getConfig: function() {

        this.config.geomService = this.geomServiceUrl.get('value');
        
		this.config.popWidth = this.popWidth.get('value');
        this.config.popHeight = this.popHeight.get('value');
        this.config.symbolStyle = this.symbolStyle.get('value');
        this.config.symbolColor = this.symbolColor.get('value');
        this.config.symbolSize = this.symbolSize.get('value');
		this.config.gm = this.googleMapType.get('value');
        this.config.mi = this.markerImage.get('value');     
				
        return this.config;
      }
    });
  });