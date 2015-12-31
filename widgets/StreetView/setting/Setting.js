///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB Google Street View Widget
///////////////////////////////////////////////////////////////////////////
/*global define, dojo, setTimeout*/

define([
    'dojo/_base/declare',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
    'dojo/_base/lang',
    'dojo/on',
    'dojo/query',
    'dojo/_base/html',
    'dijit/form/NumberSpinner',
    'dijit/form/Select'
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    lang,
    on, query, html) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'widget-street-view-setting',

      startup: function() {
        this.inherited(arguments);
        this.setConfig(this.config);
      },

      setConfig: function(config) {
        //hack the 'Learn more about this widget link'
        setTimeout(function(){
          var helpLink = dojo.query('.help-link');
          helpLink[0].href = 'http://gis.calhouncounty.org/WAB/V1.3/widgets/StreetView/help/streetview_Help.htm';
          html.setStyle(helpLink[0],'display','block');
        },600);
        this.config = config;
        this.hideCbx.setValue(this.config.hidestreetviewvwidowwhenminimized);
        this.svPopupHeight.set('value', parseInt(this.config.windowproperties.height));
        this.svPopupWidth.set('value', parseInt(this.config.windowproperties.width));
        this.APIKey.set('value', this.config.googleapikey);
        this.ClientId.set('value', this.config.clientid);
        this.addressControlCbx.setValue(this.config.streetviewpanoramaoptions.addresscontrol.visible);
        this.AddCtrlPosition.set('value', this.config.streetviewpanoramaoptions.addresscontrol.controlposition);
        this.panControlCbx.setValue(this.config.streetviewpanoramaoptions.pancontrol.visible);
        this.PanCtrlPosition.set('value', this.config.streetviewpanoramaoptions.pancontrol.controlposition);
        this.zoomControlCbx.setValue(this.config.streetviewpanoramaoptions.zoomcontrol.visible);
        this.ZoomCtrlPosition.set('value', this.config.streetviewpanoramaoptions.zoomcontrol.controlposition);
        this.ZoomCtrlStyle.set('value', this.config.streetviewpanoramaoptions.zoomcontrol.controlstyle);
        this.clickToGoCbx.setValue(this.config.streetviewpanoramaoptions.clicktogo);
        this.disableDoubleClickZoomCbx.setValue(this.config.streetviewpanoramaoptions.disabledoubleclickzoom);
        this.imageDateControlCbx.setValue(this.config.streetviewpanoramaoptions.imagedatecontrol);
        this.linksControlCbx.setValue(this.config.streetviewpanoramaoptions.linkscontrol);
      },

      getConfig: function() {
        this.config.hidestreetviewvwidowwhenminimized = this.hideCbx.getValue();
        this.config.windowproperties.height = this.svPopupHeight.value;
        this.config.windowproperties.width = this.svPopupWidth.value;
        this.config.googleapikey = this.APIKey.get('value');
        this.config.clientid = this.ClientId.get('value');
        this.config.streetviewpanoramaoptions.addresscontrol.visible = this.addressControlCbx.getValue();
        this.config.streetviewpanoramaoptions.addresscontrol.controlposition = this.AddCtrlPosition.get('value');
        this.config.streetviewpanoramaoptions.pancontrol.visible = this.panControlCbx.getValue();
        this.config.streetviewpanoramaoptions.pancontrol.controlposition = this.PanCtrlPosition.get('value');
        this.config.streetviewpanoramaoptions.zoomcontrol.visible = this.zoomControlCbx.getValue();
        this.config.streetviewpanoramaoptions.zoomcontrol.controlposition = this.ZoomCtrlPosition.get('value');
        this.config.streetviewpanoramaoptions.zoomcontrol.controlstyle = this.ZoomCtrlStyle.get('value');
        this.config.streetviewpanoramaoptions.clicktogo = this.clickToGoCbx.getValue();
        this.config.streetviewpanoramaoptions.disabledoubleclickzoom = this.disableDoubleClickZoomCbx.getValue();
        this.config.streetviewpanoramaoptions.imagedatecontrol = this.imageDateControlCbx.getValue();
        this.config.streetviewpanoramaoptions.linkscontrol = this.linksControlCbx.getValue();
        return this.config;
      }

    });
  });
