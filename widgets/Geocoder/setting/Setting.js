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
    'dojo/on',
    'dojo/keys',
    'dojo/Deferred',
    'dojo/promise/all',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
    'jimu/dijit/SimpleTable',
    'jimu/dijit/LoadingShelter',
    'jimu/dijit/Message',
    'jimu/dijit/Popup',
    './Edit',
    'esri/request',
    'jimu/dijit/CheckBox',
    'jimu/portalUtils'
  ],
  function(
    declare,
    lang,
    array,
    html,
    on,
    keys,
    Deferred,
    all,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    Table,
    LoadingShelter,
    Message,
    Popup,
    Edit,
    esriRequest,
    CheckBox,
    portalUtils) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-geocoder-setting',
      defaultGeocodeUrl: "geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
      edit: null,
      popup: null,
      popupState: "", // ADD or EDIT
      editTr: null,

      startup: function() {
        this.inherited(arguments);
        if (!this.config.geocoder) {
          this.config.geocoder = {};
        }

        var fields = [{
          name: 'url',
          title: this.nls.url,
          type: 'text',
          editable: false,
          hidden: true,
          unique: true
        }, {
          name: 'name',
          title: this.nls.name,
          type: 'text',
          editable: false,
          unique: true
        }, {
          name: 'singleLineFieldName',
          title: this.nls.singleLineFieldName,
          type: 'text',
          hidden: true,
          editable: false
        }, {
          name: 'placeholder',
          title: this.nls.placeholder,
          type: "text",
          editable: false,
          hidden: true
        }, {
          name: '',
          title: '',
          width: '100px',
          type: 'actions',
          actions: ['edit', 'up', 'down', 'delete']
        }];

        var args = {
          fields: fields,
          selectable: false
        };
        this.displayFieldsTable = new Table(args);
        this.displayFieldsTable.placeAt(this.tableGeocoders);
        this.own(on(this.displayFieldsTable, 'actions-edit', lang.hitch(this, '_onEditClick')));
        this.displayFieldsTable.startup();

        this.shelter = new LoadingShelter({
          hidden: true
        });

        this.shelter.placeAt(this.domNode);
        this.shelter.startup();
        this.shelter.show();

        this._preProcessConfig();
      },

      setConfig: function(config) {
        this.config = config;
        this.displayFieldsTable.clear();

        if (config.geocoder.geocoders) {
          var json = [];
          var len = config.geocoder.geocoders.length;
          for (var i = 0; i < len; i++) {
            json.push({
              url: config.geocoder.geocoders[i].url,
              name: config.geocoder.geocoders[i].name,
              singleLineFieldName: config.geocoder.geocoders[i].singleLineFieldName,
              placeholder: config.geocoder.geocoders[i].placeholder
            });
          }
          this.displayFieldsTable.addRows(json);
        }
      },

      _preProcessConfig: function() {
        if (this.config.geocoder.geocoders && this.config.geocoder.geocoders.length) {
          this.setConfig(this.config);
          this.shelter.hide();
        } else {
          this._addGeocodersFromProtal(this.appConfig.portalUrl);
        }
      },

      onAddGeocoderClick: function() {
        this.popupState = "ADD";
        this._openEdit(this.nls.add, {});
      },

      _onEditClick: function(tr) {
        var geocode = this.displayFieldsTable.getRowData(tr);
        this.popupState = "EDIT";
        this.editTr = tr;
        this._openEdit(this.nls.edit, geocode);
      },

      _openEdit: function(title, geocode) {
        this.edit = new Edit({
          nls: this.nls,
          config: geocode || {}
        });

        this.popup = new Popup({
          titleLabel: title,
          autoHeight: true,
          content: this.edit,
          container: 'main-page',
          width: 640,
          height: 300,
          buttons: [{
            label: this.nls.ok,
            key: keys.ENTER,
            disable: true,
            onClick: lang.hitch(this, '_onEditOk')
          }, {
            label: this.nls.cancel,
            key: keys.ESCAPE
          }],
          onClose: lang.hitch(this, '_onEditClose')
        });
        html.addClass(this.popup.domNode, 'widget-setting-popup');
        this.edit.startup();
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

      _addGeocodersFromProtal: function(portalUrl) {
        var def = portalUtils.getPortalSelfInfo(portalUrl);
        def.then(lang.hitch(this, function(response) {
          var geocoders = response.helperServices && response.helperServices.geocode;
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
                  this.displayFieldsTable.addRow(json);
                }
              }
              this.shelter.hide();
            }));
          }
        }), lang.hitch(this, function(err) {
          this.shelter.hide();
          new Message({
            message: this.nls.portalConnectionError
          });
          console.error(err);
        }));
      },

      _onEditOk: function() {
        var json = this.edit.getConfig(),
          editResult = null;

        if (!json.url || !json.name || !json.singleLineFieldName) {
          new Message({
            message: this.nls.warning
          });
          return;
        }
        if (this.popupState === "ADD") {
          editResult = this.displayFieldsTable.addRow(json);
        } else if (this.popupState === "EDIT") {
          editResult = this.displayFieldsTable.editRow(this.editTr, json);
        }

        if (editResult.success) {
          this.popup.close();
          this.popupState = "";
          this.editTr = null;
        } else {
          var repeatTitles = array.map(editResult.repeatFields, lang.hitch(this, function(field) {
            return field && field.title;
          }));
          new Message({
            message: this.nls[editResult.errorCode] + repeatTitles.toString()
          });
        }
      },

      _onEditClose: function() {
        this.edit = null;
        this.popup = null;
      },

      getConfig: function() {
        var data = this.displayFieldsTable.getData();
        var json = [];
        var len = data.length;

        for (var i = 0; i < len; i++) {
          json.push(data[i]);
        }
        if (json.length > 0) {
          this.config.geocoder.arcgisGeocoder = false;
        } else {
          this.config.geocoder.arcgisGeocoder = {
            placeholder: "Find address or place"
          };
        }

        this.config.geocoder.geocoders = json;
        return this.config;
      }
    });
  });