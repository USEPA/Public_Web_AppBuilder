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
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/dijit/Message',
    'dojo/text!./FeaturelayerSource.html',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/_base/array',
    'dojox/form/CheckedMultiSelect',
    'dojo/on',
    'dojo/Evented'
  ],
  function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
    Message, template, lang, html, array, CheckedMultiSelect, on, Evented) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {

      /*jshint loopfunc: true */
      templateString: template,
      baseClass: 'imt-featurelayer-source',

      postCreate: function() {
        this.inherited(arguments);
        this._initUI();
      },

      _initUI: function() {
        var opLayers = this.map.itemInfo.itemData.operationalLayers;
        var options = [];

        if (opLayers.length === 0) {
          new Message({
            message: this.nls.missingLayerInWebMap
          });
          return;
        }

        this.weatherLayersSelect = new CheckedMultiSelect({
          name: "selectLayers",
          multiple: true,
          style: "width:100%;"
        }).placeAt(this.selectLayers);

        for (var i = 0; i < opLayers.length; i++) {
          var filteredArr = array.filter(options, function(item) {
            return item.label === opLayers[i].title;
          });
          if (filteredArr === null || filteredArr.length === 0) {

            this.weatherLayersSelect.addOption({
              label: opLayers[i].title,
              value: opLayers[i].title
            });
          }
        }

        if (this.weatherTabAdditionalLayers) {
          var layerArr = this.weatherTabAdditionalLayers.split(",");
          var setWeatherLayers = [];
          array.forEach(layerArr, lang.hitch(this, function(layer) {
            setWeatherLayers.push(lang.trim(layer));
          }));
          this.weatherLayersSelect.set("value", setWeatherLayers);
          if (setWeatherLayers.length > 0) {
            html.removeClass(this.btnOk, 'jimu-state-disabled');
          } else {
            html.addClass(this.btnOk, 'jimu-state-disabled');
          }
        }

        this.own(on(this.weatherLayersSelect, 'click', lang.hitch(this, function() {
          var items = this._getSelectedLayers();
          if (items.length > 0) {
            html.removeClass(this.btnOk, 'jimu-state-disabled');
          } else {
            html.addClass(this.btnOk, 'jimu-state-disabled');
          }
        })));

        this.own(on(this.btnOk, 'click', lang.hitch(this, function() {
          var items = this._getSelectedLayers();
          if (items.length > 0) {
            this.emit('ok', items);
          }
        })));

        this.own(on(this.btnCancel, 'click', lang.hitch(this, function() {
          this.emit('cancel');
        })));

      },

      _getSelectedLayers: function() {
        var weatherLayers = "";
        array.forEach(this.weatherLayersSelect.options, lang.hitch(this, function(option) {
          if (option.selected) {
            if (weatherLayers.length > 0) {
              weatherLayers += ",";
            }
            weatherLayers += option.value;
          }
        }));
        return weatherLayers;
      }

    });
  });
