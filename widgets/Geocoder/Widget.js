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
    'dojo/_base/array',
    'jimu/BaseWidget',
    "esri/dijit/Geocoder",
    'dojo/_base/html',
    'dojo/on',
    'dojo/_base/lang',
    'dojo/Deferred',
    "dojo/promise/all",
    'jimu/portalUtils',
    'jimu/dijit/Message',
    "libs/usng/usng",
    "esri/request",
    "esri/geometry/Extent",
    "esri/graphic",
    "esri/geometry/Point",
    "esri/SpatialReference"
  ],
  function(
    declare, array, BaseWidget, Geocoder,
    html, on, lang, Deferred, all,
    portalUtils, Message, usng, esriRequest, Extent, Graphic, Point, SpatialReference) {
    var clazz = declare([BaseWidget], {

      name: 'Geocoder',
      baseClass: 'jimu-widget-geocoder',
      defaultGeocodeUrl: "arcgis.com/arcgis/rest/services/World/GeocodeServer",
      lastMgrsResult: null,

      postCreate: function() {
        this.inherited(arguments);
      },

      startup: function() {
        this.inherited(arguments);
        this._initGeocoder();
      },

      _initGeocoder: function() {
        this._getGeocoders(this.appConfig.portalUrl).then(lang.hitch(this, function() {
          var json = this.config.geocoder;
          json.map = this.map;

          var geocoder = new Geocoder(json);
          this.own(on(geocoder, 'select', lang.hitch(this, "findComplete")));
          this.own(on(geocoder, "auto-complete", lang.hitch(this, "onFindResults")));
          this.own(on(geocoder, "find-results", lang.hitch(this, "onFindResults")));
          html.place(geocoder.domNode, this.domNode);
          geocoder.startup();
        }), lang.hitch(this, function(err) {
          console.error(err);
        }));
      },

      _getGeocodeName: function(geocodeUrl) {
        if (typeof geocodeUrl !== "string") {
          return "geocoder";
        }
        var strs = geocodeUrl.split('/');
        return strs[strs.length - 2] || "geocoder";
      },

      _getSingleLine: function(geocode) {
        var def = new Deferred();

        if (geocode.singleLineFieldName) {
          def.resolve(geocode);
        } else {
          esriRequest({
            url: geocode.url,
            content: {
              f: "json"
            },
            handleAs: "json",
            callbackParamName: "callback"
          }).then(lang.hitch(this, function(response) {
            if (response.singleLineAddressField && response.singleLineAddressField.name) {
              geocode.singleLineFieldName = response.singleLineAddressField.name;
              def.resolve(geocode);
            } else {
              console.warn(geocode.url + "has no singleLineFieldName");
              def.resolve(null);
            }
          }), lang.hitch(this, function(err) {
            console.error(err);
            def.resolve(null);
          }));
        }

        return def;
      },

      _getGeocoders: function(portalUrl) {
        var geoDef = new Deferred();

        if (this.config.geocoder &&
          this.config.geocoder.geocoders &&
          this.config.geocoder.geocoders.length) {
          geoDef.resolve('success');
          return geoDef;
        }
        portalUtils.getPortalSelfInfo(portalUrl).then(lang.hitch(this, function(response) {
          var geocoders = response.helperServices && response.helperServices.geocode;
          var portalGeocoders = [];
          var defs = [];
          if (geocoders && geocoders.length > 0) {
            for (var i = 0, len = geocoders.length; i < len; i++) {
              var geocoder = geocoders[i];
              if (geocoder) {
                defs.push(this._getSingleLine(geocoder));
              }
            }

            all(defs).then(lang.hitch(this, function(results) {
              for (var i = 0; i < results.length; i++) {
                var geocode = results[i];
                if (geocode) {
                  var json = {
                    name: geocode.name || this._getGeocodeName(geocode.url),
                    url: geocode.url,
                    singleLineFieldName: geocode.singleLineFieldName,
                    placeholder: geocode.placeholder ||
                      geocode.name || this._getGeocodeName(geocode.url)
                  };
                  portalGeocoders.push(json);
                }
              }
              this.config.geocoder.geocoders = portalGeocoders;
              this.config.geocoder.arcgisGeocoder = portalGeocoders.length === 0 ? true : false;
              geoDef.resolve('success');
            }));
          } else {
            this.config.geocoder.arcgisGeocoder = true;
            console.error("portal doesn't configure geocode, use arcgisGeocoder instead");
            geoDef.resolve('success');
          }
        }), lang.hitch(this, function(err) {
          new Message({
            message: this.nls.portalConnectionError
          });
          geoDef.reject('error');
          console.error(err);
        }));

        return geoDef;
      },

      /**
       * Looks up an MGRS or USNG string and returns a result object with text,
       * latitude, and longitude properties, or null if the string is not a valid
       * MGRS or USNG string.
       */
      lookupMgrs: function(mgrs) {
        var result = null;
        try {
          var latLon = [];
          usng.USNGtoLL(mgrs, latLon);
          if (2 <= latLon.length && !isNaN(latLon[0]) && !isNaN(latLon[1])) {
            result = {
              text: mgrs.toUpperCase(),
              latitude: latLon[0],
              longitude: latLon[1]
            };
          } else {
            result = null;
          }
        } catch (err) {
          //Not an MGRS/USNG string; that's fine; swallow
          result = null;
        }
        return result;
      },

      onFindResults: function(results) {
        //Check to see if the user typed an MGRS or USNG string
        this.lastMgrsResult = this.lookupMgrs(results.results.value);
        if (null !== this.lastMgrsResult) {
          // Get reference ellipsoid coordinates of the current coordinate system
          // var mapWkid = this.map.spatialReference.wkid;
          // var srWkid = csUtils.isProjectedCS(mapWkid) ?
          //csUtils.getGeoCSByProj(mapWkid) : mapWkid;
          //Make a new object just like the objects in results.results.results
          var point = new Point(
            this.lastMgrsResult.longitude,
            this.lastMgrsResult.latitude,
            new SpatialReference({
              wkid: 4326 //srWkid   should use the ellipsoid SR of the current coordinate system
            }));
          var extent = this.map.extent.centerAt(point);
          var feature = new Graphic(point);
          var resultObject = {
            extent: extent,
            feature: feature,
            name: this.lastMgrsResult.text
          };
          //Insert at start of results list
          results.results.results.unshift(resultObject);
        }
      },

      findComplete: function(response) {
        var geocoder = response.target;
        geocoder.autoNavigate = true;
        var feature = null;
        var extent = null;
        var content = null;

        if (response && response.result) {
          //Use the actual geocode result
          feature = response.result.feature;
          extent = response.result.extent;
          content = response.result.name;
        } else if (this.lastMgrsResult) {
          //Use the last MGRS result
          feature = {
            geometry: new Point(this.lastMgrsResult.longitude, this.lastMgrsResult.latitude)
          };
          content = this.lastMgrsResult.text;
        }

        if (feature) {
          this.map.infoWindow.setTitle("Location");
          this.map.infoWindow.setContent(content || null);
          this.map.infoWindow.show(feature.geometry);
        } else if (extent) {
          this.map.setExtent(extent);
        }

        /**
         * For MGRS, where we manually center the map, we have to center it after
         * showing the InfoWindow, not before. Otherwise, the InfoWindow does not
         * move until the map scale changes.
         */
        if (this.lastMgrsResult) {
          this.map.centerAt(feature.geometry);
          geocoder.autoNavigate = false;
        }
      }
    });
    return clazz;
  });