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
          helpLink[0].href = 'http://gis.calhouncounty.org/WAB/V1.1/widgets/StreetView/help/streetview_Help.htm';
          html.setStyle(helpLink[0],'display','block');
        },600);
        this.config = config;
        this.hideCbx.checked = this.config.hidestreetviewvwidowwhenminimized === true;
        this.svPopupHeight.set('value', parseInt(this.config.windowproperties.height));
        this.svPopupWidth.set('value', parseInt(this.config.windowproperties.width));
        this.APIKey.set('value', this.config.googleapikey);
        this.ClientId.set('value', this.config.clientid);
        this.addressControlCbx.checked = this.config.streetviewpanoramaoptions.addresscontrol.visible === true;
        this.AddCtrlPosition.set('value', this.config.streetviewpanoramaoptions.addresscontrol.controlposition);
        this.panControlCbx.checked = this.config.streetviewpanoramaoptions.pancontrol.visible === true;
        this.PanCtrlPosition.set('value', this.config.streetviewpanoramaoptions.pancontrol.controlposition);
        this.zoomControlCbx.checked = this.config.streetviewpanoramaoptions.zoomcontrol.visible === true;
        this.ZoomCtrlPosition.set('value', this.config.streetviewpanoramaoptions.zoomcontrol.controlposition);
        this.ZoomCtrlStyle.set('value', this.config.streetviewpanoramaoptions.zoomcontrol.controlstyle);
        this.clickToGoCbx.checked = this.config.streetviewpanoramaoptions.clicktogo === true;
        this.disableDoubleClickZoomCbx.checked = this.config.streetviewpanoramaoptions.disabledoubleclickzoom === true;
        this.imageDateControlCbx.checked = this.config.streetviewpanoramaoptions.imagedatecontrol === true;
        this.linksControlCbx.checked = this.config.streetviewpanoramaoptions.linkscontrol === true;
      },

      getConfig: function() {
        this.config.hidestreetviewvwidowwhenminimized = this.hideCbx.checked;
        this.config.windowproperties.height = this.svPopupHeight.value;
        this.config.windowproperties.width = this.svPopupWidth.value;
        this.config.googleapikey = this.APIKey.get('value');
        this.config.clientid = this.ClientId.get('value');
        this.config.streetviewpanoramaoptions.addresscontrol.visible = this.addressControlCbx.checked;
        this.config.streetviewpanoramaoptions.addresscontrol.controlposition = this.AddCtrlPosition.get('value');
        this.config.streetviewpanoramaoptions.pancontrol.visible = this.panControlCbx.checked;
        this.config.streetviewpanoramaoptions.pancontrol.controlposition = this.PanCtrlPosition.get('value');
        this.config.streetviewpanoramaoptions.zoomcontrol.visible = this.zoomControlCbx.checked;
        this.config.streetviewpanoramaoptions.zoomcontrol.controlposition = this.ZoomCtrlPosition.get('value');
        this.config.streetviewpanoramaoptions.zoomcontrol.controlstyle = this.ZoomCtrlStyle.get('value');
        this.config.streetviewpanoramaoptions.clicktogo = this.clickToGoCbx.checked;
        this.config.streetviewpanoramaoptions.disabledoubleclickzoom = this.disableDoubleClickZoomCbx.checked;
        this.config.streetviewpanoramaoptions.imagedatecontrol = this.imageDateControlCbx.checked;
        this.config.streetviewpanoramaoptions.linkscontrol = this.linksControlCbx.checked;
        return this.config;
      }

    });
  });