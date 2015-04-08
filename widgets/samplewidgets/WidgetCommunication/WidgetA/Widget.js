define(['dojo/_base/declare', 'jimu/BaseWidget'],
function(declare, BaseWidget) {
  return declare([BaseWidget], {

    baseClass: 'jimu-widget-widgeta',

    i: 0,
    j: 0,

    _onPublishClick: function() {
      this.publishData({
        message: 'I am widget A.'
      });
      this.i ++;
      this.pubInfoNode.innerText = 'Publish ' + this.i;
    },

    _onPublishHisClick: function() {
      this.publishData({
        message: 'I am widget A.'
      }, true);
      this.j ++;
      this.pubHisInfoNode.innerText = 'Publish ' + this.j;
    }
  });
});