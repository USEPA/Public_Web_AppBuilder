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
  'jimu/utils',
  '../BaseResultRenderer',
  './FeatureSetRenderer',
  './RecordSetRenderer'
],
function(declare, html, utils, BaseResultRenderer, FeatureSetRenderer, RecordSetRenderer) {
  var mo = {};

  mo.UnsupportRenderer = declare(BaseResultRenderer, {
    baseClass: 'jimu-gp-resultrenderer-base jimu-gp-renderer-unsupport',

    postCreate: function(){
      this.inherited(arguments);
      html.setAttr(this.domNode, 'innerHTML', utils.sanitizeHTML(this.message));
    }
  });

  mo.SimpleResultRenderer = declare(BaseResultRenderer, {
    baseClass: 'jimu-gp-resultrenderer-base jimu-gp-renderer-simple',

    postCreate: function(){
      this.inherited(arguments);
      html.setAttr(this.domNode, 'innerHTML', utils.sanitizeHTML(this.message));
    }
  });

  mo.ErrorResultRenderer = declare(BaseResultRenderer, {
    baseClass: 'jimu-gp-resultrenderer-base jimu-gp-renderer-error',

    postCreate: function(){
      this.inherited(arguments);
      html.setAttr(this.domNode, 'innerHTML', utils.sanitizeHTML(this.message));
    }
  });

  mo.RecordSetTable = RecordSetRenderer;

  mo.DrawResultFeatureSet = FeatureSetRenderer;

  return mo;
});
