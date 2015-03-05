define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/on',
  'dojo/_base/query',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidgetSetting',
  'esri/units',
  'esri/tasks/LinearUnit',
  'dojo/_base/Color',
  'dojo/colors',
  'dojo/fx/easing',
  'dojox/charting/Chart',
  'dojox/charting/axis2d/Default',
  'dojox/charting/plot2d/Grid',
  'dojox/charting/plot2d/Areas',
  'dojox/charting/action2d/MouseIndicator',
  'dojox/charting/action2d/TouchIndicator',
  'dojox/charting/themes/ThreeD',
  'esri/sniff',
  'dojo/_base/Deferred',
  'esri/dijit/Measurement',
  './SymbologyEdit',
  './ChartEdit',
  'dojo/number',
  'jimu/dijit/SymbolPicker',
  'jimu/dijit/Popup',
  'dojo/keys',
  'jimu/dijit/ServiceURLInput',
  'dijit/form/Select',
  'dijit/form/NumberTextBox'
],
  function (declare, lang, array, html, on, query, _WidgetsInTemplateMixin, BaseWidgetSetting, units, LinearUnit, Color, colors, easing,
             Chart, Default, Grid, Areas, MouseIndicator, TouchIndicator, ThreeD, esriSniff, Deferred, Measurement, SymbologyEdit,
             ChartEdit, number, SymbolPicker, Popup, keys) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'widget-setting-elevation-profile',
      samplingPointCount: 199,
      popupsymedit: null,
      popupchartedit: null,
      popup: null,
      popup2: null,
      popupState: null,

      postCreate: function () {
        this.inherited(arguments);
        this._createProfileChart = lang.hitch(this, this._createProfileChart);
        this._updateProfileChart = lang.hitch(this, this._updateProfileChart);
      },

      startup: function () {
        this.inherited(arguments);
        this.setConfig(this.config);
        this._initMeasureTool();
        this._bindEvents();
      },

      setConfig: function (config) {
        //hack the 'Learn more about this widget link'
        setTimeout(function(){
          var helpLink = query('.help-link');
          helpLink[0].href = 'http://gis.calhouncounty.org/WAB/V1.1/widgets/ElevationProfile/help/elevationprofile_Help.htm';
          html.setStyle(helpLink[0],'display','block');
        },600);
        if (config.profileTaskUrl) {
          this.urlTextBox.set('value', config.profileTaskUrl);
          this.urlTextBox.proceedValue = true;
        }
        this.chartRenderingOptions = lang.mixin({}, config.chartRenderingOptions);
      },

      getConfig: function () {
        return this.config;
      },

      _onServiceFetchError: function () {
        this.errormessage = this.nls.invalidURL;
        var urlContainsProfile = (/profile$/i).test(this.urlTextBox.get('value'));
        if (urlContainsProfile) {
          this.errormessage += ", " + this.nls.urlContainsProfile;
        }
        html.setAttr(this.errorMessage, 'innerHTML', this.errormessage);
      },

      _onServiceFetch: function (urlDijit, evt) {
        var result = false;
        if (evt.data.tasks && evt.data.tasks[0] === 'Profile') {
          urlDijit.proceedValue = true;
          result = true;
        } else {
          urlDijit.proceedValue = false;
          result = false;
          this.errormessage = this.nls.invalidURL;
          var urlContainsProfile = (/profile$/i).test(evt.url);
          if (urlContainsProfile) {
            this.errormessage += ", " + this.nls.urlContainsProfile;
          }
        }
        this._checkProceed();
        return result;
      },

      _onServiceUrlChange: function () {
        this._checkProceed();
      },

      _checkProceed: function () {
        var canProceed = true;
        html.setAttr(this.errorMessage, 'innerHTML', '');

        if (!this.urlTextBox.proceedValue) {
          canProceed = false;
        }

        if (!canProceed) {
          if (this.errormessage) {
            html.setAttr(this.errorMessage, 'innerHTML', this.errormessage);
          }
        }
      },

      _bindEvents: function () {
        this.own(on(this.urlTextBox, 'Change', lang.hitch(this, '_onServiceUrlChange')));
        this.urlTextBox.proceedValue = false;
        this.urlTextBox.setProcessFunction(lang.hitch(this, '_onServiceFetch', this.urlTextBox),
          lang.hitch(this, '_onServiceFetchError'));
        this.own(on(this.btnSymLine,'click',lang.hitch(this,function(){
          this._openSymEdit(this.nls.editDefaultSym);
        })));
        this.own(on(this.btnChartProps,'click',lang.hitch(this,function(){
          this._openChartEdit(this.nls.editChartProperties);
        })));

        this.own(on(this.urlTextBox, 'keydown', lang.hitch(this, function(evt){
          var keyNum = evt.keyCode !== undefined ? evt.keyCode : evt.which;
          if (keyNum === 13) {
            this.urlTextBox._onServiceUrlChange(this.urlTextBox.get('value'));
          }
        })));
      },

      _initMeasureTool: function () {
        // MEASUREMENT TOOL //
        this.measureTool = new Measurement({
          map: this.map,
          defaultAreaUnit: (this.config.scalebarUnits === "metric") ? units.SQUARE_KILOMETERS : units.SQUARE_MILES,
          defaultLengthUnit: (this.config.scalebarUnits === "metric") ? units.KILOMETERS : units.MILES
        });
        this.measureTool.startup();
        // ACTIVATE/DEACTIVATE DISTANCE TOOL         //
        //   THIS WILL INITIALIZE UNITS DROPDOWN AND //
        //   ALLOW US TO CONVERT VALUES AS NECESSARY //
        this.measureTool.setTool('distance', true);
        this.measureTool.setTool('distance', false);

        // SAMPLING DISTANCE //
        this.samplingDistance = new LinearUnit();
        this.samplingDistance.units = units.METERS;
        this._createProfileChart(null).then(lang.hitch(this, function () {
          this._createProfileChart(lang.clone(this.elevationInfo));
        }), lang.hitch(this, function (error) {
          this.emit('error', error);
        }));
      },

      _updateProfileChart: function () {
        this.measureTool.destroy();
        this._initMeasureTool();
        this._createProfileChart(lang.clone(this.elevationInfo)).then(lang.hitch(this, function () {
          this.profileChart.resize();
        }), lang.hitch(this, function (error) {
          this.emit('error', error);
        }));
      },

      _createProfileChart: function (elevationInfo) {
        var deferred = new Deferred();

        // CHART SERIES NAMES //
        var waterDataSeriesName = 'Water';
        var elevationDataSeriesName = 'ElevationData';

        // MIN/MAX/STEP //
        var yMin = -10.0;
        var yMax = 100.0;

        // DID WE GET NEW ELEVATION INFORMATION //
        if (!elevationInfo) {

          // SAMPLING DISTANCE //
          this.samplingDistance.distance = (this.map.extent.getWidth() / this.samplingPointCount);

          // GEOMETRY AND ELEVATIONS //
          this.profilePolyline = null;
          var samplingDisplayDistance = this._convertDistancesArray([this.samplingDistance.distance])[0];
          this.elevationData = this._getFilledArray(this.samplingPointCount, samplingDisplayDistance, true);

          // REMOVE ELEVATION INDICATORS //
          if (this.elevationIndicator) {
            this.elevationIndicator.destroy();
            this.elevationIndicator = null;
          }
          if (this.elevationIndicator2) {
            this.elevationIndicator2.destroy();
            this.elevationIndicator2 = null;
          }

        } else {

          // GEOMETRY, ELEVATIONS, DISTANCES AND SAMPLING DISTANCE //
          this.elevationData = this._convertElevationsInfoArray(elevationInfo.elevations);
          this.distances = this._convertDistancesArray(elevationInfo.distances);

          // CALC MIN/MAX/STEP //
          var yMinSource = this._getArrayMin(this.elevationData);
          var yMaxSource = this._getArrayMax(this.elevationData);
          var yRange = (yMaxSource - yMinSource);
          yMin = yMinSource - (yRange * 0.05);
          yMax = yMaxSource + (yRange * 0.05);

          // GAIN/LOSS DETAILS //
          var detailsNumberFormat = {
            places: 0
          };
          var elevFirst = this.elevationData[0].y;

          // REMOVE ELEVATION INDICATORS //
          if (this.elevationIndicator) {
            this.elevationIndicator.destroy();
            this.elevationIndicator = null;
          }
          if (this.elevationIndicator2) {
            this.elevationIndicator2.destroy();
            this.elevationIndicator2 = null;
          }

          // MOUSE/TOUCH ELEVATION INDICATOR //
          var indicatorProperties = {
            series: elevationDataSeriesName,
            mouseOver: true,
            font: 'normal normal bold 9pt Tahoma',
            fontColor: this.chartRenderingOptions.indicatorFontColor,
            fill: this.chartRenderingOptions.indicatorFillColor,
            markerFill: 'none',
            markerStroke: {
              color: 'red',
              width: 3.0
            },
            markerSymbol: 'm -6 -6, l 12 12, m 0 -12, l -12 12', // RED X //
            offset: {
              y: -2,
              x: -25
            },
            labelFunc: lang.hitch(this, function (obj) {
              var elevUnitsLabel = this._getDisplayUnits(true);
              var elevChangeLabel = number.format(obj.y, detailsNumberFormat);
              return lang.replace('{0} {1}', [elevChangeLabel, elevUnitsLabel]);
            })
          };
          // MOUSE/TOUCH ELEVATION CHANGE INDICATOR //
          var indicatorProperties2 = {
            series: waterDataSeriesName,
            mouseOver: true,
            font: 'normal normal bold 8pt Tahoma',
            fontColor: this.chartRenderingOptions.indicatorFontColor,
            fill: this.chartRenderingOptions.indicatorFillColor,
            fillFunc: lang.hitch(this, function (obj) {
              var elevIndex = this.distances.indexOf(obj.x);
              var elev = this.elevationData[elevIndex].y;
              return (elev >= elevFirst) ? 'green' : 'red';
            }),
            offset: {
              y: 25,
              x: -30
            },
            labelFunc: lang.hitch(this, function (obj) {
              var elevIndex = this.distances.indexOf(obj.x);
              var elev = this.elevationData[elevIndex].y;
              var elevChangeLabel = number.format(elev - elevFirst, detailsNumberFormat);
              var plusMinus = ((elev - elevFirst) > 0) ? '+' : '';
              return lang.replace('{0}{1}', [plusMinus, elevChangeLabel]);
            })
          };
          if (esriSniff('has-touch')) {
            this.elevationIndicator2 = new TouchIndicator(this.profileChart, 'default', indicatorProperties2);
            this.elevationIndicator = new TouchIndicator(this.profileChart, 'default', indicatorProperties);
          } else {
            this.elevationIndicator2 = new MouseIndicator(this.profileChart, 'default', indicatorProperties2);
            this.elevationIndicator = new MouseIndicator(this.profileChart, 'default', indicatorProperties);
          }
          this.profileChart.titleFont = lang.replace('normal normal bold {chartTitleFontSize}pt verdana', this.chartRenderingOptions);
          this.profileChart.titleFontColor = this.chartRenderingOptions.titleFontColor;
          this.profileChart.getAxis('y').opt.font = lang.replace('normal normal bold {axisLabelFontSize}pt verdana', this.chartRenderingOptions);
          this.profileChart.getAxis('x').opt.font = lang.replace('normal normal bold {axisLabelFontSize}pt verdana', this.chartRenderingOptions);
          this.profileChart.getAxis('y').opt.titleFont = lang.replace('normal normal bold {axisTitleFontSize}pt verdana', this.chartRenderingOptions);
          this.profileChart.getAxis('x').opt.titleFont = lang.replace('normal normal bold {axisTitleFontSize}pt verdana', this.chartRenderingOptions);
          this.profileChart.getAxis('x').opt.fontColor = this.chartRenderingOptions.axisFontColor;
          this.profileChart.getAxis('y').opt.fontColor = this.chartRenderingOptions.axisFontColor;
          this.profileChart.getAxis('y').opt.majorTick.color = this.chartRenderingOptions.axisMajorTickColor;
          this.profileChart.getAxis('x').opt.majorTick.color = this.chartRenderingOptions.axisMajorTickColor;

          this.profileChart.theme.plotarea.fill.colors = [
            {
              offset: 0.0,
              color: this.chartRenderingOptions.skyTopColor
            },
            {
              offset: 1.0,
              color: this.chartRenderingOptions.skyBottomColor
            }
          ];

          this.profileChart.series[0].fill.colors = [
            {
              offset: 0.0,
              color: this.chartRenderingOptions.waterTopColor
            }, {
              offset: 1.0,
              color: this.chartRenderingOptions.waterBottomColor
            }
          ];

          this.profileChart.series[0].stroke.color = this.chartRenderingOptions.waterLineColor;

          this.profileChart.series[1].fill.colors = [
            {
              offset: 0.0,
              color: this.chartRenderingOptions.elevationTopColor
            }, {
              offset: 1.0,
              color: this.chartRenderingOptions.elevationBottomColor
            }
          ];

          this.profileChart.series[1].stroke.color = this.chartRenderingOptions.elevationLineColor;


          this.profileChart.fullRender();
        }

        // FILLED ZERO ARRAY //
        var waterData = this._resetArray(this.elevationData, 0.0);

        // ARE WE UPDATING OR CREATING THE CHART //
        if (this.profileChart != null) {

          // UPDATE CHART //
          this.profileChart.getAxis('y').opt.min = yMin;
          this.profileChart.getAxis('y').opt.max = yMax;
          this.profileChart.getAxis('y').opt.title = lang.replace(this.nls.chart.elevationTitleTemplate, [this._getDisplayUnits(true)]);
          this.profileChart.getAxis('x').opt.title = lang.replace(this.nls.chart.distanceTitleTemplate, [this._getDisplayUnits(false)]);
          this.profileChart.dirty = true;
          this.profileChart.updateSeries(waterDataSeriesName, waterData);
          this.profileChart.updateSeries(elevationDataSeriesName, this.elevationData);
          // RENDER CHART //
          this.profileChart.render();
          deferred.resolve();
        } else {
          // CREATE CHART //
          this.profileChart = new Chart(this._chartNode, {
            title: this.nls.chart.title,
            titlePos: 'top',
            titleGap: 13,
            titleFont: lang.replace('normal normal bold {chartTitleFontSize}pt verdana', this.chartRenderingOptions),
            titleFontColor: this.chartRenderingOptions.titleFontColor
          });

          // SET THEME //
          this.profileChart.setTheme(ThreeD);

          // OVERRIDE DEFAULTS //
          this.profileChart.fill = 'transparent';
          this.profileChart.theme.axis.stroke.width = 2;
          this.profileChart.theme.axis.majorTick.color = Color.named.white.concat(0.5);
          this.profileChart.theme.axis.majorTick.width = 1.0;
          this.profileChart.theme.plotarea.fill = {
            type: 'linear',
            space: 'plot',
            x1: 50,
            y1: 100,
            x2: 50,
            y2: 0,
            colors: [
              {
                offset: 0.0,
                color: this.chartRenderingOptions.skyTopColor
              },
              {
                offset: 1.0,
                color: this.chartRenderingOptions.skyBottomColor
              }
            ]
          };

          // Y AXIS //
          this.profileChart.addAxis('y', {
            min: yMin,
            max: yMax,
            fontColor: this.chartRenderingOptions.axisFontColor,
            font: lang.replace('normal normal bold {axisLabelFontSize}pt verdana', this.chartRenderingOptions),
            vertical: true,
            natural: true,
            fixed: true,
            includeZero: false,
            majorLabels: true,
            minorLabels: true,
            majorTicks: true,
            minorTicks: true,
            majorTick: {
              color: this.chartRenderingOptions.axisMajorTickColor,
              length: 6
            },
            title: lang.replace(this.nls.chart.elevationTitleTemplate, [this._getDisplayUnits(true)]),
            titleGap: 30,
            titleFont: lang.replace('normal normal bold {axisTitleFontSize}pt verdana', this.chartRenderingOptions),
            titleFontColor: this.chartRenderingOptions.titleFontColor,
            titleOrientation: 'axis'
          });

          // X AXIS //
          this.profileChart.addAxis('x', {
            fontColor: this.chartRenderingOptions.axisFontColor,
            font: lang.replace('normal normal bold {axisLabelFontSize}pt verdana', this.chartRenderingOptions),
            natural: true,
            fixed: true,
            includeZero: false,
            majorLabels: true,
            minorLabels: true,
            majorTicks: true,
            minorTicks: true,
            majorTick: {
              color: this.chartRenderingOptions.axisMajorTickColor,
              length: 6
            },
            title: lang.replace(this.nls.chart.distanceTitleTemplate, [this._getDisplayUnits(false)]),
            titleGap: 5,
            titleFont: lang.replace('normal normal bold {axisTitleFontSize}pt verdana', this.chartRenderingOptions),
            titleFontColor: this.chartRenderingOptions.titleFontColor,
            titleOrientation: 'away'
          });

          // GRID //
          this.profileChart.addPlot('grid', {
            type: Grid,
            hMajorLines: true,
            hMinorLines: false,
            vMajorLines: false,
            vMinorLines: false
          });

          // PROFIlE PLOT //
          this.profileChart.addPlot('default', {
            type: Areas,
            tension: 'X'
          });

          // WATER PLOT //
          this.profileChart.addPlot('water', {
            type: Areas
          });

          // WATER DATA //
          this.profileChart.addSeries(waterDataSeriesName, waterData, {
            plot: 'water',
            stroke: {
              width: 2.0,
              color: this.chartRenderingOptions.waterLineColor
            },
            fill: {
              type: 'linear',
              space: 'plot',
              x1: 50,
              y1: 0,
              x2: 50,
              y2: 100,
              colors: [
                {
                  offset: 0.0,
                  color: this.chartRenderingOptions.waterTopColor
                },
                {
                  offset: 1.0,
                  color: this.chartRenderingOptions.waterBottomColor
                }
            ]
            }
          });

          // PROFILE DATA //
          this.profileChart.addSeries(elevationDataSeriesName, this.elevationData, {
            plot: 'default',
            stroke: {
              width: 1.5,
              color: this.chartRenderingOptions.elevationLineColor
            },
            fill: {
              type: 'linear',
              space: 'plot',
              x1: 50,
              y1: 0,
              x2: 50,
              y2: 100,
              colors: [
                {
                  offset: 0.0,
                  color: this.chartRenderingOptions.elevationTopColor
                },
                {
                  offset: 1.0,
                  color: this.chartRenderingOptions.elevationBottomColor
                }
            ]
            }
          });

          // RENDER CHART //
          this.profileChart.render();
          deferred.resolve();
        }

        return deferred.promise;
      },

      _convertElevationsInfoArray: function (elevationArray) {
        var displayUnitsX = this._getDisplayUnits(false);
        var displayUnitsY = this._getDisplayUnits(true);
        return array.map(elevationArray, lang.hitch(this, function (item) {
          return lang.mixin(item, {
            x: this._getDisplayValue(item.x, displayUnitsX),
            y: this._getDisplayValue(item.y, displayUnitsY)
          });
        }));
      },

      _getDisplayValue: function (valueMeters, displayUnits) {
        if(displayUnits === this.measureTool.units.esriMeters) {
          return valueMeters;
        } else {
          var distanceMiles = (valueMeters / this.measureTool.unitDictionary[this.measureTool.units.esriMeters]);
          return (distanceMiles * this.measureTool.unitDictionary[displayUnits]);
        }
      },

      _getFilledArray: function (size, value, asMultiplier) {
        var dataArray = new Array(size);
        for (var dataIdx = 0; dataIdx < size; ++dataIdx) {
          dataArray[dataIdx] = {
            x: asMultiplier ? (dataIdx * value) : dataIdx,
            y: asMultiplier ? 0.0 : (value || 0.0)
          };
        }
        return dataArray;
      },

      _getDisplayUnits: function (isElevation) {
        var displayUnits = this.measureTool.unit.label;
        if (isElevation) {
          switch (displayUnits) {
          case this.measureTool.units.esriMiles:
            displayUnits = this.measureTool.units.esriFeet;
            break;
          case this.measureTool.esriYards:
            displayUnits = this.measureTool.esriFeet;
            break;
          case this.measureTool.units.esriKilometers:
            displayUnits = this.measureTool.units.esriMeters;
            break;
          }
        }
        return displayUnits;
      },

      _convertDistancesArray: function (distancesArray) {
        var displayUnitsX = this._getDisplayUnits(false);
        return array.map(distancesArray, lang.hitch(this, function (distance) {
          return this._getDisplayValue(distance, displayUnitsX);
        }));
      },

      _resetArray: function (dataArray, value) {
        return array.map(dataArray, function (item) {
          return {
            x: item.x,
            y: value
          };
        });
      },

      _getArrayMax: function (dataArray) {
        var values = array.map(dataArray, function (item) {
          return item.y;
        });
        return Math.max.apply(Math, values);
      },

      _getArrayMin: function (dataArray) {
        var values = array.map(dataArray, function (item) {
          return item.y;
        });
        return Math.min.apply(Math, values);
      },

      _onSymEditOk: function() {
        this.config.symbols = this.popupsymedit.getConfig().symbols;
        this.popup.close();
        this.popupState = '';
      },

      _onSymEditClose: function() {
        this.popupsymedit = null;
        this.popup = null;
      },

      _openSymEdit: function(title) {
        this.popupsymedit = new SymbologyEdit({
          nls: this.nls,
          config: this.config || {}
        });

        this.popup = new Popup({
          titleLabel: title,
          autoHeight: true,
          content: this.popupsymedit,
          container: 'main-page',
          width: 540,
          buttons: [{
            label: this.nls.ok,
            key: keys.ENTER,
            onClick: lang.hitch(this, '_onSymEditOk')
          }, {
            label: this.nls.cancel,
            key: keys.ESCAPE
          }],
          onClose: lang.hitch(this, '_onSymEditClose')
        });
        html.addClass(this.popup.domNode, 'widget-setting-symbology');
        this.popupsymedit.startup();
      },

      _onChartEditOk: function() {
        var newConfig = this.popupchartedit.getConfig();
        this.chartRenderingOptions = lang.mixin({}, newConfig.chartRenderingOptions);
        this.config.scalebarUnits = newConfig.scalebarUnits;
        this.popup2.close();
        this.popupState = '';
        this._updateProfileChart();
      },

      _onChartEditClose: function() {
        this.popupchartedit = null;
        this.popup2 = null;
      },

      _openChartEdit: function(title) {
        this.popupchartedit = new ChartEdit({
          nls: this.nls,
          config: this.config || {}
        });

        this.popup2 = new Popup({
          titleLabel: title,
          autoHeight: true,
          content: this.popupchartedit,
          container: 'main-page',
          buttons: [{
            label: this.nls.ok,
            key: keys.ENTER,
            onClick: lang.hitch(this, '_onChartEditOk')
          }, {
            label: this.nls.cancel,
            key: keys.ESCAPE
          }],
          onClose: lang.hitch(this, '_onChartEditClose')
        });
        html.addClass(this.popup2.domNode, 'widget-setting-symbology');
        this.popupchartedit.startup();
      },

      elevationInfo: {
        "elevations": [{
          "x": 0,
          "y": -39,
          "pathIdx": 0,
          "pointIdx": 0
          }, {
          "x": 24.872099999993225,
          "y": -39,
          "pathIdx": 0,
          "pointIdx": 1
          }, {
          "x": 49.744000000006054,
          "y": -39,
          "pathIdx": 0,
          "pointIdx": 2
          }, {
          "x": 74.61609999999928,
          "y": -39,
          "pathIdx": 0,
          "pointIdx": 3
  }, {
          "x": 99.4881000000023,
          "y": -38.79170000000158,
          "pathIdx": 0,
          "pointIdx": 4
  }, {
          "x": 124.36010000000533,
          "y": -37.738100000002305,
          "pathIdx": 0,
          "pointIdx": 5
  }, {
          "x": 149.23219999999856,
          "y": -36.68450000000303,
          "pathIdx": 0,
          "pointIdx": 6
  }, {
          "x": 174.10409999999683,
          "y": -35.63090000000375,
          "pathIdx": 0,
          "pointIdx": 7
  }, {
          "x": 198.9762000000046,
          "y": -34.57730000000447,
          "pathIdx": 0,
          "pointIdx": 8
  }, {
          "x": 223.84819999999308,
          "y": -33.52370000000519,
          "pathIdx": 0,
          "pointIdx": 9
  }, {
          "x": 248.7201999999961,
          "y": -32.47019999999611,
          "pathIdx": 0,
          "pointIdx": 10
  }, {
          "x": 273.5923000000039,
          "y": -31.416599999996834,
          "pathIdx": 0,
          "pointIdx": 11
  }, {
          "x": 298.4643000000069,
          "y": -31,
          "pathIdx": 0,
          "pointIdx": 12
  }, {
          "x": 323.3362999999954,
          "y": -31,
          "pathIdx": 0,
          "pointIdx": 13
  }, {
          "x": 348.2082999999984,
          "y": -31,
          "pathIdx": 0,
          "pointIdx": 14
  }, {
          "x": 373.0804000000062,
          "y": -31,
          "pathIdx": 0,
          "pointIdx": 15
  }, {
          "x": 397.95239999999467,
          "y": -31,
          "pathIdx": 0,
          "pointIdx": 16
  }, {
          "x": 422.8243999999977,
          "y": -27.82060000000638,
          "pathIdx": 0,
          "pointIdx": 17
  }, {
          "x": 447.69650000000547,
          "y": -21.5341000000044,
          "pathIdx": 0,
          "pointIdx": 18
  }, {
          "x": 472.56840000000375,
          "y": -15.247600000002421,
          "pathIdx": 0,
          "pointIdx": 19
  }, {
          "x": 497.440499999997,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 20
  }, {
          "x": 522.3125,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 21
  }, {
          "x": 547.184500000003,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 22
  }, {
          "x": 572.056500000006,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 23
  }, {
          "x": 596.9284999999945,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 24
  }, {
          "x": 621.8006000000023,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 25
  }, {
          "x": 646.6726000000053,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 26
  }, {
          "x": 671.5445999999938,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 27
  }, {
          "x": 696.4167000000016,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 28
  }, {
          "x": 721.2887000000046,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 29
  }, {
          "x": 746.1606999999931,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 30
  }, {
          "x": 771.0328000000009,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 31
  }, {
          "x": 795.9048000000039,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 32
  }, {
          "x": 820.7768000000069,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 33
  }, {
          "x": 845.6487999999954,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 34
  }, {
          "x": 870.5207999999984,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 35
  }, {
          "x": 895.3929000000062,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 36
  }, {
          "x": 920.2648000000045,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 37
  }, {
          "x": 945.1368999999977,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 38
  }, {
          "x": 970.0089000000007,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 39
  }, {
          "x": 994.8809000000037,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 40
  }, {
          "x": 1019.752999999997,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 41
  }, {
          "x": 1044.625,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 42
  }, {
          "x": 1069.497000000003,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 43
  }, {
          "x": 1094.369000000006,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 44
  }, {
          "x": 1119.2410999999993,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 45
  }, {
          "x": 1144.1131000000023,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 46
  }, {
          "x": 1168.9851000000053,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 47
  }, {
          "x": 1193.8570999999938,
          "y": -11,
          "pathIdx": 0,
          "pointIdx": 48
  }, {
          "x": 1218.7290999999968,
          "y": -9.043499999999767,
          "pathIdx": 0,
          "pointIdx": 49
  }, {
          "x": 1243.6012000000046,
          "y": -6.214500000001863,
          "pathIdx": 0,
          "pointIdx": 50
  }, {
          "x": 1268.473199999993,
          "y": -3.385599999994156,
          "pathIdx": 0,
          "pointIdx": 51
  }, {
          "x": 1293.345199999996,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 52
  }, {
          "x": 1318.217300000004,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 53
  }, {
          "x": 1343.0892000000022,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 54
  }, {
          "x": 1367.9612999999954,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 55
  }, {
          "x": 1392.8334000000032,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 56
  }, {
          "x": 1417.7053000000014,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 57
  }, {
          "x": 1442.5773999999947,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 58
  }, {
          "x": 1467.4493999999977,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 59
  }, {
          "x": 1492.3214000000007,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 60
  }, {
          "x": 1517.193499999994,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 61
  }, {
          "x": 1542.0654000000068,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 62
  }, {
          "x": 1566.9375,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 63
  }, {
          "x": 1591.809500000003,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 64
  }, {
          "x": 1616.681500000006,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 65
  }, {
          "x": 1641.5535999999993,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 66
  }, {
          "x": 1666.4256000000023,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 67
  }, {
          "x": 1691.2976000000053,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 68
  }, {
          "x": 1716.1695999999938,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 69
  }, {
          "x": 1741.0417000000016,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 70
  }, {
          "x": 1765.9137000000046,
          "y": -1.8208000000013271,
          "pathIdx": 0,
          "pointIdx": 71
  }, {
          "x": 1790.785699999993,
          "y": -1.9257000000070548,
          "pathIdx": 0,
          "pointIdx": 72
  }, {
          "x": 1815.6578000000009,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 73
  }, {
          "x": 1840.5296999999991,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 74
  }, {
          "x": 1865.401800000007,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 75
  }, {
          "x": 1890.2737999999954,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 76
  }, {
          "x": 1915.1457999999984,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 77
  }, {
          "x": 1940.0179000000062,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 78
  }, {
          "x": 1964.8898000000045,
          "y": -2,
          "pathIdx": 0,
          "pointIdx": 79
  }, {
          "x": 1989.7618999999977,
          "y": -1.821700000000419,
          "pathIdx": 0,
          "pointIdx": 80
  }, {
          "x": 2014.6339000000007,
          "y": -0.0166999999928521,
          "pathIdx": 0,
          "pointIdx": 81
  }, {
          "x": 2039.5059000000037,
          "y": 2.0292999999946915,
          "pathIdx": 0,
          "pointIdx": 82
  }, {
          "x": 2064.377999999997,
          "y": 4.157999999995809,
          "pathIdx": 0,
          "pointIdx": 83
  }, {
          "x": 2089.25,
          "y": 12.451900000000023,
          "pathIdx": 0,
          "pointIdx": 84
  }, {
          "x": 2114.122000000003,
          "y": 24.95900000000256,
          "pathIdx": 0,
          "pointIdx": 85
  }, {
          "x": 2138.9940999999963,
          "y": 39.28750000000582,
          "pathIdx": 0,
          "pointIdx": 86
  }, {
          "x": 2163.8659999999945,
          "y": 54.908500000005006,
          "pathIdx": 0,
          "pointIdx": 87
  }, {
          "x": 2188.7381000000023,
          "y": 72.40020000000368,
          "pathIdx": 0,
          "pointIdx": 88
  }, {
          "x": 2213.6101000000053,
          "y": 89.07889999999315,
          "pathIdx": 0,
          "pointIdx": 89
  }, {
          "x": 2238.482099999994,
          "y": 103.94779999999446,
          "pathIdx": 0,
          "pointIdx": 90
  }, {
          "x": 2263.3542000000016,
          "y": 118.2323000000033,
          "pathIdx": 0,
          "pointIdx": 91
  }, {
          "x": 2288.2262000000046,
          "y": 132.10289999999804,
          "pathIdx": 0,
          "pointIdx": 92
  }, {
          "x": 2313.098199999993,
          "y": 145.771900000007,
          "pathIdx": 0,
          "pointIdx": 93
  }, {
          "x": 2337.970199999996,
          "y": 161.07140000000072,
          "pathIdx": 0,
          "pointIdx": 94
  }, {
          "x": 2362.842199999999,
          "y": 177.38219999999274,
          "pathIdx": 0,
          "pointIdx": 95
  }, {
          "x": 2387.714300000007,
          "y": 193.35409999999683,
          "pathIdx": 0,
          "pointIdx": 96
  }, {
          "x": 2412.5862999999954,
          "y": 205.17429999999877,
          "pathIdx": 0,
          "pointIdx": 97
  }, {
          "x": 2437.4582999999984,
          "y": 218.17549999999756,
          "pathIdx": 0,
          "pointIdx": 98
  }, {
          "x": 2462.3303000000014,
          "y": 232.5014999999985,
          "pathIdx": 0,
          "pointIdx": 99
  }, {
          "x": 2487.2023999999947,
          "y": 242.68709999999555,
          "pathIdx": 0,
          "pointIdx": 100
  }, {
          "x": 2512.0743999999977,
          "y": 251.62489999999525,
          "pathIdx": 0,
          "pointIdx": 101
  }, {
          "x": 2536.9464000000007,
          "y": 260.64560000000347,
          "pathIdx": 0,
          "pointIdx": 102
  }, {
          "x": 2561.8184000000037,
          "y": 266.4514000000054,
          "pathIdx": 0,
          "pointIdx": 103
  }, {
          "x": 2586.690400000007,
          "y": 268.8435999999929,
          "pathIdx": 0,
          "pointIdx": 104
  }, {
          "x": 2611.5625,
          "y": 270.6561999999976,
          "pathIdx": 0,
          "pointIdx": 105
  }, {
          "x": 2636.434500000003,
          "y": 271.4079999999958,
          "pathIdx": 0,
          "pointIdx": 106
  }, {
          "x": 2661.306500000006,
          "y": 270.34189999999944,
          "pathIdx": 0,
          "pointIdx": 107
  }, {
          "x": 2686.1785999999993,
          "y": 267.8683000000019,
          "pathIdx": 0,
          "pointIdx": 108
  }, {
          "x": 2711.0504999999976,
          "y": 263.6779999999999,
          "pathIdx": 0,
          "pointIdx": 109
  }, {
          "x": 2735.9226000000053,
          "y": 257.486699999994,
          "pathIdx": 0,
          "pointIdx": 110
  }, {
          "x": 2760.7946999999986,
          "y": 248.92220000000088,
          "pathIdx": 0,
          "pointIdx": 111
  }, {
          "x": 2785.666599999997,
          "y": 240.64890000000014,
          "pathIdx": 0,
          "pointIdx": 112
  }, {
          "x": 2810.5387000000046,
          "y": 235.41749999999593,
          "pathIdx": 0,
          "pointIdx": 113
  }, {
          "x": 2835.410600000003,
          "y": 229.9377999999997,
          "pathIdx": 0,
          "pointIdx": 114
  }, {
          "x": 2860.282699999996,
          "y": 224.2097000000067,
          "pathIdx": 0,
          "pointIdx": 115
  }, {
          "x": 2885.154800000004,
          "y": 222.13950000000477,
          "pathIdx": 0,
          "pointIdx": 116
  }, {
          "x": 2910.026700000002,
          "y": 221.35659999999916,
          "pathIdx": 0,
          "pointIdx": 117
  }, {
          "x": 2934.8987999999954,
          "y": 221.4082000000053,
          "pathIdx": 0,
          "pointIdx": 118
  }, {
          "x": 2959.7707999999984,
          "y": 221.96970000000147,
          "pathIdx": 0,
          "pointIdx": 119
  }, {
          "x": 2984.6428000000014,
          "y": 223.53140000000712,
          "pathIdx": 0,
          "pointIdx": 120
  }, {
          "x": 3009.5148999999947,
          "y": 226.00389999999607,
          "pathIdx": 0,
          "pointIdx": 121
  }, {
          "x": 3034.3868999999977,
          "y": 228.19019999999728,
          "pathIdx": 0,
          "pointIdx": 122
  }, {
          "x": 3059.2589000000007,
          "y": 230.8073000000004,
          "pathIdx": 0,
          "pointIdx": 123
  }, {
          "x": 3084.1309000000037,
          "y": 235.16289999999572,
          "pathIdx": 0,
          "pointIdx": 124
  }, {
          "x": 3109.002999999997,
          "y": 239.99580000000424,
          "pathIdx": 0,
          "pointIdx": 125
  }, {
          "x": 3133.875,
          "y": 240.4673999999941,
          "pathIdx": 0,
          "pointIdx": 126
  }, {
          "x": 3158.747000000003,
          "y": 240.6490999999951,
          "pathIdx": 0,
          "pointIdx": 127
  }, {
          "x": 3183.619000000006,
          "y": 241.21929999999702,
          "pathIdx": 0,
          "pointIdx": 128
  }, {
          "x": 3208.4909999999945,
          "y": 239.15290000000095,
          "pathIdx": 0,
          "pointIdx": 129
  }, {
          "x": 3233.3631000000023,
          "y": 238.16289999999572,
          "pathIdx": 0,
          "pointIdx": 130
  }, {
          "x": 3258.2351000000053,
          "y": 238.2491000000009,
          "pathIdx": 0,
          "pointIdx": 131
  }, {
          "x": 3283.107099999994,
          "y": 239.12029999999504,
          "pathIdx": 0,
          "pointIdx": 132
  }, {
          "x": 3307.9792000000016,
          "y": 240.0046000000002,
          "pathIdx": 0,
          "pointIdx": 133
  }, {
          "x": 3332.8511,
          "y": 238.89459999999963,
          "pathIdx": 0,
          "pointIdx": 134
  }, {
          "x": 3357.723199999993,
          "y": 241.49259999999776,
          "pathIdx": 0,
          "pointIdx": 135
  }, {
          "x": 3382.595199999996,
          "y": 244.2966000000015,
          "pathIdx": 0,
          "pointIdx": 136
  }, {
          "x": 3407.467199999999,
          "y": 246.35540000000037,
          "pathIdx": 0,
          "pointIdx": 137
  }, {
          "x": 3432.339300000007,
          "y": 249.66779999999562,
          "pathIdx": 0,
          "pointIdx": 138
  }, {
          "x": 3457.2112999999954,
          "y": 254.03569999999308,
          "pathIdx": 0,
          "pointIdx": 139
  }, {
          "x": 3482.0832999999984,
          "y": 258.3209000000061,
          "pathIdx": 0,
          "pointIdx": 140
  }, {
          "x": 3506.9553000000014,
          "y": 259.86789999999746,
          "pathIdx": 0,
          "pointIdx": 141
  }, {
          "x": 3531.8273000000045,
          "y": 258.2878000000055,
          "pathIdx": 0,
          "pointIdx": 142
  }, {
          "x": 3556.6993999999977,
          "y": 257.1215999999986,
          "pathIdx": 0,
          "pointIdx": 143
  }, {
          "x": 3581.5714000000007,
          "y": 256.5283999999956,
          "pathIdx": 0,
          "pointIdx": 144
  }, {
          "x": 3606.4434000000037,
          "y": 257.50040000000445,
          "pathIdx": 0,
          "pointIdx": 145
  }, {
          "x": 3631.315499999997,
          "y": 259.96259999999893,
          "pathIdx": 0,
          "pointIdx": 146
  }, {
          "x": 3656.1875,
          "y": 264.0274000000063,
          "pathIdx": 0,
          "pointIdx": 147
  }, {
          "x": 3681.059500000003,
          "y": 270.72879999999714,
          "pathIdx": 0,
          "pointIdx": 148
  }, {
          "x": 3705.931500000006,
          "y": 279.9915000000037,
          "pathIdx": 0,
          "pointIdx": 149
  }, {
          "x": 3730.8034999999945,
          "y": 289.2606999999989,
          "pathIdx": 0,
          "pointIdx": 150
  }, {
          "x": 3755.6756000000023,
          "y": 297.44100000000617,
          "pathIdx": 0,
          "pointIdx": 151
  }, {
          "x": 3780.5476000000053,
          "y": 304.86870000000636,
          "pathIdx": 0,
          "pointIdx": 152
  }, {
          "x": 3805.419599999994,
          "y": 311.63409999999567,
          "pathIdx": 0,
          "pointIdx": 153
  }, {
          "x": 3830.291599999997,
          "y": 317.56410000000324,
          "pathIdx": 0,
          "pointIdx": 154
  }, {
          "x": 3855.1636,
          "y": 322.68889999999374,
          "pathIdx": 0,
          "pointIdx": 155
  }, {
          "x": 3880.035699999993,
          "y": 326.40350000000035,
          "pathIdx": 0,
          "pointIdx": 156
  }, {
          "x": 3904.907699999996,
          "y": 326.5063999999984,
          "pathIdx": 0,
          "pointIdx": 157
  }, {
          "x": 3929.779699999999,
          "y": 325.12270000000717,
          "pathIdx": 0,
          "pointIdx": 158
  }, {
          "x": 3954.651700000002,
          "y": 324.15290000000095,
          "pathIdx": 0,
          "pointIdx": 159
  }, {
          "x": 3979.5237999999954,
          "y": 322.2914000000019,
          "pathIdx": 0,
          "pointIdx": 160
  }, {
          "x": 4004.3957999999984,
          "y": 318.2219000000041,
          "pathIdx": 0,
          "pointIdx": 161
  }, {
          "x": 4029.2678000000014,
          "y": 314.40089999999327,
          "pathIdx": 0,
          "pointIdx": 162
  }, {
          "x": 4054.1398999999947,
          "y": 310.619200000001,
          "pathIdx": 0,
          "pointIdx": 163
  }, {
          "x": 4079.011799999993,
          "y": 304.0426000000007,
          "pathIdx": 0,
          "pointIdx": 164
  }, {
          "x": 4103.883900000001,
          "y": 295.93120000000636,
          "pathIdx": 0,
          "pointIdx": 165
  }, {
          "x": 4128.755999999994,
          "y": 286.8261999999959,
          "pathIdx": 0,
          "pointIdx": 166
  }, {
          "x": 4153.627900000007,
          "y": 277.9195999999938,
          "pathIdx": 0,
          "pointIdx": 167
  }, {
          "x": 4178.5,
          "y": 269.5194999999949,
          "pathIdx": 0,
          "pointIdx": 168
  }, {
          "x": 4203.371899999998,
          "y": 261.6160999999993,
          "pathIdx": 0,
          "pointIdx": 169
  }, {
          "x": 4228.244000000006,
          "y": 255.87870000000112,
          "pathIdx": 0,
          "pointIdx": 170
  }, {
          "x": 4253.116099999999,
          "y": 251.63850000000093,
          "pathIdx": 0,
          "pointIdx": 171
  }, {
          "x": 4277.987999999998,
          "y": 246.3301000000065,
          "pathIdx": 0,
          "pointIdx": 172
  }, {
          "x": 4302.860100000005,
          "y": 238.9131999999954,
          "pathIdx": 0,
          "pointIdx": 173
  }, {
          "x": 4327.732099999994,
          "y": 230.78250000000116,
          "pathIdx": 0,
          "pointIdx": 174
  }, {
          "x": 4352.604099999997,
          "y": 223.47980000000098,
          "pathIdx": 0,
          "pointIdx": 175
  }, {
          "x": 4377.476200000005,
          "y": 215.8622000000032,
          "pathIdx": 0,
          "pointIdx": 176
  }, {
          "x": 4402.348199999993,
          "y": 207.46989999999641,
          "pathIdx": 0,
          "pointIdx": 177
  }, {
          "x": 4427.220199999996,
          "y": 199.7399000000005,
          "pathIdx": 0,
          "pointIdx": 178
  }, {
          "x": 4452.092199999999,
          "y": 191.9817999999941,
          "pathIdx": 0,
          "pointIdx": 179
  }, {
          "x": 4476.964300000007,
          "y": 184.9994000000006,
          "pathIdx": 0,
          "pointIdx": 180
  }, {
          "x": 4501.836299999995,
          "y": 179.09329999999318,
          "pathIdx": 0,
          "pointIdx": 181
  }, {
          "x": 4526.708299999998,
          "y": 174.44800000000396,
          "pathIdx": 0,
          "pointIdx": 182
  }, {
          "x": 4551.580300000001,
          "y": 173.07129999999597,
          "pathIdx": 0,
          "pointIdx": 183
  }, {
          "x": 4576.4523000000045,
          "y": 172.43979999999283,
          "pathIdx": 0,
          "pointIdx": 184
  }, {
          "x": 4601.324399999998,
          "y": 172.55340000000433,
          "pathIdx": 0,
          "pointIdx": 185
  }, {
          "x": 4626.196400000001,
          "y": 170.61879999999655,
          "pathIdx": 0,
          "pointIdx": 186
  }, {
          "x": 4651.068400000004,
          "y": 166.51900000000023,
          "pathIdx": 0,
          "pointIdx": 187
  }, {
          "x": 4675.940499999997,
          "y": 162.09819999999308,
          "pathIdx": 0,
          "pointIdx": 188
  }, {
          "x": 4700.812399999995,
          "y": 156.43919999999343,
          "pathIdx": 0,
          "pointIdx": 189
  }, {
          "x": 4725.684500000003,
          "y": 150.40929999999935,
          "pathIdx": 0,
          "pointIdx": 190
  }, {
          "x": 4750.556599999996,
          "y": 144.46229999999923,
          "pathIdx": 0,
          "pointIdx": 191
  }, {
          "x": 4775.4284999999945,
          "y": 138.75190000000293,
          "pathIdx": 0,
          "pointIdx": 192
  }, {
          "x": 4800.300600000002,
          "y": 133.57790000000386,
          "pathIdx": 0,
          "pointIdx": 193
  }, {
          "x": 4825.172500000001,
          "y": 129.67789999999513,
          "pathIdx": 0,
          "pointIdx": 194
  }, {
          "x": 4850.044599999994,
          "y": 128.84859999999753,
          "pathIdx": 0,
          "pointIdx": 195
  }, {
          "x": 4874.916599999997,
          "y": 130.4106000000029,
          "pathIdx": 0,
          "pointIdx": 196
  }, {
          "x": 4899.7886,
          "y": 132.9661000000051,
          "pathIdx": 0,
          "pointIdx": 197
  }, {
          "x": 4924.660699999993,
          "y": 136.3420999999944,
          "pathIdx": 0,
          "pointIdx": 198
  }, {
          "x": 4949.532699999996,
          "y": 139.30710000000545,
          "pathIdx": 0,
          "pointIdx": 199
  }, {
          "x": 4974.404699999999,
          "y": 142.35480000000098,
          "pathIdx": 0,
          "pointIdx": 200
  }],
        "distances": [0, 24.872099999993225, 49.744000000006054, 74.61609999999928, 99.4881000000023, 124.36010000000533, 149.23219999999856, 174.10409999999683, 198.9762000000046, 223.84819999999308, 248.7201999999961, 273.5923000000039, 298.4643000000069, 323.3362999999954, 348.2082999999984, 373.0804000000062, 397.95239999999467, 422.8243999999977, 447.69650000000547, 472.56840000000375, 497.440499999997, 522.3125, 547.184500000003, 572.056500000006, 596.9284999999945, 621.8006000000023, 646.6726000000053, 671.5445999999938, 696.4167000000016, 721.2887000000046, 746.1606999999931, 771.0328000000009, 795.9048000000039, 820.7768000000069, 845.6487999999954, 870.5207999999984, 895.3929000000062, 920.2648000000045, 945.1368999999977, 970.0089000000007, 994.8809000000037, 1019.752999999997, 1044.625, 1069.497000000003, 1094.369000000006, 1119.2410999999993, 1144.1131000000023, 1168.9851000000053, 1193.8570999999938, 1218.7290999999968, 1243.6012000000046, 1268.473199999993, 1293.345199999996, 1318.217300000004, 1343.0892000000022, 1367.9612999999954, 1392.8334000000032, 1417.7053000000014, 1442.5773999999947, 1467.4493999999977, 1492.3214000000007, 1517.193499999994, 1542.0654000000068, 1566.9375, 1591.809500000003, 1616.681500000006, 1641.5535999999993, 1666.4256000000023, 1691.2976000000053, 1716.1695999999938, 1741.0417000000016, 1765.9137000000046, 1790.785699999993, 1815.6578000000009, 1840.5296999999991, 1865.401800000007, 1890.2737999999954, 1915.1457999999984, 1940.0179000000062, 1964.8898000000045, 1989.7618999999977, 2014.6339000000007, 2039.5059000000037, 2064.377999999997, 2089.25, 2114.122000000003, 2138.9940999999963, 2163.8659999999945, 2188.7381000000023, 2213.6101000000053, 2238.482099999994, 2263.3542000000016, 2288.2262000000046, 2313.098199999993, 2337.970199999996, 2362.842199999999, 2387.714300000007, 2412.5862999999954, 2437.4582999999984, 2462.3303000000014, 2487.2023999999947, 2512.0743999999977, 2536.9464000000007, 2561.8184000000037, 2586.690400000007, 2611.5625, 2636.434500000003, 2661.306500000006, 2686.1785999999993, 2711.0504999999976, 2735.9226000000053, 2760.7946999999986, 2785.666599999997, 2810.5387000000046, 2835.410600000003, 2860.282699999996, 2885.154800000004, 2910.026700000002, 2934.8987999999954, 2959.7707999999984, 2984.6428000000014, 3009.5148999999947, 3034.3868999999977, 3059.2589000000007, 3084.1309000000037, 3109.002999999997, 3133.875, 3158.747000000003, 3183.619000000006, 3208.4909999999945, 3233.3631000000023, 3258.2351000000053, 3283.107099999994, 3307.9792000000016, 3332.8511, 3357.723199999993, 3382.595199999996, 3407.467199999999, 3432.339300000007, 3457.2112999999954, 3482.0832999999984, 3506.9553000000014, 3531.8273000000045, 3556.6993999999977, 3581.5714000000007, 3606.4434000000037, 3631.315499999997, 3656.1875, 3681.059500000003, 3705.931500000006, 3730.8034999999945, 3755.6756000000023, 3780.5476000000053, 3805.419599999994, 3830.291599999997, 3855.1636, 3880.035699999993, 3904.907699999996, 3929.779699999999, 3954.651700000002, 3979.5237999999954, 4004.3957999999984, 4029.2678000000014, 4054.1398999999947, 4079.011799999993, 4103.883900000001, 4128.755999999994, 4153.627900000007, 4178.5, 4203.371899999998, 4228.244000000006, 4253.116099999999, 4277.987999999998, 4302.860100000005, 4327.732099999994, 4352.604099999997, 4377.476200000005, 4402.348199999993, 4427.220199999996, 4452.092199999999, 4476.964300000007, 4501.836299999995, 4526.708299999998, 4551.580300000001, 4576.4523000000045, 4601.324399999998, 4626.196400000001, 4651.068400000004, 4675.940499999997, 4700.812399999995, 4725.684500000003, 4750.556599999996, 4775.4284999999945, 4800.300600000002, 4825.172500000001, 4850.044599999994, 4874.916599999997, 4899.7886, 4924.660699999993, 4949.532699999996, 4974.404699999999],
        "samplingDistance": 24.996946108838113
      }
    });
  });
