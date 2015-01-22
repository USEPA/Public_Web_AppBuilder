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
    'jimu/BaseWidget',
    'esri/dijit/Directions',
    'esri/tasks/RouteParameters',
    'esri/request',
    'dojo/_base/lang',
    'dojo/_base/config',
    'dojo/_base/array',
    'dojo/Deferred',
    'dojo/promise/all',
    'jimu/portalUtils'
  ],
  function(declare, BaseWidget, Directions, RouteParameters,
    esriRequest, lang, dojoConfig, array, Deferred, all, portalUtils) {
    return declare([BaseWidget], {
      _dijitDirections:null,
      _routeTaskUrl: "//route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World",
      _locatorUrl: "//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
      _active: false,//save last active state

      onOpen: function(){
        this._show();
      },

      onClose: function(){
        this._hide();
      },

      onNormalize: function(){
        this._show();
      },

      onMinimize: function(){
        this._hide();
      },

      onMaximize: function(){
        this._show();
      },

      destroy: function(){
        if(this.map.activeDirectionsWidget === this._dijitDirections){
          this.map.activeDirectionsWidget = null;
        }
        this.inherited(arguments);
      },

      startup: function(){
        this.inherited(arguments);
        this.portal = portalUtils.getPortal(this.appConfig.portalUrl);

        this._preProcessConfig().then(lang.hitch(this, function(){
          var routeParams = new RouteParameters();
          var routeOptions = this.config.routeOptions;
          if(routeOptions){
            if(routeOptions.directionsLanguage){
              routeParams.directionsLanguage = routeOptions.directionsLanguage;
            }
            else{
              routeParams.directionsLanguage = dojoConfig.locale || "en_us";
            }
            routeParams.directionsLengthUnits = routeOptions.directionsLengthUnits;
            routeParams.directionsOutputType = routeOptions.directionsOutputType;
            if(routeOptions.impedanceAttribute){
              routeParams.impedanceAttribute = routeOptions.impedanceAttribute;
            }
          }

          this._dijitDirections = new Directions({
            map: this.map,
            geocoderOptions: this.config.geocoderOptions,
            routeParams: routeParams,
            routeTaskUrl: this.config.routeTaskUrl,
            dragging: true,
            showClearButton: true
          });
          this._dijitDirections.placeAt(this.directionController);
          this._dijitDirections.startup();
          this._dijitDirections.deactivate();
          this._storeLastActiveState();
        }), lang.hitch(this, function(err){
          console.error(err);
        }));
      },

      _preProcessConfig:function(){
        if(!this.config.geocoderOptions){
          this.config.geocoderOptions = {};
        }
        if(!(this.config.geocoderOptions.geocoders &&
         this.config.geocoderOptions.geocoders.length > 0)){
          this.config.geocoderOptions.geocoders = [{
            url: '',
            placeholder: ''
          }];
        }

        var def = new Deferred();
        all([this._getRouteTaskUrl(),this._getLocatorUrl()]).then(lang.hitch(this,function(results){
          this.config.routeTaskUrl = results[0];
          var geocodeArgs = this.config.geocoderOptions.geocoders[0];
          geocodeArgs.url = results[1];
          esriRequest({
            url: geocodeArgs.url,
            hanleAs:'json',
            content:{
              f:'json'
            },
            callbackParamName:'callback'
          }).then(lang.hitch(this, function(geocodeMeta){
            geocodeArgs.singleLineFieldName = geocodeMeta.singleLineAddressField &&
             geocodeMeta.singleLineAddressField.name || '';
            geocodeArgs.name = geocodeMeta.serviceDescription || '';
            def.resolve();
          }), lang.hitch(this, function(err){
            console.error(err);
            def.reject();
          }));
        }), lang.hitch(this, function(err){
          console.error(err);
          def.reject();
        }));
        return def;
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

      _hide: function(){
        if(this._dijitDirections){
          this._storeLastActiveState();
          this._deactivateDirections();
        }
      },

      _show: function(){
        if(this._dijitDirections){
          this._resetByLastActiveState();
        }
      },

      _storeLastActiveState: function(){
        if(this._dijitDirections){
          this._active = this._dijitDirections.active;
        }
      },

      _resetByLastActiveState: function(){
        if(this._dijitDirections){
          if(this._active){
            this._activateDirections();
          }
          else{
            this._deactivateDirections();
          }
          this._storeLastActiveState();
        }
      },

      _activateDirections: function(){
        if(this._dijitDirections){
          if(typeof this._dijitDirections.activate === 'function'){
            this._dijitDirections.activate();
          }
        }
      },

      _deactivateDirections: function(){
        if(this._dijitDirections){
          if(typeof this._dijitDirections.deactivate === 'function'){
            this._dijitDirections.deactivate();
          }
        }
      }
      
    });
  });