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
    'dijit/form/ValidationTextBox'
],
    function (declare, BaseWidgetSetting, _WidgetsInTemplateMixin) {
        return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {

            baseClass: 'jimu-widget-setting-elevation-profile',

            startup: function () {
                this.inherited(arguments);
                if (!this.config.elevationSync) {
                    this.config.elevationSync = {};
                }
                if (!this.config.losSync) {
                    this.config.losSync = {};
                }
                this.setConfig(this.config);
            },

            setConfig: function (config) {
                this.config = config;
                if (config.elevationSync.url !== undefined) {
                    this.elevationProfileUrl.set('value', config.elevationSync);
                }
                if (config.losSync.url !== undefined) {
                    this.losUrl.set('value', config.losSync);
                }
            },

            getConfig: function () {
                this.config.elevationSync.url = this.elevationProfileUrl.get('value');
                this.config.losSync.url = this.losUrl.get('value');
                return this.config;
            }
        });
    });