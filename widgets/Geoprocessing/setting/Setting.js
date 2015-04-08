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
  'dojo/_base/html',
  'dojo/on',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidgetSetting',
  'jimu/dijit/GpSource',
  'jimu/dijit/ViewStack',
  'jimu/dijit/Popup',
  './SettingDetail',
  'dijit/form/ValidationTextBox'
],
function(declare, lang, html, on, _WidgetsInTemplateMixin, BaseWidgetSetting,
  GpSource, ViewStack, Popup, SettingDetail) {
  return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
    baseClass: 'jimu-widget-setting-gp',

    startup: function(){
      this.inherited(arguments);

      this.settingDetail = new SettingDetail({
        config: lang.clone(this.config),
        nls: this.nls,
        map: this.map
      }, this.settingDetailNode);

      this.viewStack = new ViewStack({
        viewType: 'dijit',
        views: [this.settingDetail]
      }, this.stackNode);
      this.viewStack.startup();
      this.setConfig(this.config);
      setTimeout(lang.hitch(this, this.resize), 100);
    },

    _onChooseTaskClicked: function(){
      var args = {
        portalUrl: this.appConfig.portalUrl
      };
      var gpSource = new GpSource(args);
      var popup = new Popup({
        titleLabel: this.nls.setTaskTitle,
        width: 830,
        height: 560,
        content: gpSource
      });

      this.own(on(gpSource, 'ok', lang.hitch(this, function(tasks){
        if(tasks.length === 0){
          popup.close();
          return;
        }
        if(this.config.taskUrl === tasks[0].url){
          popup.close();
          return;
        }
        this.config.taskUrl = tasks[0].url;
        this.urlTextBox.set('value', this.config.taskUrl);
        this.settingDetail.setConfig(this.config);
        popup.close();
      })));
      this.own(on(gpSource, 'cancel', lang.hitch(this, function(){
        popup.close();
      })));
    },

    resize: function(){
      var box = html.getContentBox(this.domNode);
      html.setStyle(this.stackNode, {
        height: (box.h - 40 - 3) + 'px'
      });
    },

    setConfig: function(config){
      if(config.taskUrl){
        this.settingDetail.setConfig(config);

        this.urlTextBox.set('value', config.taskUrl);
      }
    },

    getConfig: function () {
      //because the setting detail maybe re-write the config object,
      //so, call setting detail's getConfig here
      return this.settingDetail.getConfig();
    },

    _onServiceSelected: function(service){
      if(this.config.taskUrl === service.url){
        return;
      }
      this.config.taskUrl = service.url;
      this.settingDetail.setConfig(this.config);
    }

  });
});
