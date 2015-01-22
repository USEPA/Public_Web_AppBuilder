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
    'dojo/aspect',
    'jimu/BaseWidget',
    'esri/dijit/OverviewMap',
    'jimu/utils',
    "dojo/dom-style"
  ],
  function(
    declare,
    lang,
    html,
    aspect,
    BaseWidget,
    OverviewMap,
    utils,
    domStyle) {
    var clazz = declare([BaseWidget], {

      name: 'OverviewMap',
      overviewMapDijit: null,

      startup: function() {
        this.inherited(arguments);
        this.createOverviewMap();
      },

      createOverviewMap: function(visible) {
        var json = this.config.overviewMap;
        json.map = this.map;
        if (visible !== undefined) {
          json.visible = visible;
        }

        if (this.position) {
          if (this.position.top !== undefined && this.position.left !== undefined) {
            json.attachTo = !window.isRTL ? "top-left" : "top-right";
          } else if (this.position.top !== undefined && this.position.right !== undefined) {
            json.attachTo = !window.isRTL ? "top-right" : "top-left";
          } else if (this.position.bottom !== undefined && this.position.left !== undefined) {
            json.attachTo = !window.isRTL ? "bottom-left": "bottom-right";
          } else if (this.position.bottom !== undefined && this.position.right !== undefined) {
            json.attachTo = !window.isRTL ? "bottom-right" : "bottom-left";
          }
        }

        json.width = this.getWidth();
        json.height = this.getHeight();

        // overviewMap dijit has bug in IE8
        var _isShow = json.visible;
        json.visible = false;

        this.overviewMapDijit = new OverviewMap(json);
        this.own(aspect.after(
          this.overviewMapDijit,
          'show',
          lang.hitch(this, '_afterOverviewShow')
        ));
        this.own(aspect.after(
          this.overviewMapDijit,
          'hide',
          lang.hitch(this, '_afterOverviewHide')
        ));
        this.overviewMapDijit.startup();
        
        var style = {
          left: 'auto',
          right: 'auto',
          top: 'auto',
          bottom: 'auto',
          width: 'auto'
        };
        lang.mixin(style, this.position);
        domStyle.set(this.overviewMapDijit.domNode, utils.getPositionStyle(style));

        this.domNode.appendChild(this.overviewMapDijit.domNode);
        if (_isShow) {
          this.overviewMapDijit.show();
        }
      },

      getWidth: function() {
        if (this.config.minWidth === undefined) {
          this.config.minWidth = 200;
        }
        if (this.config.maxWidth === undefined) {
          this.config.maxWidth = 400;
        }
        var width = this.map.width / 4;
        if (width < this.config.minWidth) {
          width = this.config.minWidth;
        } else if (width > this.config.maxWidth) {
          width = this.config.maxWidth;
        }
        return width;
      },

      onReceiveData: function(name) {
        if (name !== "BasemapGallery") {
          return;
        }
        if (this.overviewMapDijit && this.overviewMapDijit.destroy){
          this.overviewMapDijit.destroy();
          html.empty(this.domNode);
        }
        this.createOverviewMap(this.overviewMapDijit.visible);
      },

      getHeight: function() {
        if (this.config.minHeight === undefined) {
          this.config.minHeight = 150;
        }
        if (this.config.maxHeight === undefined) {
          this.config.maxHeight = 300;
        }
        var height = this.map.height / 4;
        if (height < this.config.minHeight) {
          height = this.config.minHeight;
        } else if (height > this.config.maxHeight) {
          height = this.config.maxHeight;
        }
        return height;
      },

      onClose: function() {
        this.overviewMapDijit.destroy();
      },

      _afterOverviewHide: function() {
        domStyle.set(this.domNode, {
          width: "auto",
          height: "auto"
        });
      },

      _afterOverviewShow: function() {
        domStyle.set(this.domNode, {
          width: this.overviewMapDijit.width + 'px',
          height: this.overviewMapDijit.height + 'px'
        });
      }
    });

    return clazz;
  });