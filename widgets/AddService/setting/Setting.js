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
  'dojo/_base/config',//1.1 - Added by Stan McShinsky
  'jimu/BaseWidgetSetting'
],
function(declare, dojoConfig, BaseWidgetSetting) {//1.1 - Stan McShinsky - Added the dojoConfig

  return declare([BaseWidgetSetting], {
    baseClass: 'jimu-widget-addservice-setting', //1.1 - Added by Stan McShinsky

    postCreate: function(){
      //the config object is passed in
      this.setConfig(this.config); 
    },

    setConfig: function(config){
      this.config = config;//1.1 - Added by Stan McShinsky
    },

    getConfig: function(){
      //WAB will get config object through this method
      return this.config;//1.1 - Added by Stan McShinsky
    }
  });
});