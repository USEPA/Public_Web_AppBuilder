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
    'esri/tasks/locator',
    'esri/tasks/RouteParameters',
    'esri/request',
    'esri/graphicsUtils',
    'esri/layers/ArcGISDynamicMapServiceLayer',
    'dojo/on',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/_base/array',
    'dojo/_base/config',
    'dojo/Deferred',
    'dojo/promise/all',
    'jimu/portalUtils'
  ],
  function(declare, BaseWidget, Directions, Locator, RouteParameters, esriRequest, graphicsUtils,
    ArcGISDynamicMapServiceLayer, on, lang, html, array, dojoConfig, Deferred, all,
    portalUtils) {

    return declare([BaseWidget], {
      name: 'Directions',
      baseClass: 'jimu-widget-directions',
      _dijitDirections:null,
      _routeTaskUrl: "//route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World",
      _locatorUrl: "//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
      _active: true,//save last active state
      _dijitDef: null,
      _trafficLayer: null,

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

      onDeActive: function(){
        this._deactivateDirections();
        this._enableWebMapPopup();
      },

      getDirectionsDijit: function(){
        if(!this._dijitDef){
          this._dijitDef = new Deferred();
        }
        if(this._dijitDef.isFulfilled()){
          this._dijitDef = new Deferred();
        }
        if(this._dijitDirections){
          this._dijitDef.resolve(this._dijitDirections);
        }
        return this._dijitDef;
      },

      _handlePopup: function(){
        if(this.map.activeDirectionsWidget && this.map.activeDirectionsWidget.mapClickActive){
          this._disableWebMapPopup();
        }else{
          this._enableWebMapPopup();
        }
      },

      _disableWebMapPopup:function(){
        if(this.map){
          this.map.setInfoWindowOnClick(false);
        }
      },

      _enableWebMapPopup:function(){
        if(this.map){
          this.map.setInfoWindowOnClick(true);
        }
      },

      destroy: function(){
        if(this.map.activeDirectionsWidget === this._dijitDirections){
          this.map.activeDirectionsWidget = null;
        }
        if(this._trafficLayer){
          this.map.removeLayer(this._trafficLayer);
          this._trafficLayer = null;
        }
        this._handlePopup();
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

          var options = {
            map: this.map,
            searchOptions: this.config.searchOptions,
            routeParams: routeParams,
            routeTaskUrl: this.config.routeTaskUrl,
            dragging: true,
            showClearButton: true
          };

          if(this.config.trafficLayerUrl){
            this._trafficLayer = new ArcGISDynamicMapServiceLayer(this.config.trafficLayerUrl);
            options.trafficLayer = this._trafficLayer;
            options.traffic = true;
          }else{
            options.traffic = false;
          }

          if(this.config.travelModesUrl){
            options.travelModesServiceUrl = this.config.travelModesUrl;
          }

          this._dijitDirections = new Directions(options);
          html.place(this._dijitDirections.domNode, this.directionController);
          this._dijitDirections.startup();

          this.own(on(this._dijitDirections,
                     'directions-finish',
                     lang.hitch(this, this._onDirectionsFinish)));

          this.own(on(this._dijitDirections,
                      'map-click-active',
                      lang.hitch(this, this._handlePopup)));

          this._activateDirections();
          this._storeLastActiveState();

          if(this._dijitDef && this._dijitDef.isFulfilled()){
            this._dijitDef.resolve(this._dijitDirections);
          }
        }), lang.hitch(this, function(err){
          console.error(err);
        }));
      },

      _onDirectionsFinish: function(evt){
        if(evt && evt.result){
          var routeResults = evt.result.routeResults;
          if(lang.isArrayLike(routeResults) && routeResults.length > 0){
            var routes = [];
            array.forEach(routeResults, function(routeResult){
              if(routeResult.route){
                routes.push(routeResult.route);
              }
            });
            if(routes.length > 0){
              var ext = null;
              try{
                ext = graphicsUtils.graphicsExtent(routes);
                if(ext){
                  ext = ext.expand(1.3);
                }
              }catch(e){
                console.log(e);
              }
              if(ext){
                this.map.setExtent(ext);
              }
            }
          }
        }
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

        var placeholder = this.config.geocoderOptions.geocoders[0].placeholder;

        if(!placeholder){
          if(!this.config.routeTaskUrl){
            //user doesn't open the setting page, we use the default placeholder
            placeholder = this.nls.searchPlaceholder;
          }
        }

        this.config.searchOptions = {
          enableSuggestions: this.config.geocoderOptions.autoComplete,
          maxResults: this.config.geocoderOptions.maxLocations,
          minCharacters: this.config.geocoderOptions.minCharacters,
          suggestionDelay: this.config.geocoderOptions.searchDelay,
          sources: [{
            locator: null,
            name: '',
            singleLineFieldName: '',
            outFields: ["*"],
            placeholder: placeholder
          }]
        };

        var def = new Deferred();
        all([this._getRouteTaskUrl(), this._getLocatorUrl(), this._getTravelModesUrl()]).then(
          lang.hitch(this, function(results){
          this.config.routeTaskUrl = results[0];
          var locatorUrl = results[1];
          this.config.travelModesUrl = results[2];
          esriRequest({
            url: locatorUrl,
            hanleAs:'json',
            content:{
              f:'json'
            },
            callbackParamName:'callback'
          }).then(lang.hitch(this, function(geocodeMeta){
            this.config.searchOptions.sources[0].locator = new Locator(locatorUrl);
            this.config.searchOptions.sources[0].name = geocodeMeta.serviceDescription || '';
            this.config.searchOptions.sources[0].singleLineFieldName =
             geocodeMeta.singleLineAddressField && geocodeMeta.singleLineAddressField.name || '';
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

      _getTravelModesUrl: function(){
        var def = new Deferred();
        if(this.config.travelModesUrl){
          def.resolve(this.config.travelModesUrl);
        }else{
          if(this.config.routeTaskUrl){
            //user has opend the setting page
            def.resolve(this.config.travelModesUrl);
          }else{
            //user doesn't open the setting page
            this.portal.loadSelfInfo().then(lang.hitch(this, function(response){
              if(response && response.helperServices && response.helperServices.routingUtilities){
                def.resolve(response.helperServices.routingUtilities.url);
              }else{
                def.resolve("");
              }
            }), lang.hitch(this, function(err){
              console.error(err);
              def.reject(err);
            }));
          }
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
          this._active = this._dijitDirections.mapClickActive;
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