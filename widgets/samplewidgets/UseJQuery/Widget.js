define(['dojo/_base/declare', 'jimu/BaseWidget',
  'jimu/loaderplugins/jquery-loader!https://code.jquery.com/jquery-git1.min.js'],
function(declare, BaseWidget, $){
  return declare(BaseWidget, {
    startup: function(){
      var map = this.map;
      $('.jimu-widget-use-jquery .map-id').click(function(){
        alert(map.id);
      });
      $('.jimu-widget-use-jquery .my-title').text('title added by jquery.');
    }
  });
});


