define(['dojo/_base/declare', 'dojo/_base/array', 'jimu/BaseWidget'],
function(declare, array, BaseWidget) {
  return declare([BaseWidget], {

    baseClass: 'jimu-widget-widgetb',

    startup: function(){
      this.inherited(arguments);
      this.fetchDataByName('WidgetA');
    },

    onReceiveData: function(name, widgetId, data, historyData) {
      //filter out messages
      if(name !== 'WidgetA'){
        return;
      }

      var msg = '<div style="margin:10px;">' +
        '<b>Receive data from</b>:' + name +
        '<br><b>widgetId:</b>' + widgetId +
        '<br><b>data:</b>' + data.message;

      //handle history data
      if(historyData === true){
        //want to fetch history data.
        msg += '<br><b>historyData:</b>' + historyData + '. Fetch again.</div>';
        this.messageNode.innerHTML = this.messageNode.innerHTML + msg;
        this.fetchDataByName('WidgetA');
      }else{
        msg += '<br><b>historyData:</b><br>' +
          array.map(historyData, function(data, i){
            return i + ':' + data.message;
          }).join('<br>') + '</div>';
        this.messageNode.innerHTML = this.messageNode.innerHTML + msg;
      }
    }
  });
});