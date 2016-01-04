///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
/**
 * Stream widget panel.
 * @module widgets/Stream/StreamControl
 */
define(['dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/on',
  'dojo/dom-attr',
  'dojo/dom-style',
  'dojo/dom-class',
  'dojo/dom-construct',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/text!./StreamControl.html',
  'jimu/dijit/DrawBox',
  './FilterItem',
  'jimu/dijit/CheckBox',
  'dijit/form/RadioButton',
  'esri/symbols/jsonUtils',
  'esri/symbols/SimpleFillSymbol',
  'esri/graphic',
  'jimu/dijit/SimpleTable',
  'dijit/form/NumberSpinner',
  'jimu/dijit/LoadingShelter'
],
function(declare, lang, array, on, domAttr, domStyle, domClass, domConstruct, _WidgetBase,
  _TemplatedMixin, _WidgetsInTemplateMixin, template, DrawBox, FilterItem, CheckBox,
  RadioButton, jsonUtils, SimpleFillSymbol, Graphic){
  return /**@alias module:widgets/Stream/StreamControl */ declare([_WidgetBase,
    _TemplatedMixin, _WidgetsInTemplateMixin
  ], {
    baseClass: 'jimu-widget-stream',
    templateString: template,
    map: null,
    streamLayer: null,
    /**
     * Whether the stream layer is drawing.
     * @type {Boolean}
     */
    isStreaming: true,
    /**
     * Map extent change handler. If user choose to filter stream layer using
     * current map extent, this handler is used to fetch the extent.
     * @type {Object}
     */
    mapExtentChangeHandler: null,
    config: null,
    filterItems: [],

    postCreate: function() {
      this.inherited(arguments);

      this.spatialFilterToggle = new CheckBox({
        checked: false,
        label: this.nls.useSpatialFilter,
        onChange: lang.hitch(this, this._toggleSpatialFilter)
      });
      this.spatialFilterToggle.placeAt(this.spatialFilterToggleDiv);

      this.attrFilterToggle = new CheckBox({
        checked: false,
        label: this.nls.useAttributeFilter,
        onChange: lang.hitch(this, this._toggleAttributeFilter)
      });
      this.attrFilterToggle.placeAt(this.attrFilterToggleDiv);

      if(this.config){
        this._applyConfig();
      }

      if(this.streamLayer){
        this._bindEvents();
      }
    },

    /**
     * Apply stream layer config.
     */
    _applyConfig: function(){
      if(this.config.startStop !== true){
        domStyle.set(this.startBtn, 'display', 'none');
      }

      if(this.config.clear !== true){
        domStyle.set(this.clearBtn, 'display', 'none');
      }

      if(this.config.drawPrevious !== true){
        domStyle.set(this.drawPreviousSection, 'display', 'none');
      }

      if(this.config.spatialFilter !== true){
        domStyle.set(this.spatialFilterControl, 'display', 'none');
        domStyle.set(this.spatialFilterSection, 'display', 'none');
      }else{
        if(this.config.mapExtentFilter && this.config.drawExtentFilter){
          //use radio button
          this._createMapAreaFilterControl(true);
          this._createDrawAreaFilterControl(true);
        }else if(this.config.mapExtentFilter){
          //use checkbox
          this._createMapAreaFilterControl(false);
        }else if(this.config.drawExtentFilter){
          this._createDrawAreaFilterControl(false);
        }else{
          domStyle.set(this.spatialFilterControl, 'display', 'none');
          domStyle.set(this.spatialFilterSection, 'display', 'none');
        }
      }

      if(this.config.attrFilter && this.config.filterList.length > 0){
        //create attribute config section
        var filterItem, type, hasAttrFilterApplied = false;
        array.forEach(this.config.filterList, lang.hitch(this, function(filterInfo, index){
          if(this.config.filterList.length === 1){
            type =  'checkbox';
          }else{
            type = 'radio';
          }
          //sync with map on init
          var checked = filterInfo.inherited === true &&
              filterInfo.definitionExpression === this.streamLayer.getDefinitionExpression();
          filterItem = new FilterItem({
            uid: this.id,
            config: filterInfo,
            type: type,
            streamLayer: this.streamLayer,
            index: index,
            checked: checked,
            nls: this.nls
          });
          filterItem.placeAt(this.attrFilterSection);
          this.filterItems.push(filterItem);
          hasAttrFilterApplied = hasAttrFilterApplied || checked;
        }));

        if(hasAttrFilterApplied){
          this.attrFilterToggle.setValue(true);
        }
      }else{
        domStyle.set(this.attrFilterControl, 'display', 'none');
        domStyle.set(this.attrFilterSection, 'display', 'none');
      }

      if(!this.config.spatialFilter &&
          (!this.config.attrFilter || this.config.filterList.length === 0)){
        //no filter
        domStyle.set(this.filterLabelSection, 'display', 'none');
      }
    },

    _createMapAreaFilterControl: function(isRadio){
      var mapAreaDiv;

      mapAreaDiv = domConstruct.create('div', {
        'class': 'filterOption'
      }, this.spatialFilterSection);

      if(isRadio){
        this.mapAreaControl = new RadioButton({
          id: this.id + '_mapAreaObservations',
          name: this.id + '_sf',
          value: 'mapArea'
        });
        this.mapAreaControl.placeAt(mapAreaDiv);
        this.own(on(this.mapAreaControl, 'change', lang.hitch(this, this._mapAreaFilterChange)));
        domConstruct.create('label', {
          'class': 'jimu-widget-normal',
          'for': this.id + '_mapAreaObservations',
          innerHTML: this.nls.showMapAreaObservations
        }, mapAreaDiv);
      }else{
        this.mapAreaControl = new CheckBox({
          checked: false,
          label: this.nls.showMapAreaObservations,
          onChange: lang.hitch(this, this._mapAreaFilterChange)
        });
        this.mapAreaControl.placeAt(mapAreaDiv);
      }
    },

    _createDrawAreaFilterControl: function(isRadio){
      var drawAreaDiv;

      drawAreaDiv = domConstruct.create('div', {
        'class': 'filterOption'
      }, this.spatialFilterSection);

      if(isRadio){
        this.drawAreaControl = new RadioButton({
          id: this.id + '_drawAreaObservations',
          name: this.id + '_sf',
          value: 'drawArea'
        });
        this.drawAreaControl.placeAt(drawAreaDiv);
        this.own(on(this.drawAreaControl, 'change', lang.hitch(this, this._drawAreaFilterChange)));
        domConstruct.create('label', {
          'class': 'jimu-widget-normal',
          'for': this.id + '_drawAreaObservations',
          innerHTML: this.nls.showObservationsByDrawing
        }, drawAreaDiv);
      }else{
        this.drawAreaControl = new CheckBox({
          checked: false,
          label: this.nls.showObservationsByDrawing,
          onChange: lang.hitch(this, this._drawAreaFilterChange)
        });
        this.drawAreaControl.placeAt(drawAreaDiv);
      }

      this.drawToolDiv = domConstruct.create('div', {
        style: 'display:none'
      }, drawAreaDiv);

      this.drawTool = new DrawBox({
        map: this.map,
        showClear: true,
        keepOneGraphic: true,
        geoTypes: ['EXTENT'],
        types: ['polygon']
      });
      if(this.config.drawSymbol){
        this.drawTool.setPolygonSymbol(jsonUtils.fromJson(this.config.drawSymbol));
      }
      this.drawTool.placeAt(this.drawToolDiv);

      this.own(on(this.drawTool, 'draw-end', lang.hitch(this, function(graphic) {
        var another = new Graphic(graphic.toJson()), handler;
        another.symbol.setStyle(SimpleFillSymbol.STYLE_NULL);
        this.drawTool.addGraphic(another);

        handler = on(this.streamLayer, 'filter-change', lang.hitch(this, function(obj){
          handler.remove(); //remove this event handler
          if(obj.filter.geometry && obj.filter.geometry.type === 'extent'){
            setTimeout(lang.hitch(this, function(){
              this._clearOutsideGraphics(obj.filter.geometry);
            }), 100);
          }
        }));
        this.streamLayer.setGeometryDefinition(another.geometry);
      })));

      this.own(on(this.drawTool, 'clear', lang.hitch(this, function() {
        this.streamLayer.setGeometryDefinition(this.map.extent);
      })));
    },

    _mapAreaFilterChange: function(checked){
      if(checked){
        if (this.streamLayer) {
          this.streamLayer.setGeometryDefinition(this.map.extent);
        }
        this._addMapExtentChangeHandler();
      }else{
        this._removeMapExtentChangeHandler();
      }
    },

    _drawAreaFilterChange: function(checked){
      if(checked){
        domStyle.set(this.drawToolDiv, 'display', '');
      }else{
        this.drawTool.clear();
        domStyle.set(this.drawToolDiv, 'display', 'none');
      }
    },

    _bindEvents: function() {
      if(domStyle.get(this.startBtn, 'display') !== 'none'){
        this.own(on(this.startBtn, 'click', lang.hitch(this, function() {
          this.isStreaming = !this.isStreaming;
          if (this.isStreaming) {
            domClass.add(this.startBtn, 'stop');
            domAttr.set(this.startBtnLabel, 'innerHTML', this.nls.stopStreaming);
            this.startStreaming();
          } else {
            domClass.remove(this.startBtn, 'stop');
            domAttr.set(this.startBtnLabel, 'innerHTML', this.nls.startStreaming);
            this.stopStreaming();
          }
        })));
      }

      if(domStyle.get(this.clearBtn, 'display') !== 'none'){
        this.own(on(this.clearBtn, 'click', lang.hitch(this, function() {
          this.streamLayer.clear();
        })));
      }

      if(domStyle.get(this.drawPreviousSection, 'display') !== 'none'){
        //set the previousSpinner
        var maxTrackPoints = this.streamLayer.maximumTrackPoints || 1;

        this.previousSpinner.set('value', maxTrackPoints - 1);
        this.streamLayer.setMaximumTrackPoints(maxTrackPoints);

        this.own(on(this.previousSpinner, 'change', lang.hitch(this, function(newVal) {
          this.streamLayer.setMaximumTrackPoints(newVal + 1);
        })));
      }
    },

    /**
     * clear graphics which is not contained by the drawn extent
     * @param  {[type]} extent [description]
     * @return {[type]}        [description]
     */
    _clearOutsideGraphics: function(extent){
      /* jshint unused: false*/
      //Not available now. Track points and connected lines are maintained in TrackManager,
      //which is not a public accessible object and it has no such function to clear features by
      //specified extent. So we simply clear the whole stream layer.
      this.streamLayer.clear();
    },

    destroy: function() {
      this.inherited(arguments);
      this._removeMapExtentChangeHandler();
    },

    /**
     * When the stream widget is closed, clear the graphcis and disconnect the
     * stream.
     */
    stopStreaming: function() {
      this.streamLayer.disconnect(lang.hitch(this, function(){
        this.streamLayer.clear();
      }));
    },

    /**
     * When the stream widget is opened, continue to draw the stream layer if
     * {@link module:widgets/Stream/Widget#isStreaming} is true.
     */
    startStreaming: function() {
      this.streamLayer.connect();
    },

    /**
     * Remove the listener of map extent change event.
     * @private
     */
    _removeMapExtentChangeHandler: function() {
      if (this.mapExtentChangeHandler &&
        typeof this.mapExtentChangeHandler.remove === 'function') {
        this.mapExtentChangeHandler.remove();
        this.mapExtentChangeHandler = null;
      }
    },

    /**
     * Add listener to map extent change event.
     */
    _addMapExtentChangeHandler: function() {
      if (this.mapExtentChangeHandler === null) {
        this.mapExtentChangeHandler = on(this.map, 'extent-change',
          lang.hitch(this, this._mapExtentChange));
      }
    },

    _mapExtentChange: function(res) {
      if (this.streamLayer) {
        this.streamLayer.setGeometryDefinition(res.extent);
      }
    },

    _toggleSpatialFilter: function(checked){
      if(checked){
        domStyle.set(this.spatialFilterSection, 'display', '');
      }else{
        domStyle.set(this.spatialFilterSection, 'display', 'none');
        domStyle.set(this.drawToolDiv, 'display', 'none');

        if(this.mapAreaControl){
          if(this.mapAreaControl.dealaredClass === 'jimu.dijit.CheckBox'){
            this.mapAreaControl.setValue(false);
          }else{
            this.mapAreaControl.set('checked', false);
          }
        }
        if(this.drawAreaControl){
          this.drawTool.clear();
          if(this.drawAreaControl.dealaredClass === 'jimu.dijit.CheckBox'){
            this.drawAreaControl.setValue(false);
          }else{
            this.drawAreaControl.set('checked', false);
          }
        }

        this._removeMapExtentChangeHandler();
        if (this.streamLayer) {
          this.streamLayer.setGeometryDefinition(null);
        }
      }
    },

    _toggleAttributeFilter: function(checked){
      if(checked){
        domStyle.set(this.attrFilterSection, 'display', '');
      }else{
        domStyle.set(this.attrFilterSection, 'display', 'none');
        array.forEach(this.filterItems, function(item){
          item.unCheck();
        });

        if (this.streamLayer){
          this.streamLayer.setDefinitionExpression(null);
        }
      }
    }
  });
});
