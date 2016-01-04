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
    'dojo/_base/Color',
    'dojo/on',
    'dojo/sniff',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/TooltipDialog',
    'dijit/popup',
    'dojo/text!./Preview.html',
    'dojox/charting/Chart',
    'dojox/charting/axis2d/Default',
    'dojox/charting/axis2d/Invisible',
    'dojox/charting/plot2d/Columns',
    'dojox/charting/plot2d/Bars',
    'dojox/charting/plot2d/Lines',
    'dojox/charting/plot2d/Pie',
    'dojox/charting/plot2d/ClusteredColumns',
    'dojox/charting/plot2d/ClusteredBars',
    'dojox/charting/action2d/Tooltip',
    'dojox/charting/action2d/Highlight',
    'dojox/charting/action2d/MoveSlice',
    'dojox/charting/action2d/Magnify',
    'dojox/charting/SimpleTheme',
    'esri/symbols/jsonUtils',
    'esri/graphic',
    'esri/graphicsUtils',
    'esri/lang',
    'jimu/utils',
    './common/Parameters',
    'jimu/dijit/LoadingIndicator',
    'dojox/charting/action2d/MouseIndicator'
  ],
  function(declare, lang, array, html, query, Color, on, has, _WidgetBase, _TemplatedMixin,
    _WidgetsInTemplateMixin, TooltipDialog, dojoPopup, template, Chart, DefaultAxis, InvisibleAxis,
    Columns, Bars, Lines, Pie, ClusteredColumns, ClusteredBars, Tooltip, Highlight,
    MoveSlice, Magnify, SimpleTheme, symbolJsonUtils, Graphic, graphicsUtils, esriLang, jimuUtils,
    Parameters) {

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-chart-preview',
      templateString: template,

      charts:[],
      paramsDijits: [],
      tooltipDialogs: [],
      currentChartIndex: -1,
      layerDefinition: null,
      config: null,
      featureSet: null,
      map: null,// if used in setting page, it is null
      resultLayer: null,//if used in setting page, it is null
      tempGraphics: null,
      maxHorLabelSpace: 100,
      maxVerLabelSpace: 100,
      folderUrl: '',
      maxPreviewFeaturesCount: 20,
      pieScale: 1.1,

      //public methods
      //resize
      //createCharts
      //clear

      postCreate: function(){
        this.inherited(arguments);
        if(this.map){
          this.own(on(document.body, 'click', lang.hitch(this, this._onDocumentBodyClick)));
        }
        else{
          html.destroy(this.settingsIcon);
        }
      },

      onClose: function(){
        this._hideAllTooltipDialogs();
      },

      destroy: function(){
        this.clear();
        this.inherited(arguments);
      },

      resize: function(){
        if(this.currentChartIndex >= 0){
          //this._showChart(this.currentChartIndex);
          this._recreateChart(this.currentChartIndex);
        }
      },

      _calculateChartBox: function(){
        var thisBox = html.getContentBox(this.domNode);
        var headerBox = html.getMarginBox(this.resultsHeader);
        var descriptionBox = html.getMarginBox(this.descriptionNode);
        var itemHeight = thisBox.h - headerBox.h - descriptionBox.h;
        /*query('.chart-section-item', this.domNode).forEach(lang.hitch(this, function(domItem) {
          html.setStyle(domItem, 'height', itemHeight + 'px');
        }));*/
        var arrowHeight = 60;
        if(itemHeight < arrowHeight){
          arrowHeight = itemHeight;
        }
        html.setStyle(this.leftArrow, 'height', arrowHeight + 'px');
        html.setStyle(this.rightArrow, 'height', arrowHeight + 'px');
        html.setStyle(this.chartContainer, 'height', itemHeight + 'px');
        var box = html.getContentBox(this.chartContainer);
        return box;
      },

      createCharts: function(args) {
        try{
          this.loading.hide();
          //args: {config,featureSet,layerDefinition,resultLayer}
          this.clear();

          if(!this.map){
            //run in setting page
            var maxCount = this.maxPreviewFeaturesCount;
            if(args.featureSet.features.length > maxCount){
              args.featureSet.features = args.featureSet.features.slice(0, maxCount);
            }
          }

          //important
          html.setStyle(this.resultsSection, 'display', 'block');
          html.setStyle(this.noresultsSection, 'display', 'none');

          query('.chart-section-item', this.domNode).forEach(lang.hitch(this, function(domItem){
            html.setStyle(domItem, 'height', 0);
          }));

          this.config = args.config;
          this.featureSet = args.featureSet;
          this.layerDefinition = args.layerDefinition;
          this.resultLayer = args.resultLayer;

          this.chartTitle.innerHTML = jimuUtils.stripHTML(this.config.name || "");
          this.chartTitle.title = this.chartTitle.innerHTML;
          this.descriptionNode.innerHTML = jimuUtils.stripHTML(this.config.description || "");

          html.setStyle(this.resultsSection, 'display', 'block');

          var i = 0, chartDiv, chartDivs = [];

          var types = this._getTypes(args.config);

          var box = this._calculateChartBox();
          var w = box.w + 'px';
          var h = box.h + 'px';

          for(i = 0; i < types.length; i++){
            chartDiv = html.create('div', {
              'class': 'chart-div',
              style: {
                width: w,
                height: h
              }
            }, this.chartContainer);
            chartDivs.push(chartDiv);
            var strLi = "<li class='paging-li'><a class='paging-a'></a></li>";
            var domLi = html.toDom(strLi);
            html.place(domLi, this.pagingUl);
          }

          var config = args.config;
          var createResult = null;//{charts:[],paramsDijits:[]}
          if(config.mode === 'feature'){
            createResult = this._createFeatureModeCharts(args, chartDivs);
          }
          else if(config.mode === 'category'){
            createResult = this._createCategoryModeCharts(args, chartDivs);
          }
          else if(config.mode === 'count'){
            createResult = this._createCountModeCharts(args, chartDivs);
          }
          else if(config.mode === 'field'){
            createResult = this._createFieldModeCharts(args, chartDivs);
          }

          this.charts = createResult.charts;
          this.paramsDijits = createResult.paramsDijits;
          this.tooltipDialogs = array.map(this.paramsDijits, lang.hitch(this, function(paramsDijit){
            var ttdContent = html.create('div');
            paramsDijit.placeAt(ttdContent);
            var tooltipDialog = new TooltipDialog({
              content: ttdContent
            });
            return tooltipDialog;
          }));

          if(this.map){
            //only bind change event of paramsDijits when preview runs in Widget
            array.forEach(this.paramsDijits, lang.hitch(this, function(paramsDijit, index) {
              this.own(on(paramsDijit, 'change', lang.hitch(this, function() {
                paramsDijit.showShelter();
                this._recreateChart(index);
                paramsDijit.hideShelter();
              })));
            }));
          }

          this._showChart(0);

          //features has been filtered
          if(args.featureSet.features.length === 0){
            html.setStyle(this.resultsSection, 'display', 'none');
            html.setStyle(this.noresultsSection, 'display', 'block');
          }
        }
        catch(e){
          console.error(e);
        }
      },

      _onDocumentBodyClick: function(event){
        if(this.currentChartIndex >= 0 && this.tooltipDialogs){
          var tooltipDialog = this.tooltipDialogs[this.currentChartIndex];
          if(tooltipDialog){
            var originalOpenStatus = !!tooltipDialog.isOpendNow;
            this._hideAllTooltipDialogs();
            var target = event.target || event.srcElement;
            if(target === this.leftArrow || target === this.rightArrow){
              return;
            }
            if(html.hasClass(target, 'paging-a') || html.hasClass(target, 'paging-li')){
              return;
            }
            var isClickSettingIcon = target === this.settingsIcon;
            if(isClickSettingIcon){
              if(originalOpenStatus){
                this._hideTooltipDialog(tooltipDialog);
              }
              else{
                this._showTooltipDialog(tooltipDialog);
              }
            }
            else{
              var a = target === tooltipDialog.domNode;
              var b = html.isDescendant(target, tooltipDialog.domNode);
              var isClickInternal = a || b;
              if(isClickInternal){
                if(originalOpenStatus){
                  this._showTooltipDialog(tooltipDialog);
                }
                else{
                  this._hideTooltipDialog(tooltipDialog);
                }
              }
              else{
                this._hideTooltipDialog(tooltipDialog);
              }
            }
          }
          else{
            this._hideAllTooltipDialogs();
          }
        }
        else{
          this._hideAllTooltipDialogs();
        }
      },

      clear: function(){
        this.config = null;
        this.featureSet = null;
        this.layerDefinition = null;
        this.resultLayer = null;
        this.chartTitle.innerHTML = "";
        this.chartTitle.title = "";
        this.descriptionNode.innerHTML = "";
        this.currentChartIndex = -1;
        var chartDivs = query('.chart-div', this.chartContainer);
        chartDivs.style({display:'none'});
        query("li", this.pagingUl).removeClass('selected');
        this._hideAllTooltipDialogs();

        if(!this.charts){
          this.charts = [];
        }

        if(!this.paramsDijits){
          this.paramsDijits = [];
        }

        if(!this.tooltipDialogs){
          this.tooltipDialogs = [];
        }

        for(var i = 0; i < this.charts.length; i++){
          //destroy chart
          if(this.charts[i]){
            this.charts[i].destroy();
          }
          this.charts[i] = null;

          //destroy paramsDijit
          if(this.paramsDijits[i]){
            this.paramsDijits[i].destroy();
          }
          this.paramsDijits[i] = null;

          //destroy tooltipDialog
          if(this.tooltipDialogs[i]){
            this.tooltipDialogs[i].destroy();
          }
          this.tooltipDialogs[i] = null;
        }
        this.charts = [];
        this.paramsDijits = [];
        this.tooltipDialogs = [];
        html.empty(this.pagingUl);
        html.empty(this.chartContainer);
        html.setStyle(this.resultsSection, 'display', 'none');
        html.setStyle(this.noresultsSection, 'display', 'none');
      },

      _recreateChart: function(index){
        //should not execute _showChart method in _recreateChart method
        //because _showChart maybe execute _recreateChart
        if(index < 0){
          return null;
        }
        if(index !== this.currentChartIndex){
          //should only recreate current chart
          return null;
        }
        if(!this.charts || !this.charts[index]){
          return null;
        }

        this.loading.show();
        var chartDivs = query('.chart-div', this.chartContainer);
        var chartDiv = chartDivs[index];
        html.setStyle(chartDiv, 'display', 'block');
        var chartBox = this._calculateChartBox();
        html.setStyle(chartDiv, 'width', chartBox.w + 'px');
        html.setStyle(chartDiv, 'height', chartBox.h + 'px');

        var createSelf = this.charts[index].createSelf;
        this.charts[index].createSelf = null;
        this.charts[index].destroy();
        this.charts[index] = null;
        this.charts[index] = createSelf();
        this.loading.hide();

        return this.charts[index];
      },

      _showChart: function(index) {
        this.currentChartIndex = -1;
        var chartDivs = query('.chart-div', this.chartContainer);
        chartDivs.style({
          display: 'none'
        });
        var lis = query("li", this.pagingUl);
        lis.removeClass('selected');

        if (index < 0) {
          return;
        }

        var chartDiv = chartDivs[index];
        if (chartDiv) {
          this.currentChartIndex = index;
          html.setStyle(chartDiv, 'display', 'block');
        }

        var li = lis[index];
        if (li) {
          html.addClass(li, 'selected');
        }

        var chart = null;
        if(this.charts && this.charts.length > 0){
          chart = this.charts[index];
          if(chart){
            var chartBox = this._calculateChartBox();
            var currentChartBox = html.getContentBox(chartDiv);
            if(chartBox.w !== currentChartBox.w || chartBox.h !== currentChartBox.h){
              this.loading.show();
              //size changes
              if(has('svg')){
                html.setStyle(chartDiv, 'width', chartBox.w + 'px');
                html.setStyle(chartDiv, 'height', chartBox.h + 'px');
                var plot = chart.getPlot('default');
                if(plot && plot.declaredClass === "dojox.charting.plot2d.Pie") {
                  if (plot.opt) {
                    var radius = Math.floor(Math.min(chartBox.w, chartBox.h) / 2 / this.pieScale);
                    radius -= 3;
                    plot.opt.radius = radius;
                  }
                }
                chart.resize(chartBox.w, chartBox.h);
              }
              else{
                //chart will fail to resize in IE7 & IE8 because of vml, so recreate it
                this._recreateChart(index);
              }
              this.loading.hide();
            }
          }
        }
      },

      _hideAllTooltipDialogs: function(){
        if(this.tooltipDialogs && this.tooltipDialogs.length > 0){
          array.forEach(this.tooltipDialogs, lang.hitch(this, function(tooltipDialog){
            this._hideTooltipDialog(tooltipDialog);
          }));
        }
      },

      _hideTooltipDialog: function(tooltipDialog){
        if(tooltipDialog){
          dojoPopup.close(tooltipDialog);
          tooltipDialog.isOpendNow = false;
        }
      },

      _showTooltipDialog: function(tooltipDialog) {
        if(tooltipDialog){
          dojoPopup.open({
            popup: tooltipDialog,
            around: this.settingsIcon
          });
          tooltipDialog.isOpendNow = true;
        }
      },

      _onPagingUlClicked: function(event){
        event.stopPropagation();
        this._hideAllTooltipDialogs();
        var target = event.target || event.srcElement;
        var tagName = target.tagName.toLowerCase();
        if (tagName === 'a') {
          var as = query('a', this.pagingUl);
          var index = array.indexOf(as, target);
          if (index >= 0) {
            this._showChart(index);
          }
        }
      },

      _onLeftArrowClicked: function(event){
        event.stopPropagation();
        this._hideAllTooltipDialogs();
        var index = (this.currentChartIndex - 1 + this.charts.length) % this.charts.length;
        if (index >= 0) {
          this._showChart(index);
        }
      },

      _onRightArrowClicked: function(event){
        event.stopPropagation();
        this._hideAllTooltipDialogs();
        var index = (this.currentChartIndex + 1 + this.charts.length) % this.charts.length;
        if (index >= 0) {
          this._showChart(index);
        }
      },

      _getHighLightMarkerSymbol:function(){
        var sym = symbolJsonUtils.fromJson(this.config.symbol);
        var size = Math.max(sym.size || 0, sym.width || 0, sym.height, 18);
        size += 1;

        var symJson = {
          "color": [255, 255, 255, 0],
          "size": 18,
          "angle": 0,
          "xoffset": 0,
          "yoffset": 0,
          "type": "esriSMS",
          "style": "esriSMSSquare",
          "outline": {
            "color": [0, 0, 128, 255],
            "width": 0.75,
            "type": "esriSLS",
            "style": "esriSLSSolid"
          }
        };
        var symbol = symbolJsonUtils.fromJson(symJson);
        symbol.setSize(size);
        symbol.outline.setColor(new Color(this.config.highLightColor));

        return symbol;
      },

      _getHighLightLineSymbol: function(){
        var selectedSymJson = {
          "color": [0, 255, 255, 255],
          "width": 1.5,
          "type": "esriSLS",
          "style": "esriSLSSolid"
        };
        var symbol = symbolJsonUtils.fromJson(selectedSymJson);
        symbol.setColor(new Color(this.config.highLightColor));
        return symbol;
      },

      _getHighLightFillSymbol:function(){
        var symbol = symbolJsonUtils.fromJson(this.config.symbol);
        var outlineSymJson = {
          "color": [0, 255, 255, 255],
          "width": 1.5,
          "type": "esriSLS",
          "style": "esriSLSSolid"
        };
        var outlineSym = symbolJsonUtils.fromJson(outlineSymJson);
        outlineSym.setColor(new Color(this.config.highLightColor));
        symbol.setOutline(outlineSym);
        return symbol;
      },

      _zoomToGraphics: function(features){
        var isVisible = this.resultLayer && this.resultLayer.visible;
        if(!isVisible){
          return;
        }

        if(features && features.length > 0){
          var extent = null;
          try{
            //some graphics maybe don't have geometry, so need to filter graphics here by geometry
            var fs = array.filter(features, function(f){
              return !!f.geometry;
            });
            if(fs.length > 0){
              extent = graphicsUtils.graphicsExtent(fs);
            }
          }
          catch(e){
            console.error(e);
          }

          if(extent){
            this.map.setExtent(extent.expand(1.4));
          }
          else{
            var firstFeature = features[0];
            var geometry = firstFeature && firstFeature.geometry;

            if(geometry){
              var singlePointFlow = lang.hitch(this, function(centerPoint){
                var maxLevel = this.map.getNumLevels();
                var currentLevel = this.map.getLevel();
                var level2 = Math.floor(maxLevel * 2 / 3);
                var zoomLevel = Math.max(currentLevel, level2);
                this.map.setLevel(zoomLevel).then(lang.hitch(this, function(){
                  this.map.centerAt(centerPoint);
                }));
              });

              if(geometry.type === 'point'){
                singlePointFlow(geometry);
              }
              else if(geometry.type === 'multipoint'){
                if(geometry.points.length === 1){
                  singlePointFlow(geometry.getPoint(0));
                }
              }
            }
          }
        }
      },

      _removeTempGraphics: function(){
        if(this.resultLayer && this.tempGraphics && this.tempGraphics.length > 0){
          while(this.tempGraphics.length > 0){
            this.resultLayer.remove(this.tempGraphics[0]);
            this.tempGraphics.splice(0, 1);
          }
        }
        this.tempGraphics = null;
      },

      _mouseOverChartItem: function(features){
        this._removeTempGraphics();

        var isVisible = this.resultLayer && this.resultLayer.visible;
        if(!isVisible){
          return;
        }

        var geoType = jimuUtils.getTypeByGeometryType(this.layerDefinition.geometryType);
        var symbol = null;
        if(geoType === 'point'){
          symbol = this._getHighLightMarkerSymbol();
          this.tempGraphics = [];
          array.forEach(features, lang.hitch(this, function(feature){
            var g = new Graphic(feature.geometry, symbol);
            this.tempGraphics.push(g);
            this.resultLayer.add(g);
          }));
        }
        else if(geoType === 'polyline' || geoType === 'polygon'){
          if(geoType === 'polyline'){
            symbol = this._getHighLightLineSymbol();
          }
          else{
            symbol = this._getHighLightFillSymbol();
          }

          array.forEach(features, lang.hitch(this, function(feature) {
            feature.setSymbol(symbol);
          }));

          if(this.featureSet.features.length !== features.length && geoType === 'polygon'){
            array.forEach(features, lang.hitch(this, function(feature){
              this.resultLayer.remove(feature);
            }));
            array.forEach(features, lang.hitch(this, function(feature){
              this.resultLayer.add(feature);
            }));
          }
        }
      },

      _mouseOutChartItem: function(){
        this._removeTempGraphics();

        if(!this.resultLayer){
          return;
        }

        array.forEach(this.resultLayer.graphics, lang.hitch(this, function(feature){
          feature.setSymbol(null);
        }));
      },

      _isNumber: function(value){
        var valueType = Object.prototype.toString.call(value).toLowerCase();
        return valueType === "[object number]";
      },

      _tryLocaleNumber: function(value){
        var result = value;
        if(esriLang.isDefined(value) && isFinite(value)){
          try{
            //if pass "abc" into localizeNumber, it will return null
            var a = jimuUtils.localizeNumber(value);
            if(typeof a === "string"){
              result = a;
            }
          }catch(e){
            console.error(e);
          }
        }
        //make sure the retun value is string
        result += "";
        return result;
      },

      _getBestDisplayValue: function(fieldName, value){
        var displayValue = this._tryLocaleNumber(value);

        //check subtype description
        //http://services1.arcgis.com/oC086ufSSQ6Avnw2/arcgis/rest/services/Parcels/FeatureServer/0
        if(this.layerDefinition.typeIdField === fieldName){
          var types = this.layerDefinition.types;
          if(types && types.length > 0){
            var typeObjs = array.filter(types, lang.hitch(this, function(item){
              return item.id === value;
            }));
            if(typeObjs.length > 0){
              displayValue = typeObjs[0].name;
              return displayValue;
            }
          }
        }

        //check codedValue
        //http://jonq/arcgis/rest/services/BugFolder/BUG_000087622_CodedValue/FeatureServer/0
        //http://services1.arcgis.com/oC086ufSSQ6Avnw2/arcgis/rest/services/Parcels/FeatureServer/0
        var fieldInfo = this._getFieldInfo(fieldName);
        if(fieldInfo){
          if(fieldInfo.domain){
            var codedValues = fieldInfo.domain.codedValues;
            if(codedValues && codedValues.length > 0){
              array.some(codedValues, function(item){
                if(item.code === value){
                  displayValue = item.name;
                  return true;
                }else{
                  return false;
                }
              });
            }
          }
        }
        return displayValue;
      },

      _getFieldAliasArray: function(fieldNames){
        var results = array.map(fieldNames, lang.hitch(this, function(fieldName){
          return this._getFieldAlias(fieldName);
        }));
        return results;
      },

      _getFieldAlias: function(fieldName){
        var fieldAlias = fieldName;
        var fieldInfo = this._getFieldInfo(fieldName);
        if(fieldInfo){
          fieldAlias = fieldInfo.alias || fieldAlias;
        }
        return fieldAlias;
      },

      _getFieldInfo: function(fieldName){
        if(this.layerDefinition){
          var fieldInfos = this.layerDefinition.fields;
          for(var i = 0; i < fieldInfos.length; i++){
            if(fieldInfos[i].name === fieldName){
              return fieldInfos[i];
            }
          }
        }
        return null;
      },

      _isNumberField: function(fieldName){
        var numberTypes = ['esriFieldTypeSmallInteger',
                        'esriFieldTypeInteger',
                        'esriFieldTypeSingle',
                        'esriFieldTypeDouble'];
        var isNumber = array.some(this.layerDefinition.fields, lang.hitch(this, function(fieldInfo){
          return fieldInfo.name === fieldName && numberTypes.indexOf(fieldInfo.type) >= 0;
        }));
        return isNumber;
      },

      _getColors: function(paramsConfig, count){
        var colors = [];
        var config = lang.clone(paramsConfig);

        if(config.colors.length === 2){
          //gradient colors
          colors = this._createGradientColors(config.colors[0],
                                              config.colors[config.colors.length - 1],
                                              count);
        }
        else{
          var a = Math.ceil(count / config.colors.length);
          for(var i = 0; i < a; i++){
            colors = colors.concat(config.colors);
          }
          colors = colors.slice(0, count);
        }

        return colors;
      },

      _createPieTheme: function(pieParams, colorCount){
        /* jshint loopfunc:true */
        var config = lang.clone(pieParams);
        var inputColors = config.colors;
        var outputColors = [];
        if(inputColors.length === 2){
          //gradient colors
          outputColors = this._createGradientColors(inputColors[0],
                                                    inputColors[inputColors.length - 1],
                                                    colorCount);
        }
        else{
          if(colorCount <=  inputColors.length){
            outputColors = inputColors;
          }else{
            var inputDojoColors = array.map(inputColors, function(inputColor){
              return new Color(inputColor);
            });
            var minRatio = 0.5;
            var maxRatio = 1.5;
            var deltaRatio = 0.1;
            var count = Math.ceil(colorCount / inputColors.length);
            var offsetCount = Math.floor(count / 2);
            var offsetRatio = deltaRatio * offsetCount;
            minRatio = Math.max(1 - offsetRatio, minRatio);
            maxRatio = Math.min(1 + offsetRatio, maxRatio);

            deltaRatio = (maxRatio - minRatio) / count;
            var ratio = minRatio;

            for(var i = 0; i < count; i++){
              array.forEach(inputDojoColors, lang.hitch(this, function(dojoColor){
                var r = Math.min(Math.floor(dojoColor.r * ratio), 255);
                var g = Math.min(Math.floor(dojoColor.g * ratio), 255);
                var b = Math.min(Math.floor(dojoColor.b * ratio), 255);
                var color = new Color();
                color.r = r;
                color.g = g;
                color.b = b;
                var strColor = color.toHex();
                outputColors.push(strColor);
              }));
              ratio += deltaRatio;
            }
            outputColors = outputColors.slice(0, colorCount);
          }
        }

        var seriesThemes = array.map(outputColors, lang.hitch(this, function(color){
          return {fill: color};
        }));

        var args = {
          series: {
            stroke: {width: 1.5, color: "#fff"}
          },
          seriesThemes: seriesThemes
        };

        var theme = new SimpleTheme(args);
        return theme;
      },

      _createGradientColors: function(firstColor, lastColor, count){
        var colors = [];
        var c1 = new Color(firstColor);
        var c2 = new Color(lastColor);
        var deltaR = (c2.r - c1.r) / count;
        var deltaG = (c2.g - c1.g) / count;
        var deltaB = (c2.b - c1.b) / count;
        var c = new Color();
        var r = 0;
        var g = 0;
        var b = 0;
        for(var i = 0; i < count; i++){
          r = parseInt(c1.r + deltaR * i, 10);
          g = parseInt(c1.g + deltaG * i, 10);
          b = parseInt(c1.b + deltaB * i, 10);
          c.setColor([r, g, b]);
          colors.push(c.toHex());
        }
        return colors;
      },

      _getTypes: function(config){
        var types = [];
        if(config.column){
          types.push('column');
        }
        if(config.pie){
          types.push('pie');
        }
        if(config.bar){
          types.push('bar');
        }
        if(config.line){
          types.push('line');
        }
        return types;
      },

      _calculateHorizontalRotation: function(chartDiv, labels){
        var chartBox = html.getContentBox(chartDiv);
        var rotation = 0;
        var maxLabelCharas = 0;
        array.forEach(labels, lang.hitch(this, function(label){
          maxLabelCharas = Math.max(maxLabelCharas, label.text.length);
        }));
        var maxLabelLength = maxLabelCharas * 7;
        var singleSize = Math.floor((chartBox.w - 100) / labels.length);
        if(singleSize < maxLabelLength  * 1.7){
          rotation = -45;
        }
        return rotation;
      },

      _createParamsDijit: function(type, paramsConfig){
        var options = {
          isInWidget: this.map ? true : false,
          imagesUrl: this.folderUrl + 'common/images',
          type: type,
          nls: this.nls,
          config: paramsConfig
        };
        var paramsDijit = new Parameters(options);
        return paramsDijit;
      },

      _createColumnParamsDijit: function(config){
        return this._createParamsDijit('column', config.column);
      },

      _createBarParamsDijit: function(config){
        return this._createParamsDijit('bar', config.bar);
      },

      _createLineParamsDijit: function(config){
        return this._createParamsDijit('line', config.line);
      },

      _createPieParamsDijit: function(config){
        return this._createParamsDijit('pie', config.pie);
      },

      _getRecreateChartFunction: function(func, args, chartDiv, data, paramsDijit){
        return lang.hitch(this, func, args, chartDiv, data, paramsDijit);
      },

      //---------------create feature mode charts---------------
      _createFeatureModeCharts: function(args, chartDivs){
        var charts = [];
        var paramsDijits = [];
        var config = args.config;
        var labelField = config.labelField;
        var valueFields = config.valueFields;
        var types = this._getTypes(config);
        var isAsc = config.sortOrder !== 'des';

        //filter features with number values firstly
        /*var fs = args.featureSet.features;
        args.featureSet.features = array.filter(fs, lang.hitch(this, function(feature){
          return array.every(valueFields, lang.hitch(this, function(fieldName){
            var attributes = feature.attributes;
            return attributes && this._isNumber(attributes[fieldName]);
          }));
        }));*/

        //[{category:'a',valueFields:[10,100,2],dataFeatures:[f1]}]
        //only one data feature
        var data = [];

        data = array.map(args.featureSet.features, lang.hitch(this, function(feature) {
          var attributes = feature.attributes;
          var option = {
            category: attributes[labelField],
            valueFields: [],
            dataFeatures: [feature]
          };
          option.valueFields = array.map(valueFields, lang.hitch(this, function(fieldName) {
            return attributes[fieldName];
          }));
          return option;
        }));

        if(isAsc){
          data.sort(function(a, b){
            if(a.category < b.category){
              return -1;
            }
            else if(a.category > b.category){
              return 1;
            }
            else{
              return 0;
            }
          });
        }
        else{
          data.sort(function(a, b){
            if(a.category < b.category){
              return 1;
            }
            else if(a.category > b.category){
              return -1;
            }
            else{
              return 0;
            }
          });
        }

        array.forEach(types, lang.hitch(this, function(type, i){
          try {
            var chartDiv = chartDivs[i];
            var chart = null;
            var paramsDijit = null;
            if (type === 'column') {
              paramsDijit = this._createColumnParamsDijit(config);
              chart = this._createFeatureModeColumnChart(args, chartDiv, data, paramsDijit);
            } else if (type === 'bar') {
              paramsDijit = this._createBarParamsDijit(config);
              chart = this._createFeatureModeBarChart(args, chartDiv, data, paramsDijit);
            } else if (type === 'line') {
              paramsDijit = this._createLineParamsDijit(config);
              chart = this._createFeatureModeLineChart(args, chartDiv, data, paramsDijit);
            } else if (type === 'pie') {
              paramsDijit = this._createPieParamsDijit(config);
              chart = this._createFeatureModePieChart(args, chartDiv, data, paramsDijit);
            }
            paramsDijits.push(paramsDijit);
            charts.push(chart);
          } catch (e) {
            console.error(e);
          }
        }));

        return {
          charts: charts,
          paramsDijits: paramsDijits
        };
      },

      _createFeatureModeColumnChart: function(args, chartDiv, data, paramsDijit){
        return this._createCategoryModeColumnChart(args, chartDiv, data, paramsDijit);
      },

      _createFeatureModeBarChart: function(args, chartDiv, data, paramsDijit){
        return this._createCategoryModeBarChart(args, chartDiv, data, paramsDijit);
      },

      _createFeatureModeLineChart: function(args, chartDiv, data, paramsDijit){
        return this._createCategoryModeLineChart(args, chartDiv, data, paramsDijit);
      },

      _createFeatureModePieChart: function(args, chartDiv, data, paramsDijit){
        return this._createCategoryModePieChart(args, chartDiv, data, paramsDijit);
      },

      //--------------------create category mode charts-------------------------
      _createCategoryModeCharts: function(args, chartDivs){
        /*jshint -W083 */
        var charts = [];
        var paramsDijits = [];
        var config = args.config;
        var categoryField = config.categoryField;
        var valueFields = config.valueFields;
        var types = this._getTypes(config);
        var isAsc = config.sortOrder !== 'des';

        //filter features with number values firstly
        /*var fs = args.featureSet.features;
        args.featureSet.features = array.filter(fs, lang.hitch(this, function(feature){
          return array.every(valueFields, lang.hitch(this, function(fieldName){
            var attributes = feature.attributes;
            return attributes && this._isNumber(attributes[fieldName]);
          }));
        }));*/

        var data = [];//[{category:'a',valueFields:[10,100,2],dataFeatures:[f1,f2...]}]

        var operation = args.config.operation;

        var uniqueValuesHash = {}; //{a:{valueFields:[10,100,2], dataFeatures:[f1,f2...]}}

        array.forEach(args.featureSet.features, lang.hitch(this, function(feature) {
          var attributes = feature.attributes;
          var category = attributes[categoryField];
          var categoryObj = null;

          if(uniqueValuesHash.hasOwnProperty(category)){
            categoryObj = uniqueValuesHash[category];
            categoryObj.dataFeatures.push(feature);
          }
          else{
            categoryObj = {
              dataFeatures: [feature]
            };
            uniqueValuesHash[category] = categoryObj;
          }
        }));

        var categoryObj = null;
        for (var uniqueValue in uniqueValuesHash) {
          categoryObj = uniqueValuesHash[uniqueValue];

          if(this._isNumberField(categoryField)){
            //uniqueValue maybe string or null, like "7", null
            //so we should not call this._isNumber(uniqueValue)
            if(esriLang.isDefined(uniqueValue)){
              //convert number string to number
              uniqueValue = parseFloat(uniqueValue);
            }
          }

          //calculate summarize values for one category
          categoryObj.valueFields = array.map(valueFields, lang.hitch(this, function(fieldName){
            //for one category and for one valueField
            var values = array.map(categoryObj.dataFeatures, lang.hitch(this, function(feature){
              return feature.attributes[fieldName];
            }));

            var summarizeValue = 0;
            if (operation === 'max') {
              summarizeValue = -Infinity;
            } else if (operation === 'min') {
              summarizeValue = Infinity;
            }
            //use nonNullValueCount to record how many feature values are not null for the fieldName
            var nonNullValueCount = 0;
            array.forEach(values, lang.hitch(this, function(value){
              if(this._isNumber(value)){
                nonNullValueCount++;
                if(operation === 'average' || operation === 'sum'){
                  summarizeValue += value;
                }
                else if(operation === 'max'){
                  summarizeValue = Math.max(summarizeValue, value);
                }
                else if(operation === 'min'){
                  summarizeValue = Math.min(summarizeValue, value);
                }
              }
            }));

            if(nonNullValueCount > 0){
              if(operation === 'average'){
                //summarizeValue = summarizeValue / values.length;
                summarizeValue = summarizeValue / nonNullValueCount;
              }
            }else{
              //if all values for the fieldName are null, we set summarizeValue to null, no matter
              //what's the value of operation
              summarizeValue = 0;
            }

            return summarizeValue;
          }));

          data.push({
            category: uniqueValue,
            valueFields: categoryObj.valueFields,
            dataFeatures: categoryObj.dataFeatures
          });
        }

        if(isAsc){
          data.sort(function(a, b){
            if(a.category < b.category){
              return -1;
            }
            else if(a.category > b.category){
              return 1;
            }
            else{
              return 0;
            }
          });
        }
        else{
          data.sort(function(a, b){
            if(a.category < b.category){
              return 1;
            }
            else if(a.category > b.category){
              return -1;
            }
            else{
              return 0;
            }
          });
        }

        array.forEach(types, lang.hitch(this, function(type, i){
          try {
            var chartDiv = chartDivs[i];
            var chart = null;
            var paramsDijit = null;
            if (type === 'column') {
              paramsDijit = this._createColumnParamsDijit(config);
              chart = this._createCategoryModeColumnChart(args, chartDiv, data, paramsDijit);
            } else if (type === 'bar') {
              paramsDijit = this._createBarParamsDijit(config);
              chart = this._createCategoryModeBarChart(args, chartDiv, data, paramsDijit);
            } else if (type === 'line') {
              paramsDijit = this._createLineParamsDijit(config);
              chart = this._createCategoryModeLineChart(args, chartDiv, data, paramsDijit);
            } else if (type === 'pie') {
              paramsDijit = this._createPieParamsDijit(config);
              chart = this._createCategoryModePieChart(args, chartDiv, data, paramsDijit);
            }
            paramsDijits.push(paramsDijit);
            charts.push(chart);
          } catch (e) {
            console.error(e);
          }
        }));

        return {
          charts: charts,
          paramsDijits: paramsDijits
        };
      },

      _bindCategoryModeChartEvent: function(chart, data){
        if(this.map){
          chart.connectToPlot('default', lang.hitch(this, function(evt) {
            var isOver = evt.type === 'onmouseover';
            var isOut = evt.type === 'onmouseout';
            var isClick = evt.type === 'onclick';

            if (isOver || isOut || isClick) {
              var a = data[evt.index]; //{category,valueFields,dataFeatures:[f1,f2...]}
              var features = a.dataFeatures;
              if (evt.type === 'onmouseover') {
                this._mouseOverChartItem(features);
              } else if (evt.type === 'onmouseout') {
                this._mouseOutChartItem(features);
              } else if (evt.type === 'onclick') {
                this._zoomToGraphics(features);
              }
            }
          }));
        }
      },

      _createCategoryModeColumnChart: function(args, chartDiv, data, paramsDijit){
        //data:[{category,valueFields,dataFeatures:[f1,f2...]}]
        var config = args.config;
        var valueFields = config.valueFields;
        var valueAliases = this._getFieldAliasArray(valueFields);
        var labelOrCategoryField = config.labelField || config.categoryField;
        var columnParams = paramsDijit.getConfig();
        var labels = [];
        var seriesArray = [];
        for(var i = 0; i < valueFields.length; i++){
          seriesArray.push([]);
        }
        array.forEach(data, lang.hitch(this, function(item, index){
          var text = this._getBestDisplayValue(labelOrCategoryField, item.category);
          labels.push({
            value: index + 1,
            text: text
          });
          for(var i = 0; i < item.valueFields.length; i++){
            var num = item.valueFields[i];
            var fieldName = valueFields[i];
            var aliasName = valueAliases[i];
            var a = this.nls.category;
            var c = this._getBestDisplayValue(fieldName, num);
            seriesArray[i].push({
              y: num,
              tooltip: "<div style='color:green;margin:5px 10px;'>" +
              "<span style='white-space:nowrap'>" + a + " : " + text + "</span><br/><br/>" +
              "<span style='white-space:nowrap;'>" + aliasName + " : " + c + "</span>" +
              "</div>"
            });
          }
        }));

        //construct chart
        var columnChart = new Chart(chartDiv);

        columnChart.setTheme(this._createTransparentTheme());

        columnChart.addPlot('default', {
          type: ClusteredColumns,
          enableCache: true,
          markers: true,
          gap: 10,
          minBarSize: 2,
          maxBarSize: 60
        });

        var rotation = this._calculateHorizontalRotation(chartDiv, labels);

        columnChart.addAxis('x', {
          type: columnParams.horizontalAxis === false ? InvisibleAxis : DefaultAxis,
          natural: true,
          labels: labels,
          rotation: rotation,
          // dropLabels: false,
          majorLabels: true,
          minorLabels: true,
          majorTickStep: 1
          // labelFunc: lang.hitch(this, function(text, value, precision){
          //   return value;
          // })
        });

        columnChart.addAxis('y', {
          type: columnParams.verticalAxis === false ? InvisibleAxis : DefaultAxis,
          vertical: true,
          natural: true,
          includeZero: true
        });

        var colors = this._getColors(columnParams, seriesArray.length);
        for(i = 0; i < seriesArray.length; i++){
          var series = seriesArray[i];
          var fieldName = valueFields[i];
          columnChart.addSeries(fieldName, series, {
            stroke: {
              color: colors[i % colors.length]
            },
            fill: colors[i % colors.length]
          });
        }

        new MoveSlice(columnChart, "default");
        new Highlight(columnChart, "default");
        new Tooltip(columnChart, "default");

        columnChart.render();

        this._bindCategoryModeChartEvent(columnChart, data);

        columnChart.createSelf = this._getRecreateChartFunction(
          this._createCategoryModeColumnChart, args, chartDiv, data, paramsDijit);

        return columnChart;
      },

      _createCategoryModeBarChart: function(args, chartDiv, data, paramsDijit){
        //data:[{category,valueFields,dataFeatures:[f1,f2...]}]
        var config = args.config;
        var valueFields = config.valueFields;
        var valueAliases = this._getFieldAliasArray(valueFields);
        var labelOrCategoryField = config.labelField || config.categoryField;
        var barParams = paramsDijit.getConfig();
        var labels = [];
        var seriesArray = [];
        for(var i = 0; i < valueFields.length; i++){
          seriesArray.push([]);
        }
        array.forEach(data, lang.hitch(this, function(item, index){
          var text = this._getBestDisplayValue(labelOrCategoryField, item.category);
          labels.push({
            value: index + 1,
            text: text
          });
          for(var i = 0; i < item.valueFields.length; i++){
            var num = item.valueFields[i];
            var fieldName = valueFields[i];
            var aliasName = valueAliases[i];
            var a = this.nls.category;
            var c = this._getBestDisplayValue(fieldName, num);
            seriesArray[i].push({
              y: num,
              tooltip: "<div style='color:green;margin:5px 10px;'>" +
              "<span style='white-space:nowrap'>" + a + " : " + text + "</span><br/><br/>" +
              "<span style='white-space:nowrap;'>" + aliasName + " : " + c + "</span>" +
              "</div>"
            });
          }
        }));

        //construct chart
        var barChart = new Chart(chartDiv);

        barChart.setTheme(this._createTransparentTheme());

        barChart.addPlot('default', {
          type: ClusteredBars,
          enableCache: true,
          markers: true,
          gap: 10,
          minBarSize: 2,
          maxBarSize: 60
        });

        barChart.addAxis('x', {
          type: barParams.verticalAxis === false ? InvisibleAxis : DefaultAxis,
          vertical: true,
          natural: true,
          labels: labels,
          majorLabels: true,
          minorLabels: true,
          majorTickStep: 1
        });

        barChart.addAxis('y', {
          type: barParams.horizontalAxis === false ? InvisibleAxis : DefaultAxis,
          natural: true,
          includeZero: true
        });

        var colors = this._getColors(barParams, seriesArray.length);
        for(i = 0; i < seriesArray.length; i++){
          var series = seriesArray[i];
          var fieldName = valueFields[i];
          barChart.addSeries(fieldName, series, {
            stroke: {
              color: colors[i % colors.length]
            },
            fill: colors[i % colors.length]
          });
        }

        new MoveSlice(barChart, "default");
        new Highlight(barChart, "default");
        new Tooltip(barChart, "default");

        barChart.render();

        this._bindCategoryModeChartEvent(barChart, data);

        barChart.createSelf = this._getRecreateChartFunction(
          this._createCategoryModeBarChart, args, chartDiv, data, paramsDijit);

        return barChart;
      },

      _createCategoryModeLineChart: function(args, chartDiv, data, paramsDijit){
        //data:[{category,valueFields,dataFeatures:[f1,f2...]}]
        var config = args.config;
        var valueFields = config.valueFields;
        var valueAliases = this._getFieldAliasArray(valueFields);
        var labelOrCategoryField = config.labelField || config.categoryField;
        var lineParams = paramsDijit.getConfig();
        var labels = [];
        var seriesArray = [];
        for(var i = 0; i < valueFields.length; i++){
          seriesArray.push([]);
        }
        array.forEach(data, lang.hitch(this, function(item, index){
          var text = this._getBestDisplayValue(labelOrCategoryField, item.category);
          labels.push({
            value: index + 1,
            text: text
          });
          for(var i = 0; i < item.valueFields.length; i++){
            //item.valueFields[i] maybe a number or null
            //so num should be a number or NaN
            var num = parseFloat(item.valueFields[i]);
            var fieldName = valueFields[i];
            var aliasName = valueAliases[i];
            var a = this.nls.category;
            var c = this._getBestDisplayValue(fieldName, num);
            var y = isNaN(num) ? 0 : num;
            seriesArray[i].push({
              y: y,
              tooltip: "<div style='color:green;margin:5px 10px;'>" +
              "<span style='white-space:nowrap'>" + a + " : " + text + "</span><br/><br/>" +
              "<span style='white-space:nowrap;'>" + aliasName + " : " + c + "</span>" +
              "</div>"
            });
          }
        }));

        //construct chart
        var lineChart = new Chart(chartDiv);

        lineChart.setTheme(this._createTransparentTheme());

        lineChart.addPlot('default', {
          type: Lines,
          markers: true,
          tension: "X"
        });

        var rotation = this._calculateHorizontalRotation(chartDiv, labels);
        lineChart.addAxis('x', {
          type: lineParams.horizontalAxis === false ? InvisibleAxis : DefaultAxis,
          natural: true,
          includeZero: true,
          labels: labels,
          rotation: rotation,
          majorLabels: true,
          minorLabels: true,
          majorTickStep: 1
        });

        lineChart.addAxis('y', {
          type: lineParams.verticalAxis === false ? InvisibleAxis : DefaultAxis,
          vertical: true,
          natural: true
        });

        var colors = this._getColors(lineParams, seriesArray.length);
        for(i = 0; i < seriesArray.length; i++){
          var series = seriesArray[i];
          var fieldName = valueFields[i];
          lineChart.addSeries(fieldName, series, {
            stroke: {
              color: colors[i % colors.length]
            },
            fill: colors[i % colors.length]
          });
        }

        new Magnify(lineChart, "default");
        new Highlight(lineChart, "default");
        new Tooltip(lineChart, "default");

        lineChart.render();

        this._bindCategoryModeChartEvent(lineChart, data);

        lineChart.createSelf = this._getRecreateChartFunction(
          this._createCategoryModeLineChart, args, chartDiv, data, paramsDijit);

        return lineChart;
      },

      _createCategoryModePieChart: function(args, chartDiv, data, paramsDijit){
        //data:[{category,valueFields,dataFeatures:[f1,f2...]}]
        var config = args.config;
        var valueFields = config.valueFields;
        var valueAliases = this._getFieldAliasArray(valueFields);
        var labelOrCategoryField = config.labelField || config.categoryField;
        var pieParams = paramsDijit.getConfig();
        var box = html.getContentBox(chartDiv);
        var radius = Math.floor(Math.min(box.w, box.h) / 2 / this.pieScale) - 3;

        var labels = [];
        var seriesArray = [];
        var sums = [];
        array.forEach(valueFields, lang.hitch(this, function(dataFieldName, index){
          /*jshint unused: false*/
          seriesArray.push([]);
          var sum = 0.0;
          array.forEach(data, lang.hitch(this, function(item){
            sum += Math.abs(item.valueFields[index]);
          }));
          sums.push(sum);
        }));

        array.forEach(data, lang.hitch(this, function(item, index){
          var text = this._getBestDisplayValue(labelOrCategoryField, item.category);
          labels.push({
            value: index + 1,
            text: text
          });
          for(var i = 0; i < item.valueFields.length; i++){
            var num = item.valueFields[i];
            var fieldName = valueFields[i];
            var aliasName = valueAliases[i];
            var percent = this._tryLocaleNumber((num / sums[i] * 100).toFixed(1)) + "%";
            var a = this.nls.category;
            var c = this._getBestDisplayValue(fieldName, num);
            seriesArray[i].push({
              y: Math.abs(num),
              text: text,
              tooltip: "<div style='color:green;margin:5px 10px;'>" +
              "<span style='white-space:nowrap'>" + a + " : " + text + "</span><br/><br/>" +
              "<span style='white-space:nowrap;'>" + aliasName + " : " + c + "</span><br/><br/>" +
              "<span style='white-space:nowrap'>" + percent + "</span>" +
              "</div>"
            });
          }
        }));

        //construct chart
        var pieChart = new Chart(chartDiv);

        var theme = this._createPieTheme(pieParams, data.length);
        theme.plotarea.fill = "transparent";
        theme.chart.fill = "transparent";
        pieChart.setTheme(theme);

        pieChart.addPlot('default', {
          type: Pie,
          radius: radius,
          labels: !!pieParams.label
        });

        for(var i = 0; i < seriesArray.length; i++){
          var series = seriesArray[i];
          var fieldName = valueFields[i];
          pieChart.addSeries(fieldName, series);
        }

        new MoveSlice(pieChart, "default");
        new Highlight(pieChart, "default");
        new Tooltip(pieChart, "default");

        pieChart.render();

        this._bindCategoryModeChartEvent(pieChart, data);

        pieChart.createSelf = this._getRecreateChartFunction(
          this._createCategoryModePieChart, args, chartDiv, data, paramsDijit);

        return pieChart;
      },

      //------------------------create count mode charts--------------------------
      _createCountModeCharts: function(args, chartDivs){
        var charts = [];
        var paramsDijits = [];
        var config = args.config;
        var types = this._getTypes(config);
        var categoryField = config.categoryField;
        var isAsc = config.sortOrder !== 'des';

        //{fieldValue1:{count:count1,dataFeatures:[f1,f2...]},fieldValue2...}
        var statisticsHash = {};
        array.forEach(args.featureSet.features, lang.hitch(this, function(feature){
          var attributes = feature.attributes;
          var fieldValue = attributes[categoryField];
          var fieldValueObj = null;
          if(statisticsHash.hasOwnProperty(fieldValue)){
            fieldValueObj = statisticsHash[fieldValue];
            fieldValueObj.count++;
            fieldValueObj.dataFeatures.push(feature);
          }
          else{
            fieldValueObj = {
              count: 1,
              dataFeatures: [feature]
            };
            statisticsHash[fieldValue] = fieldValueObj;
          }
        }));
        var data = [];//[{fieldValue:value1,count:count1,dataFeatures:[f1,f2...]}]
        var fieldValueObj = null;
        for(var fieldValue in statisticsHash){
          fieldValueObj = statisticsHash[fieldValue];//{count:count1,dataFeatures:[f1,f2...]}
          if(this._isNumberField(categoryField)){
            //fieldValue maybe string or null, like "7", "null"
            //convert number string to number
            //if fieldValue is "null", fieldValue will be set to NaN
            fieldValue = parseFloat(fieldValue);
          }
          data.push({
            fieldValue: fieldValue,
            count: fieldValueObj.count,
            dataFeatures: fieldValueObj.dataFeatures
          });
        }

        if(isAsc){
          data.sort(function(a, b){
            if(a.fieldValue < b.fieldValue){
              return -1;
            }
            else if(a.fieldValue > b.fieldValue){
              return 1;
            }
            else{
              return 0;
            }
          });
        }
        else{
          data.sort(function(a, b){
            if(a.fieldValue < b.fieldValue){
              return 1;
            }
            else if(a.fieldValue > b.fieldValue){
              return -1;
            }
            else{
              return 0;
            }
          });
        }

        array.forEach(types, lang.hitch(this, function(type, i){
          try {
            var chartDiv = chartDivs[i];
            var chart = null;
            var paramsDijit = null;
            if (type === 'column') {
              paramsDijit = this._createColumnParamsDijit(config);
              chart = this._createCountModeColumnChart(args, chartDiv, data, paramsDijit);
            } else if (type === 'bar') {
              paramsDijit = this._createBarParamsDijit(config);
              chart = this._createCountModeBarChart(args, chartDiv, data, paramsDijit);
            } else if (type === 'line') {
              paramsDijit = this._createLineParamsDijit(config);
              chart = this._createCountModeLineChart(args, chartDiv, data, paramsDijit);
            } else if (type === 'pie') {
              paramsDijit = this._createPieParamsDijit(config);
              chart = this._createCountModePieChart(args, chartDiv, data, paramsDijit);
            }
            paramsDijits.push(paramsDijit);
            charts.push(chart);
          } catch (e) {
            console.error(e);
          }
        }));

        return {
          charts: charts,
          paramsDijits: paramsDijits
        };
      },

      _bindCountModeChartEvent: function(chart, data){
        if(this.map){
          chart.connectToPlot('default', lang.hitch(this, function(evt) {
            var isOver = evt.type === 'onmouseover';
            var isOut = evt.type === 'onmouseout';
            var isClick = evt.type === 'onclick';

            if (isOver || isOut || isClick) {
              var a = data[evt.index]; //{fieldValue:value1,count:count1,dataFeatures:[f1,f2...]}
              var features = a.dataFeatures;
              if (evt.type === 'onmouseover') {
                this._mouseOverChartItem(features);
              } else if (evt.type === 'onmouseout') {
                this._mouseOutChartItem(features);
              } else if (evt.type === 'onclick') {
                this._zoomToGraphics(features);
              }
            }
          }));
        }
      },

      _createCountModeColumnChart: function(args, chartDiv, data, paramsDijit){
        //[{fieldValue:value1,count:count1,dataFeatures:[f1,f2...]}]
        var config = args.config;
        var categoryField = config.categoryField;
        var categoryAlias = this._getFieldAlias(categoryField);
        var columnParams = paramsDijit.getConfig();

        var labels = [];//{value,text}
        var series = [];
        array.forEach(data, lang.hitch(this, function(item, index){
          var num = item.count;
          var fieldValue = item.fieldValue;
          var b = jimuUtils.localizeNumber(num);
          var text = this._getBestDisplayValue(categoryField, fieldValue);
          labels.push({
            value: index + 1,
            text: text
          });
          series.push({
            y: num,
            tooltip: "<div style='color:green;margin:5px 10px;'>" +
            "<span style='white-space:nowrap;'>" + categoryAlias + " : " + text +
            "</span><br/><br/>" +
            "<span style='white-space:nowrap;'>" + this.nls.count + " : " + b + "</span>" +
            "</div>"
          });
        }));

        //construct chart
        var columnChart = new Chart(chartDiv);

        columnChart.setTheme(this._createTransparentTheme());

        columnChart.addPlot('default', {
          type: Columns,
          enableCache: true,
          markers: true,
          gap: 10,
          minBarSize: 2,
          maxBarSize: 60
        });

        var rotation = this._calculateHorizontalRotation(chartDiv, labels);

        columnChart.addAxis('x', {
          type: columnParams.horizontalAxis === false ? InvisibleAxis : DefaultAxis,
          natural: true,
          labels: labels,
          rotation: rotation,
          majorLabels: true,
          minorLabels: true,
          majorTickStep: 1
        });

        columnChart.addAxis('y', {
          type: columnParams.verticalAxis === false ? InvisibleAxis : DefaultAxis,
          vertical: true,
          includeZero: true,
          natural: true
        });

        var colors = this._getColors(columnParams, 1);
        columnChart.addSeries('default', series, {
          stroke: {
            color: colors[0]
          },
          fill: colors[0]
        });

        new MoveSlice(columnChart, "default");
        new Highlight(columnChart, "default");
        new Tooltip(columnChart, "default");

        columnChart.render();

        this._bindCountModeChartEvent(columnChart, data);

        columnChart.createSelf = this._getRecreateChartFunction(
          this._createCountModeColumnChart, args, chartDiv, data, paramsDijit);

        return columnChart;
      },

      _createCountModeBarChart: function(args, chartDiv, data, paramsDijit){
        //[{fieldValue:value1,count:count1,dataFeatures:[f1,f2...]}]
        var config = args.config;
        var categoryField = config.categoryField;
        var categoryAlias = this._getFieldAlias(categoryField);
        var barParams = paramsDijit.getConfig();

        var labels = [];//{value,text}
        var series = [];
        array.forEach(data, lang.hitch(this, function(item, index){
          var num = item.count;
          var fieldValue = item.fieldValue;
          var b = jimuUtils.localizeNumber(num);
          var text = this._getBestDisplayValue(categoryField, fieldValue);
          labels.push({
            value: index + 1,
            text: text
          });
          series.push({
            y: num,
            tooltip: "<div style='color:green;margin:5px 10px;'>" +
            "<span style='white-space:nowrap;'>" + categoryAlias + " : " + text +
            "</span><br/><br/>" +
            "<span style='white-space:nowrap;'>" + this.nls.count + " : " + b + "</span>" +
            "</div>"
          });
        }));

        //construct chart
        var barChart = new Chart(chartDiv);

        barChart.setTheme(this._createTransparentTheme());

        barChart.addPlot('default', {
          type: Bars,
          enableCache: true,
          markers: true,
          gap: 10,
          minBarSize: 2,
          maxBarSize: 60
        });

        barChart.addAxis('x', {
          type: barParams.verticalAxis === false ? InvisibleAxis : DefaultAxis,
          vertical: true,
          natural: true,
          labels: labels,
          majorLabels: true,
          minorLabels: true,
          majorTickStep: 1
        });

        barChart.addAxis('y', {
          type: barParams.horizontalAxis === false ? InvisibleAxis : DefaultAxis,
          includeZero: true,
          natural: true
        });

        var colors = this._getColors(barParams, 1);
        barChart.addSeries('default', series, {
          stroke: {
            color: colors[0]
          },
          fill: colors[0]
        });

        new MoveSlice(barChart, "default");
        new Highlight(barChart, "default");
        new Tooltip(barChart, "default");

        barChart.render();

        this._bindCountModeChartEvent(barChart, data);

        barChart.createSelf = this._getRecreateChartFunction(
          this._createCountModeBarChart, args, chartDiv, data, paramsDijit);

        return barChart;
      },

      _createCountModeLineChart: function(args, chartDiv, data, paramsDijit){
        //[{fieldValue:value1,count:count1,dataFeatures:[f1,f2...]}]
        var config = args.config;
        var categoryField = config.categoryField;
        var categoryAlias = this._getFieldAlias(categoryField);
        var lineParams = paramsDijit.getConfig();

        var labels = [];//{value,text}
        var series = [];

        array.forEach(data, lang.hitch(this, function(item, index){
          var num = item.count;
          var fieldValue = item.fieldValue;
          var b = jimuUtils.localizeNumber(num);
          var text = this._getBestDisplayValue(categoryField, fieldValue);

          labels.push({
            value: index + 1,
            text: text
          });

          series.push({
            y: num,
            text: '',
            tooltip: "<div style='color:green;margin:5px 10px;'>" +
            "<span style='white-space:nowrap;'>" + categoryAlias + " : " + text +
            "</span><br/><br/>" +
            "<span style='white-space:nowrap;'>" + this.nls.count + " : " + b + "</span>" +
            "</div>"
          });
        }));

        //construct chart
        var lineChart = new Chart(chartDiv);

        lineChart.setTheme(this._createTransparentTheme());

        lineChart.addPlot('default', {
          type: Lines,
          markers: true,
          tension: "X"
        });

        var rotation = this._calculateHorizontalRotation(chartDiv, labels);
        lineChart.addAxis('x', {
          type: lineParams.horizontalAxis === false ? InvisibleAxis : DefaultAxis,
          natural: true,
          includeZero: true,
          labels: labels,
          rotation: rotation,
          majorLabels: true,
          minorLabels: true,
          majorTickStep: 1
        });

        lineChart.addAxis('y', {
          type: lineParams.verticalAxis === false ? InvisibleAxis : DefaultAxis,
          vertical: true,
          natural: true
        });

        var colors = this._getColors(lineParams, 1);
        lineChart.addSeries('default', series, {
          stroke: {
            color: colors[0]
          },
          fill: colors[0]
        });

        new Magnify(lineChart, "default");
        new Highlight(lineChart, "default");
        new Tooltip(lineChart, "default");

        lineChart.render();

        this._bindCountModeChartEvent(lineChart, data);

        lineChart.createSelf = this._getRecreateChartFunction(
          this._createCountModeLineChart, args, chartDiv, data, paramsDijit);

        return lineChart;
      },

      _createCountModePieChart: function(args, chartDiv, data, paramsDijit){
        //data:[{fieldValue:value1,count:count1,dataFeatures:[f1,f2...]}]
        var config = args.config;
        var categoryField = config.categoryField;
        var categoryAlias = this._getFieldAlias(categoryField);
        var pieParams = paramsDijit.getConfig();
        var box = html.getContentBox(chartDiv);
        var radius = Math.floor(Math.min(box.w, box.h) / 2 / this.pieScale) - 3;

        var labels = [];//{value,text}
        var series = [];
        var sum = 0.0;
        array.forEach(data, lang.hitch(this, function(item){
          sum += item.count;
        }));

        array.forEach(data, lang.hitch(this, function(item, index){
          var num = item.count;
          var fieldValue = item.fieldValue;
          var text = this._getBestDisplayValue(categoryField, fieldValue);
          var percent = this._tryLocaleNumber((num / sum * 100).toFixed(1)) + "%";
          var b = jimuUtils.localizeNumber(num);
          var c = this.nls.count;

          labels.push({
            value: index + 1,
            text: text
          });

          series.push({
            text: text,
            y: num,
            tooltip: "<div style='color:green;margin:5px 10px;'>" +
            "<span style='white-space:nowrap;'>" + categoryAlias + " : " + text +
            "</span><br/><br/>" +
            "<span style='white-space:nowrap;'>" + c + " : " + b + "</span><br/><br/>" +
            "<span style='white-space:nowrap;'>" + percent + "</span>" +
            "</div>"
          });
        }));

        //construct chart
        var pieChart = new Chart(chartDiv);

        var theme = this._createPieTheme(pieParams, data.length);
        theme.plotarea.fill = "transparent";
        theme.chart.fill = "transparent";
        pieChart.setTheme(theme);

        pieChart.addPlot('default', {
          type: Pie,
          radius: radius,
          labels: !!pieParams.label
        });

        pieChart.addSeries('default', series);

        new MoveSlice(pieChart, "default");
        new Highlight(pieChart, "default");
        new Tooltip(pieChart, "default");

        pieChart.render();

        this._bindCountModeChartEvent(pieChart, data);

        pieChart.createSelf = this._getRecreateChartFunction(
          this._createCountModePieChart, args, chartDiv, data, paramsDijit);

        return pieChart;
      },

      //-----------------create field mode charts-------------------------
      _createFieldModeCharts: function(args, chartDivs){
        var charts = [];
        var paramsDijits = [];
        var config = args.config;
        var types = this._getTypes(config);
        var valueFields = config.valueFields;
        var operation = config.operation;

        //filter features with number values firstly
        /*var fs = args.featureSet.features;
        args.featureSet.features = array.filter(fs, lang.hitch(this, function(feature){
          return array.every(valueFields, lang.hitch(this, function(fieldName){
            var attributes = feature.attributes;
            return attributes && this._isNumber(attributes[fieldName]);
          }));
        }));*/

        var attributesList = array.map(args.featureSet.features, lang.hitch(this, function(feature){
          return feature.attributes;
        }));

        var data = {};//{fieldName1:value1,fieldName2:value2}

        array.forEach(valueFields, lang.hitch(this, function(fieldName){
          //init default statistics value
          data[fieldName] = 0;
          if(operation === 'max'){
            data[fieldName] = -Infinity;
          }
          else if(operation === 'min'){
            data[fieldName] = Infinity;
          }

          //use nonNullValueCount to record how many feature values are not null for the fieldName
          var nonNullValueCount = 0;

          array.forEach(attributesList, lang.hitch(this, function(attributes){
            var fieldValue = attributes[fieldName];
            if (this._isNumber(fieldValue)) {
              nonNullValueCount++;
              if (data.hasOwnProperty(fieldName)) {
                if (operation === 'average' || operation === 'sum') {
                  data[fieldName] += fieldValue;
                } else if (operation === 'max') {
                  data[fieldName] = Math.max(data[fieldName], fieldValue);
                } else if (operation === 'min') {
                  data[fieldName] = Math.min(data[fieldName], fieldValue);
                }
              } else {
                data[fieldName] = fieldValue;
              }
            }
          }));

          if(nonNullValueCount > 0){
            if(operation === 'average'){
              //data[fieldName] /= attributesList.length;
              data[fieldName] = data[fieldName] / nonNullValueCount;
            }
          }else{
            data[fieldName] = 0;
          }
        }));

        array.forEach(types, lang.hitch(this, function(type, i){
          try {
            var chartDiv = chartDivs[i];
            var chart = null;
            var paramsDijit = null;
            if (type === 'column') {
              paramsDijit = this._createColumnParamsDijit(config);
              chart = this._createFieldModeColumnChart(args, chartDiv, data, paramsDijit);
            } else if (type === 'bar') {
              paramsDijit = this._createBarParamsDijit(config);
              chart = this._createFieldModeBarChart(args, chartDiv, data, paramsDijit);
            } else if (type === 'line') {
              paramsDijit = this._createLineParamsDijit(config);
              chart = this._createFieldModeLineChart(args, chartDiv, data, paramsDijit);
            } else if (type === 'pie') {
              paramsDijit = this._createPieParamsDijit(config);
              chart = this._createFieldModePieChart(args, chartDiv, data, paramsDijit);
            }
            paramsDijits.push(paramsDijit);
            charts.push(chart);
          } catch (e) {
            console.error(e);
          }
        }));

        return {
          charts: charts,
          paramsDijits: paramsDijits
        };
      },

      _bindFieldModeChartEvent: function(chart){
        if(this.map){
          chart.connectToPlot('default', lang.hitch(this, function(evt) {
            var isOver = evt.type === 'onmouseover';
            var isOut = evt.type === 'onmouseout';
            var isClick = evt.type === 'onclick';

            if (isOver || isOut || isClick) {
              var features = this.featureSet && this.featureSet.features;
              if (evt.type === 'onmouseover') {
                this._mouseOverChartItem(features);
              } else if (evt.type === 'onmouseout') {
                this._mouseOutChartItem(features);
              } else if (evt.type === 'onclick') {
                this._zoomToGraphics(features);
              }
            }
          }));
        }
      },

      _createFieldModeColumnChart: function(args, chartDiv, data, paramsDijit){
        //data: {fieldName1:value1,fieldName2:value2}
        var config = args.config;
        var valueFields = config.valueFields;
        var valueAliases = this._getFieldAliasArray(valueFields);
        var columnParams = paramsDijit.getConfig();
        var labels = [];//{value,text}
        var series = [];

        array.forEach(valueFields, lang.hitch(this, function(fieldName, index){
          var aliasName = valueAliases[index];
          var num = data[fieldName];
          var a = jimuUtils.localizeNumber(num);
          labels.push({
            value: index + 1,
            text: aliasName
          });

          series.push({
            y: num,
            tooltip: "<div style='color:green;margin:5px 10px;'>" +
            "<span style='white-space:nowrap;'>" + aliasName + " : " + a + "</span>" +
            "</div>"
          });
        }));

        //construct chart
        var columnChart = new Chart(chartDiv);

        columnChart.setTheme(this._createTransparentTheme());

        columnChart.addPlot('default', {
          type: Columns,
          enableCache: true,
          markers: true,
          gap: 10,
          minBarSize: 2,
          maxBarSize: 60
        });

        var rotation = this._calculateHorizontalRotation(chartDiv, labels);
        columnChart.addAxis('x', {
          type: columnParams.horizontalAxis === false ? InvisibleAxis : DefaultAxis,
          natural: true,
          labels: labels,
          rotation: rotation,
          majorLabels: true,
          minorLabels: true,
          majorTickStep: 1
        });

        columnChart.addAxis('y', {
          type: columnParams.verticalAxis === false ? InvisibleAxis : DefaultAxis,
          vertical: true,
          includeZero: true,
          natural: true
        });

        var colors = this._getColors(columnParams, 1);
        columnChart.addSeries('default', series, {
          stroke: {
            color: colors[0]
          },
          fill: colors[0]
        });

        new MoveSlice(columnChart, "default");
        new Highlight(columnChart, "default");
        new Tooltip(columnChart, "default");

        columnChart.render();

        this._bindFieldModeChartEvent(columnChart);

        columnChart.createSelf = this._getRecreateChartFunction(
          this._createFieldModeColumnChart, args, chartDiv, data, paramsDijit);

        return columnChart;
      },

      _createFieldModeBarChart: function(args, chartDiv, data, paramsDijit){
        //data: {fieldName1:value1,fieldName2:value2}
        var config = args.config;
        var valueFields = config.valueFields;
        var valueAliases = this._getFieldAliasArray(valueFields);
        var barParams = paramsDijit.getConfig();
        var labels = [];//{value,text}
        var series = [];

        array.forEach(valueFields, lang.hitch(this, function(fieldName, index){
          var aliasName = valueAliases[index];
          var num = data[fieldName];
          var a = jimuUtils.localizeNumber(num);
          labels.push({
            value: index + 1,
            text: aliasName
          });

          series.push({
            y: num,
            tooltip: "<div style='color:green;margin:5px 10px;'>" +
            "<span style='white-space:nowrap;'>" + aliasName + " : " + a + "</span>" +
            "</div>"
          });
        }));

        //construct chart
        var barChart = new Chart(chartDiv);

        barChart.setTheme(this._createTransparentTheme());

        barChart.addPlot('default', {
          type: Bars,
          enableCache: true,
          markers: true,
          gap: 10,
          minBarSize: 2,
          maxBarSize: 60
        });

        barChart.addAxis('x', {
          type: barParams.verticalAxis === false ? InvisibleAxis : DefaultAxis,
          vertical: true,
          natural: true,
          labels: labels,
          majorLabels: true,
          minorLabels: true,
          majorTickStep: 1
        });

        barChart.addAxis('y', {
          type: barParams.horizontalAxis === false ? InvisibleAxis : DefaultAxis,
          includeZero: true,
          natural: true
        });

        var colors = this._getColors(barParams, 1);
        barChart.addSeries('default', series, {
          stroke: {
            color: colors[0]
          },
          fill: colors[0]
        });

        new MoveSlice(barChart, "default");
        new Highlight(barChart, "default");
        new Tooltip(barChart, "default");

        barChart.render();

        this._bindFieldModeChartEvent(barChart);

        barChart.createSelf = this._getRecreateChartFunction(
          this._createFieldModeBarChart, args, chartDiv, data, paramsDijit);

        return barChart;
      },

      _createFieldModeLineChart: function(args, chartDiv, data, paramsDijit){
        //data: {fieldName1:value1,fieldName2:value2}
        var config = args.config;
        var valueFields = config.valueFields;
        var valueAliases = this._getFieldAliasArray(valueFields);
        var lineParams = paramsDijit.getConfig();
        var labels = [];//{value,text}
        var series = [];

        array.forEach(valueFields, lang.hitch(this, function(fieldName, index){
          var aliasName = valueAliases[index];
          var num = data[fieldName];
          var a = jimuUtils.localizeNumber(num);
          labels.push({
            value: index + 1,
            text: aliasName
          });

          series.push({
            y: num,
            tooltip: "<div style='color:green;margin:5px 10px;'>" +
            "<span style='white-space:nowrap;'>" + aliasName + " : " + a + "</span>" +
            "</div>"
          });
        }));

        //construct chart
        var lineChart = new Chart(chartDiv);

        lineChart.setTheme(this._createTransparentTheme());

        lineChart.addPlot('default', {
          type: Lines,
          markers: true,
          tension: "X"
        });

        var rotation = this._calculateHorizontalRotation(chartDiv, labels);
        lineChart.addAxis('x', {
          type: lineParams.horizontalAxis === false ? InvisibleAxis : DefaultAxis,
          natural: true,
          includeZero: true,
          labels: labels,
          rotation: rotation,
          majorLabels: true,
          minorLabels: true,
          majorTickStep: 1
        });

        lineChart.addAxis('y', {
          type: lineParams.verticalAxis === false ? InvisibleAxis : DefaultAxis,
          vertical: true,
          natural: true
        });

        var colors = this._getColors(lineParams, 1);
        lineChart.addSeries('default', series, {
          stroke: {
            color: colors[0]
          },
          fill: colors[0]
        });

        new Magnify(lineChart, "default");
        new Highlight(lineChart, "default");
        new Tooltip(lineChart, "default");

        lineChart.render();

        this._bindFieldModeChartEvent(lineChart);

        lineChart.createSelf = this._getRecreateChartFunction(
          this._createFieldModeLineChart, args, chartDiv, data, paramsDijit);

        return lineChart;
      },

      _createFieldModePieChart: function(args, chartDiv, data, paramsDijit){
        //data: {fieldName1:value1,fieldName2:value2}
        var config = args.config;
        var valueFields = config.valueFields;
        var valueAliases = this._getFieldAliasArray(valueFields);
        var pieParams = paramsDijit.getConfig();
        var box = html.getContentBox(chartDiv);
        var radius = Math.floor(Math.min(box.w, box.h) / 2 / this.pieScale) - 3;

        var labels = [];//{value,text}
        var series = [];
        var sum = 0.0;
        for(var fieldName in data){
          sum += Math.abs(data[fieldName]);
        }

        array.forEach(valueFields, lang.hitch(this, function(fieldName, index){
          var aliasName = valueAliases[index];
          var num = data[fieldName];
          var percent = this._tryLocaleNumber((num / sum * 100).toFixed(1)) + "%";
          var a = jimuUtils.localizeNumber(num);
          labels.push({
            value: index + 1,
            text: aliasName
          });

          series.push({
            text: aliasName,
            y: Math.abs(num),
            tooltip: "<div style='color:green;margin:5px 10px;'>" +
            "<span style='white-space:nowrap;'>" + aliasName + " : " + a + "</span><br/><br/>" +
            "<span style='white-space:nowrap;'>" + percent + "</span>" +
            "</div>"
          });
        }));

        //construct chart
        var pieChart = new Chart(chartDiv);

        var theme = this._createPieTheme(pieParams, data.length);
        theme.plotarea.fill = "transparent";
        theme.chart.fill = "transparent";
        pieChart.setTheme(theme);

        pieChart.addPlot('default', {
          type: Pie,
          radius: radius,
          labels: !!pieParams.label
        });

        pieChart.addSeries('default', series);

        new MoveSlice(pieChart, "default");
        new Highlight(pieChart, "default");
        new Tooltip(pieChart, "default");

        pieChart.render();

        this._bindFieldModeChartEvent(pieChart);

        pieChart.createSelf = this._getRecreateChartFunction(
          this._createFieldModePieChart, args, chartDiv, data, paramsDijit);

        return pieChart;
      },

      _createTransparentTheme: function() {
        var params = {
          plotarea: {fill: "transparent"},
          chart: {fill: "transparent"}
        };
        var theme = new SimpleTheme(params);
        return theme;
      }
    });
  });