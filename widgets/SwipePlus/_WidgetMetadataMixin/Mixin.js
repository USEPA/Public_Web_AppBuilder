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
  'dojo/on',
  'dijit/registry',
  'jimu/dijit/Message'
], function(
  declare,
  lang,
  on, 
  registry,
  Message
) {
  var clazz = declare([], {
    
    postCreate: function() {
      this.inherited(arguments);
      
      var nlsPath = this.folderUrl.split('/').slice(0, -3).join('/') + '/' + this._WidgetMetadataMixinPath + '/nls/strings.js';
      
      require(['dojo/i18n!' + nlsPath], lang.hitch(this, function(nls) {
        var _wmmNode;
        if (this.inPanel) {
          _wmmNode = lang.getObject('titleNode', false, registry.byId(this.id + '_panel'));
        } else {
          _wmmNode = this.domNode;
        }
        if (_wmmNode) {
          on(_wmmNode, 'mousedown', lang.hitch(this, function(evt) {
            if(evt.altKey) {
              evt.preventDefault();
              var _wmmMsgStr = nls.widgetVersionLabel + ': ' + this.manifest.version;
              _wmmMsgStr += '\n\n' + nls.wabVersionLabel + ': ' + this.manifest.wabVersion;
              _wmmMsgStr += '\n\n' + this.manifest.description;
              new Message({
                titleLabel: (nls._widgetLabel || this.params.label) + ' ' + (nls.titleSuffix || 'Version Info'),
                message: _wmmMsgStr
              });
            }
          }));
        }
      }));
    }

  });
  
  return clazz;
});
