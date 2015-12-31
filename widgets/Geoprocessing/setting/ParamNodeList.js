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
  'dojo/_base/lang',
  'dojo/string',
  'dojo/aspect',
  'dojo/on',
  'dojo/dom-class',
  'dojo/dom',
  'dojo/Evented',
  'dojo/dnd/Source',
  'dojo/dom-construct',
  'dijit/_WidgetBase',
  'dojo/text!./ParamNode.html',
  'dojo/text!./ParamNodeAvatar.html'
],
function(declare, lang, stringUtil, aspect, on, domClass, dom, Evented, Source,
  domConstruct, _WidgetBase, template, avatarTemplate) {
  return declare([_WidgetBase, Evented], {
    params: undefined, //gp param, should be an array
    nls: undefined,
    direction: undefined, //'input' or 'output'

    postCreate: function(){
      this.inherited(arguments);

      this.dndObj = new Source(this.domNode, {
        singular: true,
        withHandles: true,
        accept: [this.direction],
        creator: lang.hitch(this, this._paramNodeCreator)
      });
      this.dndObj.insertNodes(false, this.params);

      this.own(on(this.domNode, 'click', lang.hitch(this, this.select)));
      aspect.after(this.dndObj, 'onDrop', lang.hitch(this, this.handleDrop));
    },

    _paramNodeCreator: function(param, hint){
      var node;

      // create a node using an HTML template
      if(hint === 'avatar'){
        node = domConstruct.toDom(stringUtil.substitute(avatarTemplate, {
          param_name: param.name
        }));
      }else{
        node = domConstruct.toDom(stringUtil.substitute(template, {
          nls_name: this.nls.name,
          nls_type: this.nls.type,
          nls_required: this.nls.required,
          param_name: param.name,
          param_dataType: param.dataType,
          param_required: param.required
        }));
      }

      return {
        node: node,
        data: param,
        type: [this.direction]
      };
    },

    getSize: function(){
      return this.params.length;
    },

    selectDefault: function(){
      var node = this.dndObj.getAllNodes()[0];
      var item = this.dndObj.getItem(node.id);
      domClass.add(node, 'dojoDndItemAnchor');
      this.emit('select-param', item.data, this.direction);
    },

    select: function(event){
      var target = event.target || event.srcElement;
      var targetNode;

      this.dndObj.getAllNodes().forEach(function(node){
        if(dom.isDescendant(target, node)){
          targetNode = node;
          domClass.add(node, 'dojoDndItemAnchor');
        }else{
          domClass.remove(node, 'dojoDndItemAnchor');
        }
      });

      if(targetNode){
        var item = this.dndObj.getItem(targetNode.id);
        this.emit('select-param', item.data, this.direction);
      }
    },

    clearSelection: function(){
      this.dndObj.getAllNodes().forEach(function(node){
        domClass.remove(node, 'dojoDndItemAnchor');
      });
    },

    handleDrop: function(source, nodes){
      /*jshint unused: false*/
      var droppedNode = nodes[1][0];

      this.dndObj.getAllNodes().forEach(function(node){
        if(node.id !== droppedNode.id){
          domClass.remove(node, 'dojoDndItemAnchor');
        }
      });
      var item = this.dndObj.getItem(droppedNode.id);
      this.emit('select-param', item.data, this.direction);
    },

    getConfig: function(){
      var params = [];

      this.dndObj.getAllNodes().forEach(function(node){
        var item = this.dndObj.getItem(node.id);
        params.push(item.data);
      }, this);

      return params;
    }
  });
});
