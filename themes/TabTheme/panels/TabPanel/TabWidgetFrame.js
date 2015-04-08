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
  'dijit/_TemplatedMixin',
  'dojo/query',
  'dojo/dom-geometry',
  'dojo/text!./TabWidgetFrame.html',
  'jimu/BaseWidgetFrame'],
  function(declare, _TemplatedMixin, query, domGeometry, template, BaseWidgetFrame){
  return declare([BaseWidgetFrame, _TemplatedMixin], {
    baseClass: 'jimu-widget-frame tab-widget-frame',
    templateString: template,
    borderWidth: 1,

    resize: function(){
      var box = domGeometry.getMarginBox(this.domNode),
        h = box.h - this.borderWidth * 2,
        hTitle = domGeometry.getMarginBox(this.titleNode).h,
        hContent = h - hTitle;

      if(h < 0){
        h = 0;
      }
      if(hTitle <= 0){
        hTitle = 0;
      }
      if(hContent <= 0){
        hContent = '100%';
      }else {
        hContent += 'px';
      }
      query(this.containerNode).style({
        height: hContent
      });
      if(this.widget){
        this.widget.resize();
      }
    }
  });
});