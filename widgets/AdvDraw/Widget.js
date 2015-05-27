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
    'jimu/BaseWidget',
    'esri/graphic',
    'esri/geometry/Point',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/geometry/Polyline',
    'esri/symbols/SimpleLineSymbol',
    'esri/geometry/Polygon',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/TextSymbol',
    'esri/symbols/Font',
    'esri/units',
    'esri/geometry/webMercatorUtils',
    'esri/geometry/geodesicUtils',
    'dojo/_base/lang',
    'dojo/on',
	//////////////////////////////////////
	'esri/toolbars/edit',
	'dijit/Menu',
	'dijit/MenuItem',
	'dijit/MenuSeparator',
	'dojo/number',
	'jimu/SpatialReference/utils',
	/////////////////////////////////////
    'dojo/_base/html',
    'dojo/_base/Color',
    'dojo/_base/query',
    'dojo/_base/array',
    'dijit/form/Select',
    'dijit/form/NumberSpinner',
    'jimu/dijit/ViewStack',
    'jimu/dijit/SymbolChooser',
    'jimu/dijit/DrawBox',
    'jimu/utils'
  ],
  function(declare,_WidgetsInTemplateMixin,BaseWidget,Graphic,Point,
    SimpleMarkerSymbol,Polyline,SimpleLineSymbol,Polygon,SimpleFillSymbol,
    TextSymbol,Font,esriUnits,webMercatorUtils,geodesicUtils,lang,on,
	///////////////////
	Edit,Menu,MenuItem,MenuSeparator,number,Spatialutils,
	///////////////////
	html,Color,Query,array,Select,NumberSpinner,ViewStack,SymbolChooser,
    DrawBox, jimuUtils) {/*jshint unused: false*/
	/////////////////////////////
	var editToolbar, ctxMenuForGraphics, ctxMenuForMap, selected, currentLocation, myGraphic,Spat;
	var MoveMenu, RoScMenu, SepMenu, MenuDelete, XYMenu;
    ////////////////////////////
	return declare([BaseWidget, _WidgetsInTemplateMixin], {
      name: 'AdvDraw',
      baseClass: 'jimu-widget-draw',

      postMixInProperties: function(){
        this.inherited(arguments);
        this._resetUnitsArrays();
      },

      postCreate: function() {
        this.inherited(arguments);
        jimuUtils.combineRadioCheckBoxWithLabel(this.showMeasure, this.showMeasureLabel);
        this.drawBox.setMap(this.map);

        this.viewStack = new ViewStack({
          viewType: 'dom',
          views: [this.pointSection, this.lineSection, this.polygonSection, this.textSection]
        });
        html.place(this.viewStack.domNode, this.settingContent);

        this._initUnitSelect();
        this._bindEvents();
      },

      _resetUnitsArrays: function(){
        this.defaultDistanceUnits = [];
        this.defaultAreaUnits = [];
        this.configDistanceUnits = [];
        this.configAreaUnits = [];
        this.distanceUnits = [];
        this.areaUnits = [];
      },


      _bindEvents: function() {
        //bind DrawBox
        this.own(on(this.drawBox,'IconSelected',lang.hitch(this,this._onIconSelected)));
        this.own(on(this.drawBox,'DrawEnd',lang.hitch(this,this._onDrawEnd)));

        //bind symbol change events
        this.own(on(this.pointSymChooser,'change',lang.hitch(this,function(){
          this._setDrawDefaultSymbols();
        })));
        this.own(on(this.lineSymChooser,'change',lang.hitch(this,function(){
          this._setDrawDefaultSymbols();
        })));
        this.own(on(this.fillSymChooser,'change',lang.hitch(this,function(){
          this._setDrawDefaultSymbols();
        })));
        this.own(on(this.textSymChooser,'change',lang.hitch(this,function(symbol){
          this.drawBox.setTextSymbol(symbol);
        })));

        //bind unit events
        this.own(on(this.showMeasure,'click',lang.hitch(this,this._setMeasureVisibility)));
      },

      _onIconSelected:function(target,geotype,commontype){
        this._setDrawDefaultSymbols();
        if(commontype === 'point'){
          this.viewStack.switchView(this.pointSection);
        }
        else if(commontype === 'polyline'){
          this.viewStack.switchView(this.lineSection);
        }
        else if(commontype === 'polygon'){
          this.viewStack.switchView(this.polygonSection);
        }
        else if(commontype === 'text'){
          this.viewStack.switchView(this.textSection);
        }
        this._setMeasureVisibility();
      },

      _onDrawEnd:function(graphic,geotype,commontype){
        var geometry = graphic.geometry;
		/////////////////////////////////////////
		myGraphic = graphic._graphicsLayer;
		//Selects the graphic you hover over
		graphic._graphicsLayer.on("mouse-over",function hoverme(evt){
			//ctxMenuForGraphics.addChild(XYMenu);
			ctxMenuForGraphics.addChild(MoveMenu);
			ctxMenuForGraphics.addChild(RoScMenu);
			ctxMenuForGraphics.addChild(SepMenu);
			ctxMenuForGraphics.addChild(MenuDelete);
			selected = evt.graphic;
			if (selected.symbol.style == "circle" || selected.symbol.type == "picturemarkersymbol" ){
					//ctxMenuForGraphics.removeChild(EditMenu);
					ctxMenuForGraphics.removeChild(RoScMenu);
					ctxMenuForGraphics.removeChild(SepMenu);
					ctxMenuForGraphics.removeChild(MenuDelete);
					ctxMenuForGraphics.removeChild(MoveMenu);
					ctxMenuForGraphics.addChild(MoveMenu);
					ctxMenuForGraphics.addChild(XYMenu);
					ctxMenuForGraphics.addChild(SepMenu);
					ctxMenuForGraphics.addChild(MenuDelete);
			} else {
					ctxMenuForGraphics.removeChild(XYMenu);
			}
					
			//Gets the position of the current graphic to place edit box
			ctxMenuForGraphics.bindDomNode(evt.graphic.getDojoShape().getNode());
		});
		
		 graphic._graphicsLayer.on("mouse-out", function(evt) {
            ctxMenuForGraphics.unBindDomNode(evt.graphic.getDojoShape().getNode());
          });
		//////////////////////////////////////////		 

        if(geometry.type === 'extent'){
          var a = geometry;
          var polygon = new Polygon(a.spatialReference);
          var r=[[a.xmin,a.ymin],[a.xmin,a.ymax],[a.xmax,a.ymax],[a.xmax,a.ymin],[a.xmin,a.ymin]];
          polygon.addRing(r);
          geometry = polygon;
          commontype = 'polygon';
        }
        if(commontype === 'polyline'){
          if(this.showMeasure.checked){
            this._addLineMeasure(geometry);
          }
        }
        else if(commontype === 'polygon'){
          if(this.showMeasure.checked){
            this._addPolygonMeasure(geometry);
          }
        }
      },

      _initUnitSelect:function(){
        this._initDefaultUnits();
        this._initConfigUnits();
        var a = this.configDistanceUnits;
        var b = this.defaultDistanceUnits;
        this.distanceUnits = a.length > 0 ? a : b;
        var c = this.configAreaUnits;
        var d = this.defaultAreaUnits;
        this.areaUnits = c.length > 0 ? c : d;
        array.forEach(this.distanceUnits,lang.hitch(this,function(unitInfo){
          var option = {
            value:unitInfo.unit,
            label:unitInfo.label
          };
          this.distanceUnitSelect.addOption(option);
        }));

        array.forEach(this.areaUnits,lang.hitch(this,function(unitInfo){
          var option = {
            value:unitInfo.unit,
            label:unitInfo.label
          };
          this.areaUnitSelect.addOption(option);
        }));
      },

      _initDefaultUnits:function(){
        this.defaultDistanceUnits = [{
          unit: 'KILOMETERS',
          label: this.nls.kilometers
        }, {
          unit: 'MILES',
          label: this.nls.miles
        }, {
          unit: 'METERS',
          label: this.nls.meters
        }, {
          unit: 'FEET',
          label: this.nls.feet
        }, {
          unit: 'YARDS',
          label: this.nls.yards
        }];

        this.defaultAreaUnits = [{
          unit: 'SQUARE_KILOMETERS',
          label: this.nls.squareKilometers
        }, {
          unit: 'SQUARE_MILES',
          label: this.nls.squareMiles
        }, {
          unit: 'ACRES',
          label: this.nls.acres
        }, {
          unit: 'HECTARES',
          label: this.nls.hectares
        }, {
          unit: 'SQUARE_METERS',
          label: this.nls.squareMeters
        }, {
          unit: 'SQUARE_FEET',
          label: this.nls.squareFeet
        }, {
          unit: 'SQUARE_YARDS',
          label: this.nls.squareYards
        }];
      },

      _initConfigUnits:function(){
        array.forEach(this.config.distanceUnits,lang.hitch(this,function(unitInfo){
          var unit = unitInfo.unit;
          if(esriUnits[unit]){
            var defaultUnitInfo = this._getDefaultDistanceUnitInfo(unit);
            unitInfo.label = defaultUnitInfo.label;
            this.configDistanceUnits.push(unitInfo);
          }
        }));

        array.forEach(this.config.areaUnits,lang.hitch(this,function(unitInfo){
          var unit = unitInfo.unit;
          if(esriUnits[unit]){
            var defaultUnitInfo = this._getDefaultAreaUnitInfo(unit);
            unitInfo.label = defaultUnitInfo.label;
            this.configAreaUnits.push(unitInfo);
          }
        }));
      },

      _getDefaultDistanceUnitInfo:function(unit){
        for(var i=0;i<this.defaultDistanceUnits.length;i++){
          var unitInfo = this.defaultDistanceUnits[i];
          if(unitInfo.unit === unit){
            return unitInfo;
          }
        }
        return null;
      },

      _getDefaultAreaUnitInfo:function(unit){
        for(var i=0;i<this.defaultAreaUnits.length;i++){
          var unitInfo = this.defaultAreaUnits[i];
          if(unitInfo.unit === unit){
            return unitInfo;
          }
        }
        return null;
      },

      _getDistanceUnitInfo:function(unit){
        for(var i=0;i<this.distanceUnits.length;i++){
          var unitInfo = this.distanceUnits[i];
          if(unitInfo.unit === unit){
            return unitInfo;
          }
        }
        return null;
      },

      _getAreaUnitInfo:function(unit){
        for(var i=0;i<this.areaUnits.length;i++){
          var unitInfo = this.areaUnits[i];
          if(unitInfo.unit === unit){
            return unitInfo;
          }
        }
        return null;
      },

      _setMeasureVisibility:function(){
        html.setStyle(this.measureSection,'display','none');
        html.setStyle(this.areaMeasure,'display','none');
        html.setStyle(this.distanceMeasure,'display','none');
        var lineDisplay = html.getStyle(this.lineSection,'display');
        var polygonDisplay = html.getStyle(this.polygonSection,'display');
        if(lineDisplay === 'block'){
          html.setStyle(this.measureSection,'display','block');
          if(this.showMeasure.checked){
            html.setStyle(this.distanceMeasure,'display','block');
          }
        }
        else if(polygonDisplay === 'block'){
          html.setStyle(this.measureSection,'display','block');
          if(this.showMeasure.checked){
            html.setStyle(this.areaMeasure,'display','block');
            html.setStyle(this.distanceMeasure,'display','block');
          }
        }
      },

      _getPointSymbol: function() {
        return this.pointSymChooser.getSymbol();
      },

      _getLineSymbol: function() {
        return this.lineSymChooser.getSymbol();
      },

      _getPolygonSymbol: function() {
        return this.fillSymChooser.getSymbol();
      },

      _getTextSymbol: function() {
        return this.textSymChooser.getSymbol();
      },

      _setDrawDefaultSymbols: function() {
        this.drawBox.setPointSymbol(this._getPointSymbol());
        this.drawBox.setLineSymbol(this._getLineSymbol());
        this.drawBox.setPolygonSymbol(this._getPolygonSymbol());
      },
	  ///////////////////////////////////////////////////////////
	  onOpen: function() {
		var mapFrame = this;
	    var map = this.map;
		function sniffWKID (){
			if (map.spatialReference.wkid == "102100") {
				console.log("Good to go!");
				Spat = "geo";
			} else {
				Spatialutils.loadResource();
				var WKTCurrent = Spatialutils.getCSStr(map.spatialReference.wkid);
				function mapSpat (){
					console.log("test");
					if (WKTCurrent.charAt(0) == 'G'){
						Spat = "geo";
					} else {
						Spat = "proj";
					}
				};
				mapSpat();
			}
		};
	  
		sniffWKID ();
	  
		editToolbar = new Edit(map);
		map.on("click", function(evt) {
            editToolbar.deactivate();
          });
		//Creates the right-click menu  
		function createGraphicsMenu() {
			ctxMenuForGraphics = new Menu({});
			ctxMenuForGraphics.addChild(new MenuItem({ 
				label: "Edit",
				onClick: function() {
					if ( selected.geometry.type !== "point" ) {
						editToolbar.activate(Edit.EDIT_VERTICES, selected);
					} else {
						editToolbar.activate(Edit.MOVE | Edit.EDIT_VERTICES | Edit.EDIT_TEXT | Edit.SCALE, selected);
					}
				} 
			}));
			//Right-click Move
		    MoveMenu = new MenuItem({
                label: "Move",
                onClick: function () {
                    editToolbar.activate(Edit.MOVE, selected);
                }
            })
			//Right-click Rotate/Scale
            RoScMenu = new MenuItem({
                label: "Rotate/Scale",
                onClick: function () {
					editToolbar.activate(Edit.ROTATE | Edit.SCALE, selected);
                }
            })
			SepMenu = new MenuSeparator();
			//Right-click Delete
			MenuDelete = new MenuItem({
                label: "Delete",
                onClick: function () {
					myGraphic.remove(selected);			
				}
             });
			 
			XYMenu = new MenuItem({
				label: "Add X/Y",
				onClick: function () {
					var newColor = new Color([0,0,0,1]);
					var a = Font.STYLE_ITALIC;
					var b = Font.VARIANT_NORMAL;
					var c = Font.WEIGHT_BOLD;
					if (Spat == "geo"){
						var mapPoint =  selected.geometry;
						var locPoint = webMercatorUtils.webMercatorToGeographic(mapPoint);
						var lat =  number.format(locPoint.y,{places:5});
						var longi =  number.format(locPoint.x,{places:5});
						var textSymbol = new TextSymbol(
						"Lat: " + (lat) + ", Long: "  + (longi)).setColor(
						new Color(newColor)).setAlign(Font.ALIGN_MIDDLE).setAngle(0).setOffset(5, 5).setFont(
						new Font("16px",a,b,c, "Courier"));
					} else {
						var mapPoint =  selected.geometry;
						var Xdig =  number.format(mapPoint.x,{places:5});
						var Ydig =  number.format(mapPoint.y,{places:5});
						var textSymbol = new TextSymbol(
						"X: " + (Xdig) + ", Y: "  + (Ydig)).setColor(
						new Color(newColor)).setAlign(Font.ALIGN_MIDDLE).setAngle(0).setOffset(5, 5).setFont(
						new Font("16px",a,b,c, "Courier"));
					}
					var labelPointGraphic = new Graphic(mapPoint, textSymbol);
					myGraphic.add(labelPointGraphic);
				}
			});
			
			ctxMenuForGraphics.startup();
	  
	  };
	  createGraphicsMenu() ;
	  },
	  //////////////////////////////////////////////////////////////////
      onClose: function() {
        this.drawBox.deactivate();
      },

      _addLineMeasure:function(geometry){
        var a = Font.STYLE_ITALIC;
        var b = Font.VARIANT_NORMAL;
        var c = Font.WEIGHT_BOLD;
        var symbolFont = new Font("16px",a,b,c, "Courier");
        var fontColor = new Color([0,0,0,1]);
        var ext = geometry.getExtent();
        var center = ext.getCenter();
        var geoLine = webMercatorUtils.webMercatorToGeographic(geometry);
        var unit = this.distanceUnitSelect.value;
        var lengths = geodesicUtils.geodesicLengths([geoLine],esriUnits[unit]);
        var abbr = this._getDistanceUnitInfo(unit).label;
        var localeLength = jimuUtils.localizeNumber(lengths[0].toFixed(1));
        var length = localeLength + " " + abbr;
        var textSymbol = new TextSymbol(length,symbolFont,fontColor);
        var labelGraphic = new Graphic(center,textSymbol,null,null);
        this.drawBox.addGraphic(labelGraphic);
      },

      _addPolygonMeasure:function(geometry){
        var a = Font.STYLE_ITALIC;
        var b = Font.VARIANT_NORMAL;
        var c = Font.WEIGHT_BOLD;
        var symbolFont = new Font("16px",a,b,c, "Courier");
        var fontColor = new Color([0,0,0,1]);
        var ext = geometry.getExtent();
        var center = ext.getCenter();
        var geoPolygon = webMercatorUtils.webMercatorToGeographic(geometry);
        var areaUnit = this.areaUnitSelect.value;
        var areaAbbr = this._getAreaUnitInfo(areaUnit).label;
        var areas = geodesicUtils.geodesicAreas([geoPolygon],esriUnits[areaUnit]);
        var localeArea = jimuUtils.localizeNumber(areas[0].toFixed(1));
        var area = localeArea + " " + areaAbbr;

        var polyline = new Polyline(geometry.spatialReference);
        var points = geometry.rings[0];
        points = points.slice(0,points.length-1);
        polyline.addPath(points);
        var geoPolyline = webMercatorUtils.webMercatorToGeographic(polyline);
        var lengthUnit = this.distanceUnitSelect.value;
        var lengthAbbr = this._getDistanceUnitInfo(lengthUnit).label;
        var lengths = geodesicUtils.geodesicLengths([geoPolyline],esriUnits[lengthUnit]);
        var localeLength = jimuUtils.localizeNumber(lengths[0].toFixed(1));
        var length = localeLength + " " + lengthAbbr;
        var text = area + "    " + length;
        var textSymbol = new TextSymbol(text,symbolFont,fontColor);
        var labelGraphic = new Graphic(center,textSymbol,null,null);
        this.drawBox.addGraphic(labelGraphic);
      },

      destroy: function() {
        if(this.drawBox){
          this.drawBox.destroy();
          this.drawBox = null;
        }
        if(this.pointSymChooser){
          this.pointSymChooser.destroy();
          this.pointSymChooser = null;
        }
        if(this.lineSymChooser){
          this.lineSymChooser.destroy();
          this.lineSymChooser = null;
        }
        if(this.fillSymChooser){
          this.fillSymChooser.destroy();
          this.fillSymChooser = null;
        }
        if(this.textSymChooser){
          this.textSymChooser.destroy();
          this.textSymChooser = null;
        }
        this.inherited(arguments);
      },

      startup: function() {
        this.inherited(arguments);
        this.viewStack.startup();
        this.viewStack.switchView(null);
      }
    });
  });