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

define(['dojo/_base/declare',
  'dojo/Evented',
  'dojo/_base/lang',
  'dojo/_base/html',
  'jimu/dijit/Popup',
  'jimu/dijit/LoadingIndicator',
  './FilterConfig'
],
/**
 * [description]
 * @module widgets/Stream/setting/FilterConfigPopup
 */
function(declare, Evented, lang, html, Popup, LoadingIndicator, FilterConfig) {
  return /*@alias module:widgets/Stream/setting/FilterConfigPopup*/ declare([Popup, Evented], {
    width: 1024,
    height: 600,
    titleLabel: '',
    filterList: null,
    streamLayer: null,
    nls: null,

    //events:
    //ok return filterList
    //cancel
    constructor: function(){
      this.inherited(arguments);

      this.nls = lang.clone(window.jimuNls.common);
      this.buttons = [{
        label: this.nls.ok,
        onClick: lang.hitch(this, this._accept)
      }, {
        label: this.nls.cancel,
        onClick: lang.hitch(this, this._reject)
      }];
    },

    postCreate: function(){
      this.inherited(arguments);
      html.addClass(this.domNode, 'stream-filter-popup');
      this._initLoading();
      this._initFilter();
    },

    _initFilter: function(){
      this.filter = new FilterConfig({
        streamLayer: this.streamLayer,
        config: this.filterList,
        nls: this.nls
      });
      this.filter.placeAt(this.contentContainerNode);
    },

    _reject: function(){
      this.emit('cancel');
    },

    _accept: function(){
      var filterObj = this.filter.getConfig();
      if (!filterObj) {
        this.emit(null);
      }else{
        this.emit('ok', filterObj);
      }
    },

    _initLoading: function(){
      this.loading = new LoadingIndicator({
        hidden: true
      });
      this.loading.placeAt(this.domNode);
      this.loading.startup();
    }
  });
});
