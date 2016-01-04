///////////////////////////////////////////////////////////////////////////
// Copyright © 2015 Esri. All Rights Reserved.
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
define(['dojo/Evented',
        'dojo/_base/declare',
        'dojo/_base/lang',
        'dojo/_base/array',
        'esri/geometry/geometryEngine'],
function(Evented,
        declare,
        lang,
        array,
        geometryEngine) {
  return declare([Evented], {
    declaredClass : 'layerQueryDetails',
    layer : null,
    fields : null,
    intersectField : null,
    valueIn : null,
    valueOut : null,
    numberOfRequest : 0,
    requestComplete : 0,
    numberOfHits : 0,
    totalRecords : 0,
    currentNumber : 0,
    deferreds : [],
    complete : false,
    hasError : false,
    constructor : function(/*Object*/args) {
      declare.safeMixin(this, args);
    },
    addDeferred : function(def, graphic) {
      def.then(lang.hitch(this, function(results) {
        if (results) {
          array.forEach(graphic, lang.hitch(this, function(gra) {
            array.forEach(results.features, lang.hitch(this, function(res) {
              if (geometryEngine.intersects(gra.geometry, res.geometry)) {
                array.forEach(this.fields, function(field) {
                  if (res.attributes[field]) {
                    gra.attributes[field] = res.attributes[field];
                  }
                }, this);
                gra.attributes[this.intersectField] = this.valueIn;
                gra.symbol = this.valueInSym;
                this.numberOfHits++;
              }
            }));
            this.currentNumber++;
            this.requestComplete++;
          }));
        }
        this.currentNumber = this.currentNumber;
        this.requestComplete = this.requestComplete;
        this.numberOfHits = this.numberOfHits;
        this.emit('requestComplete', {
          'layerID' : this.layer.id,
          'currentNumber' : this.currentNumber,
          'totalRecords' : this.totalRecords,
          'intesected' : this.numberOfHits,
          'name' : this.layer.label
        });
        if (this.isComplete()) {
          //this.layer.setAutoGeneralize(true);
          this.emit('complete', {
            'layerID' : this.layer.id
          });
        }
      }), lang.hitch(this, function(err) {
        this.hasError = true;
        console.log('error: ' + err);
        this.emit('error', {
          'layerID' : this.layer.id
        });
        return err;
      }));
      this.deferreds.push(def);
    },
    isComplete : function() {
      if (this.numberOfRequest === this.requestComplete) {
        this.complete = true;
      } else {
        this.complete = false;
      }
      return this.complete;
    }
  });
});
