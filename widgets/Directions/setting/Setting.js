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
  function(declare, lang, array, html, query, dojoConfig, on, Deferred,
   _WidgetsInTemplateMixin, BaseWidgetSetting, URLInput, Message, portalUtils,
    NumberSpinner, ValidationTextBox, Select) {/*jshint unused: false*/
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-directions-setting',
      _routeTaskUrl:'http://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World',
      _locatorUrl:'http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer',

      postMixInProperties: function(){
        if(!this.nls.complete){
          this.nls.complete = 'Complete';
        }
        if(!this.nls.completeNoEvents){
          this.nls.completeNoEvents = 'Complete No Events';
        }
        if(!this.nls.instructionsOnly){
          this.nls.instructionsOnly = 'Instructions Only';
        }
        if(!this.nls.standard){
          this.nls.standard = 'Standard';
        }
        if(!this.nls.summaryOnly){
          this.nls.summaryOnly = 'Summary Only';
        }
      },

      postCreate: function(){
        this.inherited(arguments);
        this.portal = portalUtils.getPortal(this.appConfig.portalUrl);
      },

      startup: function(){
        this.inherited(arguments);
        this.setConfig(this.config);
      },

      setConfig: function(config) {
        this.config = config;
        if(!this.config){
          return;
        }

        var geocoderOptions = this.config.geocoderOptions;
        if(typeof geocoderOptions === 'object'){
          this.autoComplete.checked = geocoderOptions.autoComplete === true;
          this.maxLocations.set('value', geocoderOptions.maxLocations);
          this.minCharacters.set('value', geocoderOptions.minCharacters);
          this.searchDelay.set('value', geocoderOptions.searchDelay);
          var geocoders = geocoderOptions.geocoders;
          if(geocoders && geocoders.length > 0){
            var geocodeArgs = geocoders[0];
            this.placeholder.set('value', geocodeArgs.placeholder||'');
          }
        }

        var routeOptions = this.config.routeOptions;
        if(typeof routeOptions === 'object'){
          var language = routeOptions.directionsLanguage || dojoConfig.locale || "en_us";
          this.directionsLanguage.set('value', language);
          this.directionsLengthUnits.set('value', routeOptions.directionsLengthUnits);
          this.directionsOutputType.set('value', routeOptions.directionsOutputType);
          this.impedanceAttribute.set('value', routeOptions.impedanceAttribute);
        }

        this._getRouteTaskUrl().then(lang.hitch(this, function(routeTaskUrl){
          this.routeUrl.set('value', routeTaskUrl);
        }));

        this._getLocatorUrl().then(lang.hitch(this, function(locatorUrl){
          this.locatorUrl.set('value', locatorUrl);
        }));
      },

      _getRouteTaskUrl: function(){
        var def = new Deferred();
        if(this.config.routeTaskUrl){
          def.resolve(this.config.routeTaskUrl);
        }
        else{
          this.portal.loadSelfInfo().then(lang.hitch(this, function(response){
            if(response && response.helperServices && response.helperServices.route){
              def.resolve(response.helperServices.route.url);
            }
            else{
              def.resolve(this._routeTaskUrl);
            }
          }), lang.hitch(this, function(err){
            console.error(err);
            def.resolve(this._routeTaskUrl);
          }));
        }
        return def;
      },

      _getLocatorUrl: function(){
        var def = new Deferred();
        var geocodeArgs = this.config.geocoderOptions &&
         this.config.geocoderOptions.geocoders &&
          this.config.geocoderOptions.geocoders[0];
        var url = geocodeArgs && geocodeArgs.url;
        if(url){
          def.resolve(url);
        }
        else{
          this.portal.loadSelfInfo().then(lang.hitch(this, function(response){
            if(response && response.helperServices &&
             response.helperServices.geocode &&
              response.helperServices.geocode.length > 0){
              var geocode = response.helperServices.geocode[0];
              def.resolve(geocode.url);
            }
            else{
              def.resolve(this._locatorUrl);
            }
          }), lang.hitch(this, function(err){
            console.error(err);
            def.resolve(this._locatorUrl);
          }));
        }
        return def;
      },

      getConfig: function() {
        if(!this.routeUrl.validate()){
          this._showValidationErrorTip(this.routeUrl);
          this._showParametersTip();
          return false;
        }

        if(!this.locatorUrl.validate()){
          this._showValidationErrorTip(this.locatorUrl);
          this._showParametersTip();
          return false;
        }

        if(!this.searchDelay.validate()){
          this._showValidationErrorTip(this.searchDelay);
          this._showParametersTip();
          return false;
        }

        if(!this.maxLocations.validate()){
          this._showValidationErrorTip(this.maxLocations);
          this._showParametersTip();
          return false;
        }

        if(!this.minCharacters.validate()){
          this._showValidationErrorTip(this.minCharacters);
          this._showParametersTip();
          return false;
        }

        if(!this.directionsLanguage.validate()){
          this._showValidationErrorTip(this.directionsLanguage);
          this._showParametersTip();
          return false;
        }

        this.config = {
          routeTaskUrl: this.routeUrl.get('value'),
          routeOptions: {
            directionsLanguage: this.directionsLanguage.get('value'),
            directionsLengthUnits: this.directionsLengthUnits.get('value'),
            directionsOutputType: this.directionsOutputType.get('value'),
            impedanceAttribute: this.impedanceAttribute.get('value')
          },
          geocoderOptions: {
            autoComplete: this.autoComplete.checked,
            maxLocations: this.maxLocations.get('value'),
            minCharacters: this.minCharacters.get('value'),
            searchDelay: this.searchDelay.get('value'),
            arcgisGeocoder: false,
            geocoders: [{
              url: this.locatorUrl.get('value'),
              placeholder: this.placeholder.get('value')
            }]
          }
        };

        return this.config;
      },

      _showValidationErrorTip:function(_dijit){
        if (!_dijit.validate() && _dijit.domNode) {
          if (_dijit.focusNode) {
            _dijit.focusNode.focus();
            setTimeout(lang.hitch(this, function() {
              _dijit.focusNode.blur();
            }), 100);
          }
        }
      },

      _showParametersTip: function(){
        new Message({
          message: this.nls.parametersTip
        });
      }

    });
  });