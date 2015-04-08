/*global define*/
define(
  ['dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/on',
    'dojo/_base/Color',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
    'jimu/dijit/Message',
    'dojo/text!./ChartEdit.html',
    'jimu/dijit/ColorPicker',
    'jimu/dijit/CheckBox'
  ],
  function(
    declare,
    lang,
    array,
    html,
    on,
    Color,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    Message,
    template
    ) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'chart-edit',
      templateString: template,
      config: null,
      nls: null,
      _indicatorFontColor: '#eee',
      _indicatorFillColor: '#777',
      _titleFontColor: "#777",
      _axisFontColor: "#777",
      _axisMajorTickColor: "#777",
      _skyTopColor: "#B0E0E6",
      _skyBottomColor: "#4682B4",
      _waterLineColor: "#eee",
      _waterTopColor: "#ADD8E6",
      _waterBottomColor: "#0000FF",
      _elevationLineColor: "#D2B48C",
      _elevationTopColor: "#8B4513",
      _elevationBottomColor: "#CD853F",

      postCreate: function() {
        this.inherited(arguments);
        this.setConfig(this.config);
      },

      startup: function() {
        this.inherited(arguments);
      },

      setConfig:function(config){
        this.config = config;
        if(!this.config){
          return;
        }
        this.constrainCbx.setValue(this.config.chartRenderingOptions.constrain);
        this.selectScalebarUnits.set('value', this.config.scalebarUnits);
        this.ChartTitleFontSize.set('value', this.config.chartRenderingOptions.chartTitleFontSize);
        this.AxisTitleFontSize.set('value', this.config.chartRenderingOptions.axisTitleFontSize);
        this.AxisLabelFontSize.set('value', this.config.chartRenderingOptions.axisLabelFontSize);
        this.indicatorFontColorPicker.setColor(new Color(this.config.chartRenderingOptions.indicatorFontColor));
        this.indicatorFillColorPicker.setColor(new Color(this.config.chartRenderingOptions.indicatorFillColor));
        this.titleFontColorPicker.setColor(new Color(this.config.chartRenderingOptions.titleFontColor));
        this.axisFontColorPicker.setColor(new Color(this.config.chartRenderingOptions.axisFontColor));
        this.axisMajorTickColorPicker.setColor(new Color(this.config.chartRenderingOptions.axisMajorTickColor));
        this.skyTopColorPicker.setColor(new Color(this.config.chartRenderingOptions.skyTopColor));
        this.skyBottomColorPicker.setColor(new Color(this.config.chartRenderingOptions.skyBottomColor));
        this.waterLineColorPicker.setColor(new Color(this.config.chartRenderingOptions.waterLineColor));
        this.waterTopColorPicker.setColor(new Color(this.config.chartRenderingOptions.waterTopColor));
        this.waterBottomColorPicker.setColor(new Color(this.config.chartRenderingOptions.waterBottomColor));
        this.elevationLineColorPicker.setColor(new Color(this.config.chartRenderingOptions.elevationLineColor));
        this.elevationTopColorPicker.setColor(new Color(this.config.chartRenderingOptions.elevationTopColor));
        this.elevationBottomColorPicker.setColor(new Color(this.config.chartRenderingOptions.elevationBottomColor));
      },

      getConfig: function() {
        var config = {
          scalebarUnits: this.selectScalebarUnits.get('value'),
          chartRenderingOptions: this.config.chartRenderingOptions
        };
        config.chartRenderingOptions.chartTitleFontSize = this.ChartTitleFontSize.get('value');
        config.chartRenderingOptions.axisTitleFontSize = this.AxisTitleFontSize.get('value');
        config.chartRenderingOptions.axisLabelFontSize = this.AxisLabelFontSize.get('value');
        this.config.chartRenderingOptions.indicatorFontColor = this._getColorHex(this.indicatorFontColorPicker);
        this.config.chartRenderingOptions.indicatorFillColor = this._getColorHex(this.indicatorFillColorPicker);
        this.config.chartRenderingOptions.titleFontColor = this._getColorHex(this.titleFontColorPicker);
        this.config.chartRenderingOptions.axisFontColor = this._getColorHex(this.axisFontColorPicker);
        this.config.chartRenderingOptions.axisMajorTickColor = this._getColorHex(this.axisMajorTickColorPicker);
        this.config.chartRenderingOptions.skyTopColor = this._getColorHex(this.skyTopColorPicker);
        this.config.chartRenderingOptions.skyBottomColor = this._getColorHex(this.skyBottomColorPicker);
        this.config.chartRenderingOptions.waterLineColor = this._getColorHex(this.waterLineColorPicker);
        this.config.chartRenderingOptions.waterTopColor = this._getColorHex(this.waterTopColorPicker);
        this.config.chartRenderingOptions.waterBottomColor = this._getColorHex(this.waterBottomColorPicker);
        this.config.chartRenderingOptions.elevationLineColor = this._getColorHex(this.elevationLineColorPicker);
        this.config.chartRenderingOptions.elevationTopColor = this._getColorHex(this.elevationTopColorPicker);
        this.config.chartRenderingOptions.elevationBottomColor = this._getColorHex(this.elevationBottomColorPicker);
        this.config.chartRenderingOptions.constrain = this.constrainCbx.getValue();
        this.config = config;
        return this.config;
      },

      _getColorHex: function(colorPicker) {
        var color = colorPicker.getColor();
        return color.toHex();
      }
    });
  });
