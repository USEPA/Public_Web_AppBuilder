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
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget'
  ],
  function(declare, html, query, _WidgetsInTemplateMixin, BaseWidget) {
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-about',
      // clasName: 'esri.widgets.About',

      _hasContent: null,

      postCreate: function() {
        this.inherited(arguments);

        this._hasContent = this.config.about && this.config.about.aboutContent;
      },

      startup: function() {
        this.inherited(arguments);

        this.resize();
      },

      resize: function() {
        this._resizeContentImg();
      },

      _resizeContentImg: function() {
        var customBox = html.getContentBox(this.customContentNode);

        if (this._hasContent) {
          html.empty(this.customContentNode);

          var aboutContent = html.toDom(this.config.about.aboutContent);
          // DocumentFragment or single node
          if (aboutContent.nodeType &&
            (aboutContent.nodeType === 11 || aboutContent.nodeType === 1)) {
            var contentImgs = query('img', aboutContent);
            if (contentImgs && contentImgs.length) {
              contentImgs.style({
                maxWidth: (customBox.w - 20) + 'px' // prevent x scroll
              });
            } else if (aboutContent.nodeName.toUpperCase() === 'IMG') {
              html.setStyle(aboutContent, 'maxWidth', (customBox.w - 20) + 'px');
            }
          }
          html.place(aboutContent, this.customContentNode);
        }
      }
    });
    return clazz;
  });