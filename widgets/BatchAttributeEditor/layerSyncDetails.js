define([
  "dojo/Evented",
  'dojo/_base/declare',
  'dojo/_base/lang'
],
function (Evented, declare, lang) {
return declare([Evented], {
  declaredClass : 'layerSyncDetails',
  layerID : null,
  numberOfRequest : 0,
  requestComplete : 0,
  totalRecordsToSync : 0,
  recordsSynced : 0,
  deferreds : [],
  complete : false,
  hasError : false,
  constructor : function(/*Object*/args) {
    declare.safeMixin(this, args);
  },
  addDeferred : function(def) {
    def.then(lang.hitch(this, function(added, updated, deleted) {
      this.recordsSynced = this.recordsSynced + updated.length;
      this.requestComplete = this.requestComplete + 1;
      this.emit("requestComplete", {
        'layerID' : this.layerID,
        'countRequest' : updated.length,
        'countSoFar' : this.recordsSynced,
        'totalToSync' : this.totalRecordsToSync,
        'addded': added,
        'removed': deleted
      });
      if (this.isComplete()) {
        this.emit("complete", {});
      }
    }), lang.hitch(this, function(err) {
      this.hasError = true;
      console.log('error: ' + err);
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