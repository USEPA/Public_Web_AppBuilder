define([
  "dojo/Evented",
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
],
function (Evented, declare, lang,array) {
    return declare([Evented], {
        declaredClass: 'layerQueryDetails',
        layer: null,
        fields: null,
        intersectField: null,
        valueIn: null,
        valueOut:null,
        numberOfRequest: 0,
        requestComplete: 0,
        totalRecords: 0,
        currentNumber: 0,
        deferreds: [],
        complete: false,
        hasError: false,
        constructor: function (/*Object*/ args) {
            declare.safeMixin(this, args);
        },
        addDeferred: function (def, graphic) {
            def.then(
                lang.hitch(this,
                function (results) {
                    
                  
                    if (results.length > 0) {
                        array.forEach(this.fields, function (field) {
                            if (results[0].attributes[field]) {
                                graphic.attributes[field] = results[0].attributes[field];
                          
                            }
                        },this);
                        graphic.attributes[this.intersectField] = this.valueIn;
                        graphic.symbol = this.valueInSym;
                    }
                    else{
                        graphic.attributes[this.intersectField] = this.valueOut;
                        graphic.symbol = this.valueOutSym;
                    }
                    this.currentNumber = this.currentNumber + 1;
                    this.requestComplete = this.requestComplete + 1;
                    this.emit("requestComplete", {
                        'layerID': this.layer.id,
                        'currentNumber': this.currentNumber,
                        'totalRecords': this.totalRecords,
                        'name': this.layer.name
                    });
                    if (this.isComplete()) {
                        this.emit("complete", {
                            'layerID': this.layer.id
                        });
                    }
                }),
                lang.hitch(this,
                function (err) {
                    this.hasError = true;
                    console.log('error: ' + err);
                    return err;
                }));
            this.deferreds.push(def);
        },
        isComplete: function () {
            if (this.numberOfRequest === this.requestComplete) {
                this.complete = true;
            } else {
                this.complete = false;
            }
            return this.complete;
        }
    });
});