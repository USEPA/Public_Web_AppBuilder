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
    'dijit/registry',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/dom-attr',
    'dojo/dom-construct',
    'dojo/dom-class',
    'dojo/dom-style',
    'dojo/on',
    'dojo/query',
    'jimu/LayerInfos/LayerInfos',
    'jimu/dijit/LoadingShelter',
    'dojox/form/CheckedMultiSelect',
    'jimu/dijit/RadioBtn',
    'dijit/form/Select',
    'dijit/form/NumberSpinner'
  ],
  function(
    declare,
    BaseWidgetSetting,
    _WidgetsInTemplateMixin,
    registry,
    lang,
    array,
    domAttr,
    domConstruct,
    domClass,
    domStyle,
    on,
    query,
    LayerInfos,
    LoadingShelter,
    CheckedMultiSelect) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {

      baseClass: 'jimu-widget-swipe-plus-setting',

      _selectedStyle: '',
      _selectedScopeSize: '',
      _selectedSwipeLayerHeight: 100,
      smallScope: 121,
      mediumScope: 261,
      largeScope: 401,

      postCreate: function() {
        this.own(on(this.verticalNode, 'click', lang.hitch(this, function() {
          this._selectSwipeStyle('vertical');
        })));
        this.own(on(this.horizontalNode, 'click', lang.hitch(this, function() {
          this._selectSwipeStyle('horizontal');
        })));
        this.own(on(this.scopeNode, 'click', lang.hitch(this, function() {
          this._selectSwipeStyle('scope');
        })));

        this.own(on(this.selectScopeSize, 'change', lang.hitch(this, function(evt) {
          this._selectScopeSize(evt);
        })));
        
        this.own(on(this.layerHeightSpinner, 'change', lang.hitch(this, function(evt) {
          this._selectSwipeLayerHeight(evt);
        })));
        
        this.swipePlusLayersCfg = new CheckedMultiSelect({
          dropDown: false,
          multiple: true,
          required: false,
          'class': 'swipe-plus-layers'
        }, this.swipePlusLayersCfg);

        this.shelter = new LoadingShelter({
          hidden: true
        });
        this.shelter.placeAt(this.domNode);
        this.shelter.startup();
        this.shelter.show();

        this._getLayersFromMap(this.map).then(lang.hitch(this, function(data) {
          if (!this.domNode) {
            return;
          }
          
          var options = [];
          array.forEach(data, function(option) {
            options.push(domConstruct.create('option', option));
          }, this);
          
          this.swipePlusLayersCfg.set('options', options);
          domClass.add(this.swipePlusLayersCfg.selectNode, 'swipe-plus-layers');
          this.swipePlusLayersCfg.startup();
        }), function(err) {
          console.log(err);
        }).always(lang.hitch(this, function() {
          this.shelter.hide();
        }));
      },

      startup: function() {
        this.inherited(arguments);
        this.setConfig(this.config);
      },

      setConfig: function(config) {
        this.config = config;
        this._selectSwipeStyle(this.config.style || 'vertical');
        domAttr.set(this.sampleSpyglass, 'src', this.folderUrl + 'images/scope_medium.png');
        this._selectScopeSize(this.config.scopeSize || 'medium');
        this.selectScopeSize.set('value', this.config.scopeSize || 'medium');
        this.layerHeightSpinner.set('value', this.config.swipeLayerHeight || this._selectedSwipeLayerHeight);
        this._selectSwipeLayerHeight(this.config.swipeLayerHeight || this._selectedSwipeLayerHeight);
        this.swipePlusLayersCfg.set('value', this.config.layers || []);
      },

      _getLayersFromMap: function(map) {
        return LayerInfos.getInstance(map, map.itemInfo)
          .then(lang.hitch(this, function(layerInfosObj) {
            var infos = layerInfosObj.getLayerInfoArray();
            var data = array.map(infos, function(info) {
              return {
                label: info.title,
                value: info.id
              };
            });

            return data;
          }));
      },

      _selectSwipeStyle: function(style) {
        var _selectedNode = null;
        var _layerText = "";
        if (style === 'scope') {
          _selectedNode = this.scopeNode;
          _layerText = this.nls.spyglassText;
        } else if (style === 'horizontal') {
          _selectedNode = this.horizontalNode;
          _layerText = this.nls.layerText;
        } else {
          _selectedNode = this.verticalNode;
          _layerText = this.nls.layerText;
        }
        this.layerTextNode.innerHTML = _layerText;
        var _radio = registry.byNode(query('.jimu-radio', _selectedNode)[0]);
        _radio.check(true);

        this._selectedStyle = style;
      },
      
      _selectScopeSize: function(size) {
        var spyglassWidth;
        var frameWidth = query('.jimu-widget-swipe-plus-setting .sample-spyglass-frame').style('width')[0];
        var scopeScale = frameWidth / this.largeScope;
        this._selectedScopeSize = size;
        
        switch(size) {
          case 'small':
            spyglassWidth = this.smallScope * scopeScale + 'px';
            break;
          case 'medium':
            spyglassWidth = this.mediumScope * scopeScale + 'px';
            break;
          case 'large':
            spyglassWidth = this.largeScope * scopeScale + 'px';
            break;
        }
        domStyle.set(this.sampleSpyglass, 'width', spyglassWidth);
      },
      
      _selectSwipeLayerHeight: function(height) {
        domStyle.set(this.swipePlusLayersCfg.selectNode, 'height', height + 'px');
      },

      _getSelectedStyle: function() {
        return this._selectedStyle;
      },
      
      _getSelectedLayerHeight: function() {
        return this.layerHeightSpinner.get('value');
      },

      _getSelectedScopeSize: function() {
        return this._selectedScopeSize;
      },

      getConfig: function() {
        this.config.style = this._getSelectedStyle();
        this.config.scopeSize = this._getSelectedScopeSize();
        this.config.layers = this.swipePlusLayersCfg.get('value');
        this.config.swipeLayerHeight = this._getSelectedLayerHeight();
        return this.config;
      }
    });
  });