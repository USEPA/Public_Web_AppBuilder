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
    'dojo/_base/html',
    'dojo/query',
    'jimu/BaseWidgetPanel',
    './TabWidgetFrame'
  ],
  function(
    declare, html, query, BaseWidgetPanel, TabWidgetFrame
  ) {

    return declare([BaseWidgetPanel], {
      baseClass: 'jimu-widget-panel jimu-tab-panel jimu-main-bgcolor',

      createFrame: function(widgetConfig) {
        var frame = new TabWidgetFrame({
          label: widgetConfig.label
        });

        this._setFrameSize(frame);
        return frame;
      },

      _setFrameSize: function(frame) {
        var count = this.getChildren().length + 1;

        var hPrecent = 1 / count * 100;
        query('.tab-widget-frame', this.containerNode).style('height', hPrecent + '%');
        html.setStyle(frame.domNode, 'height', hPrecent + '%');
      }
    });
  });