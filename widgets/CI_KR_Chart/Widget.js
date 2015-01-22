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
    'dojo/on',
    'dojo/query',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/html',
    "dojo/_base/Color",
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'jimu/dijit/TabContainer',
    'jimu/dijit/DrawBox',
    "esri/graphic",
    "esri/config",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/PictureMarkerSymbol",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "esri/layers/GraphicsLayer",
    "esri/layers/FeatureLayer",
    "esri/geometry/jsonUtils",
    "esri/tasks/RelationParameters",
    "dijit/form/Select",
    'dijit/ProgressBar',
    "dojox/charting/Chart", "dojox/charting/axis2d/Default", "dojox/charting/plot2d/Lines", "dojox/charting/plot2d/Bars", "dojox/charting/plot2d/Pie",
    "dojox/charting/plot2d/Columns", "dojox/charting/action2d/Tooltip", "dojo/fx/easing", "dojox/charting/action2d/MouseIndicator", "dojox/charting/action2d/Highlight",
    "dojox/charting/action2d/MoveSlice", "dojox/charting/themes/MiamiNice", "dojox/charting/action2d/Magnify"
],
    function(declare,on,query, lang, array, html, Color, _WidgetsInTemplateMixin,BaseWidget, TabContainer,DrawBox,Graphic,
             esriConfig, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, PictureMarkerSymbol, Query, QueryTask,GraphicsLayer, FeatureLayer,
             geometryJsonUtils, RelationParameters, Select,ProgressBar, Chart, Default, Lines, Bars, Pie, Columns, Tooltip, easing, MouseIndicator, Highlight, MoveSlice, MiamiNice, Magnify) {
        return declare([BaseWidget,_WidgetsInTemplateMixin], {
            baseClass: 'jimu-widget-chart',
            name: 'Chart',
            chartLayer:null,
            charts:[],
            currentChartIndex:-1,

            postCreate: function() {
                this.inherited(arguments);
                this._initChartLayer();
                this._initSelectTab();
                this._initResultsTab();
            },

            startup: function() {
                this.inherited(arguments);
                this.tabContainer = new TabContainer({
                    tabs:[{
                        title:this.nls.select,
                        content:this.selectTabNode
                    },{
                        title:this.nls.results,
                        content:this.resultsTabNode
                    }],
                    selected:this.nls.select
                },this.content);
                this.tabContainer.startup();
            },

            onClose:function(){
                this.drawBox.deactivate();
            },

            destroy:function(){
                if(this.chartLayer){
                    this.map.removeLayer(this.chartLayer);
                    this.chartLayer = null;
                }
                if(this.drawBox){
                    this.drawBox.destroy();
                    this.drawBox = null;
                }
                this.inherited(arguments);
            },

            _initChartLayer:function(){
                this.chartLayer = new GraphicsLayer();
                this.map.addLayer(this.chartLayer);
            },

            _initSelectTab:function(){
                this._initLayerSelect();
                this._initDraw();
            },

            _initLayerSelect:function(){
                if(!(this.config&&this.config.layers)){
                    return;
                }

                for(var i=0;i<this.config.layers.length;i++){
                    var layer = this.config.layers[i];
                    var option = {value: i, label: layer.label};
                    this.layerSelect.addOption(option);
                }
                this.own(on(this.layerSelect,'change',lang.hitch(this,function(){
                    this._clear();
                })));
            },

            _initDraw:function(){
                this.drawBox.setMap(this.map);

                this.own(on(this.drawBox,'Clear',lang.hitch(this,function(){
                    this.chartLayer.clear();
                    this._clearCharts();
                })));

                this.own(on(this.drawBox,'DrawEnd',lang.hitch(this,function(graphic,geotype,commontype){/*jshint unused: false*/
                    this.drawBox.deactivate();
                    this._clear();
                    this._doQuery(graphic.geometry);
                })));
            },

            _clear:function(){
                this.drawBox.clear();
                this.chartLayer.clear();
                this._clearCharts();
            },

            _clearCharts:function(){
                this.chartTitle.innerHTML = "";
                this.currentChartIndex = -1;
                var chartDivs = query('.chart-div',this.chartContainer);
                chartDivs.style({display:'none'});
                var lis = query("li",this.pagingUl);
                lis.removeClass('selected');

                for(var i=0;i<this.charts.length;i++){
                    var chart = this.charts[i];
                    if(chart){
                        chart.destroy();
                    }
                }
                this.charts = [];
                html.empty(this.pagingUl);
                html.empty(this.chartContainer);
                html.setStyle(this.resultsSection,'display','none');
                html.setStyle(this.noresultsSection,'display','block');
            },

            _showError:function(errMsg){
                console.error(errMsg);
            },

            _getSelectedLayerInfo:function(){
                var index = this.layerSelect.get('value');
                var layerInfo = this.config.layers[index];
                return layerInfo;
            },

            _getHighLightColor:function(){
                var color = new Color('#f5f50e');
                if(this.config && this.config.highLightColor){
                    color = new Color(this.config.highLightColor);
                }
                return color;
            },

            _setFeatureSymbol:function(f){
                switch(f.geometry.type){
                    case 'extent':
                    case 'polygon':
                        f.setSymbol(this._getFillSymbol());
                        break;
                    case 'polyline':
                        f.setSymbol(this._getLineSymbol());
                        break;
                    default:
                        f.setSymbol(this._getMarkerSymbol());
                        break;
                }
            },

            _setHightLightSymbol:function(g){
                switch(g.geometry.type){
                    case 'extent':
                    case 'polygon':
                        g.setSymbol(this._getHightLightFillSymbol());
                        break;
                    case 'polyline':
                        g.setSymbol(this._getHightLightLineSymbol());
                        break;
                    default:
                        g.setSymbol(this._getHightLightMarkerSymbol());
                        break;
                }
            },

            _getMarkerSymbol:function(){
                var style = SimpleMarkerSymbol.STYLE_CIRCLE;
                var size = 15;
                var color = new Color("#3fafdc");
                color.a = 1;

                var outlineSymbol = new SimpleLineSymbol();
                var outlineColor = new Color("#000000");
                var outlineWidth = 0;
                outlineSymbol.setStyle(SimpleLineSymbol.STYLE_SOLID);
                outlineSymbol.setColor(outlineColor);
                outlineSymbol.setWidth(outlineWidth);

                var symbol = new SimpleMarkerSymbol(style, size, outlineSymbol, color);
                return symbol;
            },

            _getHightLightMarkerSymbol:function(){
                var style = SimpleMarkerSymbol.STYLE_CIRCLE;
                var size = 15;
                var color = new Color("#3fafdc");
                color.a = 1;

                var outlineSymbol = new SimpleLineSymbol();
                var outlineColor = this._getHighLightColor();
                var outlineWidth = 3;
                outlineSymbol.setStyle(SimpleLineSymbol.STYLE_SOLID);
                outlineSymbol.setColor(outlineColor);
                outlineSymbol.setWidth(outlineWidth);

                var symbol = new SimpleMarkerSymbol(style, size, outlineSymbol, color);
                return symbol;
            },

            _getLineSymbol:function(){
                var symbol = new SimpleLineSymbol();
                var style = SimpleLineSymbol.STYLE_SOLID;
                var color = new Color("#3fafdc");
                color.a = 1;
                var width = 5;
                symbol.setStyle(style);
                symbol.setColor(color);
                symbol.setWidth(width);
                return symbol;
            },

            _getHightLightLineSymbol:function(){
                var symbol = new SimpleLineSymbol();
                var style = SimpleLineSymbol.STYLE_SOLID;
                var color = this._getHighLightColor();
                color.a = 1;
                var width = 7;
                symbol.setStyle(style);
                symbol.setColor(color);
                symbol.setWidth(width);
                return symbol;
            },

            _getFillSymbol:function(){
                var style = SimpleFillSymbol.STYLE_SOLID;
                var color = new Color('#3fafdc');
                color.a = 0.5;
                var outlineSymbol = new SimpleLineSymbol();
                var outlineColor = new Color('#000000');
                var outlineWidth = 1;
                outlineSymbol.setStyle(SimpleLineSymbol.STYLE_SOLID);
                outlineSymbol.setColor(outlineColor);
                outlineSymbol.setWidth(outlineWidth);
                var symbol = new SimpleFillSymbol(style, outlineSymbol, color);
                return symbol;
            },

            _getHightLightFillSymbol:function(){
                var style = SimpleFillSymbol.STYLE_SOLID;
                var color = new Color('#3fafdc');
                color.a = 0.5;
                var outlineSymbol = new SimpleLineSymbol();
                var outlineColor = this._getHighLightColor();
                var outlineWidth = 3;
                outlineSymbol.setStyle(SimpleLineSymbol.STYLE_SOLID);
                outlineSymbol.setColor(outlineColor);
                outlineSymbol.setWidth(outlineWidth);
                var symbol = new SimpleFillSymbol(style, outlineSymbol, color);
                return symbol;
            },

            _doQuery:function(geometry){
                var layerInfo = this._getSelectedLayerInfo();
                if(!layerInfo){
                    this._onQueryError("Can't find layer");
                    return;
                }

                this.tabContainer.selectTab(this.nls.results);
                html.setStyle(this.progressBar.domNode,'display','block');
                html.setStyle(this.resultsSection,'display','none');
                html.setStyle(this.noresultsSection,'display','none');

                if(layerInfo.url){
                    this._doQueryByUrl(layerInfo, geometry);
                }else if(layerInfo.featureCollection){
                    this._doQueryByfeatureSet(layerInfo, geometry);
                }else{
                    this._onQueryError("wrong layer define");
                }
            },

            _doQueryByUrl: function(layerInfo, geometry){
                var queryTask = new QueryTask(layerInfo.url);
                var q = new Query();
                q.returnGeometry = true;
                q.outFields = layerInfo.fields;
                q.geometry = geometry;
                queryTask.execute(q);
                this.own(on(queryTask, 'complete', lang.hitch(this, this._onQueryComplete)));
                this.own(on(queryTask, 'error', lang.hitch(this, this._onQueryError)));
            },

            _doQueryByfeatureSet: function(layerInfo, geometry){
                var featureSet = layerInfo.featureCollection.featureSet;
                var resultFeatures = [];
                if(geometry.type === 'extent'){
                    array.forEach(featureSet.features, function(feature){
                        var g = geometryJsonUtils.fromJson(feature.geometry);
                        if(geometry.intersects(g)){
                            resultFeatures.push(feature);
                        }
                    });
                }else if(geometry.type === 'polygon'){
                    if(featureSet.geometryType === 'esriGeometryPoint'){
                        array.forEach(featureSet.features, function(feature){
                            var g = geometryJsonUtils.fromJson(feature.geometry);
                            if(geometry.contains(g)){
                                resultFeatures.push(feature);
                            }
                        });
                    }else{
                        var geometries = array.map(featureSet.features, function(feature){
                            return geometryJsonUtils.fromJson(feature.geometry);
                        });

                        var params = new RelationParameters();
                        params.geometries1 = geometries;
                        params.geometries2 = [geometry];
                        params.relation = RelationParameters.SPATIAL_REL_INTERSECTION;

                        esriConfig.defaults.geometryService.relation(params, lang.hitch(this, function(results){
                            this._displayResult(array.map(results, function(result){
                                return new Graphic(featureSet.features[result.geometry1Index]);
                            }));
                        }), function(error){
                            console.log(error);
                        });
                    }

                }else{
                    this._onQueryError("unsupport geometry type: " + geometry.type);
                    return;
                }

                this._displayResult(array.map(resultFeatures, function(feature){
                    return new Graphic(feature);
                }));
            },

            _onQueryComplete:function(response){
                var featureSet = response.featureSet;
                var features = featureSet.features;
                this._displayResult(features);
            },

            _displayResult: function(features){
                html.setStyle(this.progressBar.domNode,'display','none');
                this._clear();
                var length = features.length;
                if(length > 0){
                    html.setStyle(this.resultsSection,'display','block');
                    html.setStyle(this.noresultsSection,'display','none');
                    for(var i=0;i<length;i++){
                        var f = features[i];
                        this._setFeatureSymbol(f);
                        this.chartLayer.add(f);
                    }
                    this._createCharts(features);
                }else{
                    html.setStyle(this.resultsSection,'display','none');
                    html.setStyle(this.noresultsSection,'display','block');
                }
            },

            _onQueryError:function(error){
                html.setStyle(this.progressBar.domNode,'display','none');
                this._clear();
                console.error("ChartWidget query failed",error);
                this._showError("Error");
                html.setStyle(this.resultsSection,'display','none');
                html.setStyle(this.noresultsSection,'display','block');
            },

            _initResultsTab:function(){
                this.own(on(this.pagingUl,'click',lang.hitch(this,function(event){
                    var target = event.target||event.srcElement;
                    var tagName = target.tagName.toLowerCase();
                    if(tagName === 'a'){
                        var as = query('a',this.pagingUl);
                        var index = array.indexOf(as,target);
                        if(index >= 0){
                            this._showChart(index);
                        }
                    }
                })));

                this.own(on(this.leftArrow,'click',lang.hitch(this,function(){
                    var index = (this.currentChartIndex - 1 + this.charts.length)%this.charts.length;
                    if(index >= 0){
                        this._showChart(index);
                    }
                })));

                this.own(on(this.rightArrow,'click',lang.hitch(this,function(){
                    var index = (this.currentChartIndex + 1 + this.charts.length)%this.charts.length;
                    if(index >= 0){
                        this._showChart(index);
                    }
                })));
            },

            _showChart:function(index){
                this.chartTitle.innerHTML = "";
                this.currentChartIndex = -1;
                var chartDivs = query('.chart-div',this.chartContainer);
                chartDivs.style({display:'none'});
                var lis = query("li",this.pagingUl);
                lis.removeClass('selected');
                if(index < 0){
                    return;
                }

                var chartDiv = chartDivs[index];
                if(chartDiv){
                    this.currentChartIndex = index;
                    html.setStyle(chartDiv,{display:'block'});
                }
                var chart = this.charts[index];
                if(chart&&chart.media){
                    this.chartTitle.innerHTML = chart.media.title;
                    this.description.innerHTML = chart.media.description||"";
                }
                var li = lis[index];
                if(li){
                    html.addClass(li,'selected');
                }
            },

            _createCharts:function(features){
                this._clearCharts();
                html.setStyle(this.resultsSection,'display','block');
                html.setStyle(this.noresultsSection,'display','none');
                this.tabContainer.selectTab(this.nls.results);
                var layerInfo = this._getSelectedLayerInfo();
                var medias = layerInfo.medias;
                var labelField = layerInfo.labelField;
                var box = html.getMarginBox(this.chartContainer);
                var w = box.w+"px";
                var h = box.h+"px";

                var i,chart;
                for(i=0;i<medias.length;i++){
                    chart = null;
                    var media = medias[i];
                    var type = media.type.toLowerCase();
                    var chartDiv = html.create('div',{'class':'chart-div',style:{width:w,height:h}},this.chartContainer);
                    if(type === 'barschart'){
                        chart = this._creatBarsChart(chartDiv,media,features,labelField);
                    }
                    else if(type === 'columnschart'){
                        chart = this._creatColumnsChart(chartDiv,media,features,labelField);
                    }
                    else if(type === 'linechart'){
                        chart = this._creatLineChart(chartDiv,media,features,labelField);
                    }
                    else if(type === 'piechart'){
                        chart = this._creatPieChart(chartDiv,media,features,labelField);
                    }

                    if(chart){
                        chart.media = media;
                        this.charts.push(chart);
                        html.setStyle(chartDiv,'display','none');
                    }
                    else{
                        html.destroy(chartDiv);
                    }
                }

                var chartCount = this.charts.length;
                for(i=0;i<chartCount;i++){
                    var strLi = "<li><a></a></li>";
                    var domLi = html.toDom(strLi);
                    html.place(domLi,this.pagingUl);
                }

                this._showChart(0);
            },

            _creatBarsChart: function(chartNode, media, features, labelField) {
                var series = [];

                //init series
                for (var i = 0; i < features.length; i++) {
                    var attributes = features[i].attributes;
                    var name = attributes[labelField];
                    var num = attributes[media.chartField];
                    var ele = {
                        y:num,
                        tooltip:"<div style='color:green;margin-right:10px;'><span style='white-space:nowrap;'>"+name+"</span><br/><span>"+num+"</span></div>"
                    };
                    series.push(ele);
                }

                //construct chart
                var barsChart = new Chart(chartNode);

                barsChart.addPlot('default', {
                    type: Bars,
                    animate: {
                        duration: 2000,
                        easing: easing.bounceInOut
                    },
                    enableCache: true,
                    markers: true,
                    minBarSize: 3,
                    maxBarSize: 20
                });

                barsChart.addAxis('x',{
                    vertical:true
                });

                barsChart.addAxis('y', {
                    type: Default,
                    fixLower: "minor",
                    fixUpper: "minor"
                });

                barsChart.addSeries(media.title, series, {
                    stroke: {
                        color: "#FFFFFF"
                    },
                    fill: "#1f77b4"
                });

                new MoveSlice(barsChart, "default");
                new Highlight(barsChart, "default");
                new Tooltip(barsChart, "default");

                barsChart.connectToPlot('default',lang.hitch(this,function(evt){
                    var g = this.chartLayer.graphics[evt.index];
                    if(evt.type === 'onmouseover'){
                        this._setHightLightSymbol(g);
                    }
                    else if(evt.type === 'onmouseout'){
                        this._setFeatureSymbol(g);
                    }
                }));
                barsChart.render();

                return barsChart;
            },

            _creatColumnsChart: function(chartNode, media, features, labelField) {
                var series = [];

                //collect series
                for (var i = 0; i < features.length; i++) {
                    var attributes = features[i].attributes;
                    var name = attributes[labelField];
                    var num = attributes[media.chartField];
                    var ele = {
                        y:num,
                        tooltip:"<div style='color:green;margin-right:10px;'><span style='white-space:nowrap;'>"+name+"</span><br/><span>"+num+"</span></div>"
                    };
                    series.push(ele);
                }

                //construct chart
                var columnsChart = new Chart(chartNode);

                columnsChart.addPlot('default', {
                    type: Columns,
                    animate: {
                        duration: 2000,
                        easing: easing.bounceInOut
                    },
                    enableCache: true,
                    markers: true
                });

                columnsChart.addAxis('x', {
                    type: Default
                });

                columnsChart.addAxis('y', {
                    vertical: true,
                    fixLower: "minor",
                    fixUpper: "minor"
                });

                columnsChart.addSeries(media.title, series, {
                    stroke: {
                        color: "#FFFFFF"
                    },
                    fill: "#1f77b4"
                });

                new MoveSlice(columnsChart, "default");
                new Highlight(columnsChart, "default");
                new Tooltip(columnsChart, "default");

                columnsChart.connectToPlot('default',lang.hitch(this,function(evt){
                    var g = this.chartLayer.graphics[evt.index];
                    if(evt.type === 'onmouseover'){
                        this._setHightLightSymbol(g);
                    }
                    else if(evt.type === 'onmouseout'){
                        this._setFeatureSymbol(g);
                    }
                }));

                columnsChart.render();

                return columnsChart;
            },

            _creatLineChart: function(chartNode, media, features, labelField) {
                var series = [];

                //init series
                for (var i = 0; i < features.length; i++) {
                    var attributes = features[i].attributes;
                    var name = attributes[labelField];
                    var num = attributes[media.chartField];
                    var ele = {
                        y:num,
                        tooltip:"<div style='color:green;margin-right:10px;'><span style='white-space:nowrap;'>"+name+"</span><br/><span>"+num+"</span></div>"
                    };
                    series.push(ele);
                }

                //construct chart
                var lineChart = new Chart(chartNode);

                lineChart.addPlot('default', {
                    type: Lines,
                    animate: {
                        duration: 2000,
                        easing: easing.cubicIn
                    },
                    markers: true,
                    tension: "S"
                });

                lineChart.addAxis('x', {
                    type: Default
                });

                lineChart.addAxis('y', {
                    vertical: true,
                    fixUpper:"minor",
                    fixLower:"minor"
                });

                lineChart.addSeries(media.title,series, {
                    stroke: {
                        color: "#FF7F0E"
                    },
                    fill: "#FF7F0E"
                });

                new Magnify(lineChart, "default");
                new Highlight(lineChart, "default");
                new Tooltip(lineChart, "default");

                lineChart.connectToPlot('default',lang.hitch(this,function(evt){
                    var g = this.chartLayer.graphics[evt.index];
                    if(evt.type === 'onmouseover'){
                        this._setHightLightSymbol(g);
                    }
                    else if(evt.type === 'onmouseout'){
                        this._setFeatureSymbol(g);
                    }
                }));

                lineChart.render();

                return lineChart;
            },

            _creatPieChart: function(chartNode, media, features, labelField) {
                var series = [];
                var i;

                //init series
                var sum = 0.0;
                for(i = 0;i < features.length;i++){
                    sum += features[i].attributes[media.chartField];
                }

                for (i = 0; i < features.length; i++) {
                    var attributes = features[i].attributes;
                    var name = attributes[labelField];
                    var num = attributes[media.chartField];
                    var percent = (num/sum*100).toFixed(1)+"%";
                    var ele = {
                        y:num,
                        text:"",
                        tooltip:"<div style='color:green;margin-right:10px;'><span style='white-space:nowrap;'>"+name+":"+percent+"</span><br/><span>("+num+")</span></div>"
                    };
                    series.push(ele);
                }

                //construct chart
                var pieChart = new Chart(chartNode);

                pieChart.setTheme(MiamiNice);

                pieChart.addPlot('default', {
                    type: Pie,
                    animate: {
                        duration: 2000,
                        easing: easing.bounceInOut
                    },
                    radius: 100,
                    markers: true
                });

                pieChart.addSeries(media.title, series);
                new MoveSlice(pieChart, "default");
                new Highlight(pieChart, "default");
                new Tooltip(pieChart, "default");

                pieChart.connectToPlot('default',lang.hitch(this,function(evt){
                    var g = this.chartLayer.graphics[evt.index];
                    if(evt.type === 'onmouseover'){
                        this._setHightLightSymbol(g);
                    }
                    else if(evt.type === 'onmouseout'){
                        this._setFeatureSymbol(g);
                    }
                }));

                pieChart.render();

                return pieChart;
            },

            connChartEvent: function(chart, data, hook) {
                if (!chart || chart.series.length < 0) {
                    return;
                }
                chart.connectToPlot("default", chart.series[0].name, function(args) {
                    if (args.type === "onclick") {
                        hook._removeLocatGraphic();
                        var feat = data.features[args.index];
                        var centoid;
                        if (feat.geometry.type === 'Point') {
                            centoid = feat.geometry;
                        } else {
                            centoid = feat.geometry.getExtent().getCenter();
                        }
                        hook.map.centerAt(centoid);
                        hook._addLocatGraphic(centoid);
                    }
                });
            }
        });
    });