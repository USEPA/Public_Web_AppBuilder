<?php
/*****************************************************************************
 * START - Change values
 *****************************************************************************/
// the keys (provided by Pictometry)
$apikey = 'xxx123';
$secretkey = 'xxxxxx';

// the IPA Load URL (provided by Pictometry)
$ipaLoadUrl = 'http://pol.pictometry.com/ipa/v1/load.php';

// the IPA Javascript Library URL (provided by Pictometry)
$ipaJsLibUrl = 'http://pol.pictometry.com/ipa/v1/embed/host.php?apikey=xxx123';

// iframe id (needed to ensure communication with correct iframe)
// must be a unique element id in your application
$iframeId = 'pictometry_ipa';

/*****************************************************************************
 * END - Change values
 *****************************************************************************/

// create the URL to be signed
$unsignedUrl = $ipaLoadUrl."?apikey=$apikey&ts=".time();

// create the digital signature using the unsigned Load URL and the secret key
$digitalSignature = hash_hmac('md5', $unsignedUrl, $secretkey);

// create the signed Load URL using the generated digital signature
$signedUrl = $unsignedUrl."&ds=".$digitalSignature."&app_id=".$iframeId;
?>
<!DOCTYPE HTML>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>SAGIS Pictometry Viewer</title>

    <!-- include the IPA JS Library from pictometry -->
    <script type="text/javascript" src="<?php echo $ipaJsLibUrl; ?>"></script>

    <style>
        #content {
            margin-left: auto; 
            margin-right: auto; 
            border-style: solid; 
            width: 95%; 
            height: 4.5em; 
            text-align: center;
        }

        #pictometry {
            margin-left: auto; 
            margin-right: auto; 
            padding: 5px; 
            width: 95%; 
            height: 650px; 
            border-style: hidden;
        }
    </style>        
</head>
<body>
    <div id="content">
        <h3 style="display: inline">SAGIS Pictometry Viewer</h3>
        <br>
        
        Go to Coordinates: 
        <input type="text" id="locationText" onKeyPress="if (event.keyCode == 13) setLocation();"></input>
        <button type="button" onclick="setLocation();">Go</button>
        Address Search: 
        <input type="text" id="addressText" onKeyPress="if (event.keyCode == 13) gotoAddress();"></input>
        <button type="button" onclick="gotoAddress();">Go</button> 
		
    </div>
    <div id="pictometry">
        <iframe id="<?php echo $iframeId; ?>" width="100%" height="100%" src="#"></iframe>
    </div>
	<div id="resutls">
		
	</div>

    <script type="text/javascript">
        var ipa = new PictometryHost('<?php echo $iframeId; ?>','<?php echo $ipaLoadUrl; ?>');
		// declare variables to store values from URL
		var addressURL, lat, longi, orientation, angle, layerNumber;
		
		// Set your start location coordinates
		var defaultLat = '<SET THIS TO YOUR DEFAULT Latitude>';
		var defaultLongi = '<SET THIS TO YOUR DEFAULT Longitude>';
        
		ipa.ready = function() {
			//Takes everything after the question mark and puts it into a string called SearchString
			// This is an example URL for the using the following code:
			// http://pase10/php/ipatest4.php?address=115%20E%20Woodford%20Ave,%20Pittsburgh,%20PA%2015210&lat=40.393424&lon=-79.984461&ori=e
			
			var SearchString = window.location.search.substring(1);
			// Seperates SearchString into an array of values. Each value is divided by the & which does not get stored in the urlParams array.
			var urlParams = SearchString.split("&"); 

			//This is a loop that starts at 0 and ends at whatever length of the array is. 
			//For example, if there are 5 items in the array it will start counting at 0 and go to 4.
			//Every time it counts up 1 number, it checks the value of the array at the current position and sets its value to one of the variable declared above.
			for(var i=0; i < urlParams.length; i++)
			{
				
				                if(urlParams[i].toString().match("address"))
                                                                {
                                                                                addressURL = decodeURIComponent(urlParams[i].substr(8));
                                                                }
                                                                if(urlParams[i].toString().match("lat"))
                                                                {
                                                                                lat = urlParams[i].substr(4);
                                                                }
                                                                if(urlParams[i].toString().match("lon"))
                                                                {
                                                                                longi = urlParams[i].substr(4);
                                                                }
                                                                if(urlParams[i].toString().match("ori"))
                                                                {
                                                                                orientation = urlParams[i].substr(4);
                                                                }
                                                                if(urlParams[i].toString().match("angle"))
                                                                {
                                                                                angle = urlParams[i].substr(6);
                                                                }
                                                                if(! urlParams[0].substr(4))
                                                                {
                                                                                alert("Setting Default start location.");
                                                                                lat = defaultLat;
                                                                                longi = defaultLongi;
                                                                }


			}
			//checks whether the value of variable addressURL is set. If it is defined ipa.gotoAddress is called while passing the addressURL variable.
			if(addressURL != undefined)
			{
				ipa.gotoAddress(addressURL);
			}
			else
			{
				ipa.setLocation(lat,longi);
			}
			
			//Sets the orientation to the value passed via URL. It does so by checking what the value is of the orientation variable and performing the appropriate function.
			ipa.addListener('onchangeview', function (view)
			{
				if(orientation == 'E' || orientation == 'e' || orientation == 'east' || orientation == 'EAST' || orientation == 'East')
					{	
						ipa.setMapOrientation({
						angle: ipa.MAP_ANGLE.OBLIQUE,
						orientation: ipa.MAP_ORIENTATION.EAST
					});				
				}
				if(orientation == 'N' || orientation == 'n' || orientation == 'north' || orientation == 'NORTH' || orientation == 'North')
				{
					ipa.setMapOrientation({
						angle: ipa.MAP_ANGLE.OBLIQUE,
						orientation: ipa.MAP_ORIENTATION.NORTH
					});		
				}
				if(orientation == 'W' || orientation == 'w'  || orientation == 'west' || orientation == 'WEST'  || orientation == 'West')
				{
					ipa.setMapOrientation({
						angle: ipa.MAP_ANGLE.OBLIQUE,
						orientation: ipa.MAP_ORIENTATION.WEST
					});		
				}
				if(orientation == 'S' || orientation == 's'|| orientation == 'south'|| orientation == 'SOUTH'|| orientation == 'South')
				{
					ipa.setMapOrientation({
						angle: ipa.MAP_ANGLE.OBLIQUE,
						orientation: ipa.MAP_ORIENTATION.SOUTH
					});		
				}
			});

			ipa.getLayers( function(layers) {
     	
				myLayers = layers; });

			ipa.getSearchServices( function(searchableLayers) {

				mySearchLayers = searchableLayers;

				});
		};

        function gotoEastmanHouse() {

            // Set the view location
            ipa.setLocation({      
                y:43.152139,       // Latitude
                x:-77.580298,      // Longitude
                zoom:20            // Optional Zoom level
            });

            return false;
        };

        function setLocation() {
            var location = document.getElementById('locationText');
            var loc = location.value.split(',');
            var lat = loc[0].replace(/^\s+|\s+$/g, "");
            var lon = loc[1].replace(/^\s+|\s+$/g, "");

            // Alternate syntax to pass parameters          
            ipa.setLocation(lat, lon, 17);

            return false;
        };

        function gotoAddress() {
            var address = document.getElementById('addressText');
            ipa.gotoAddress(address.value);

            return false;
        };

        function getLocation() {
            ipa.getLocation();
        };

		function parcelSearch() 
		{
			var searchString = document.getElementById('parcelString');
		
			var query = 
			{
				searchString: searchString.value,   // A known street in your street layer
    			id: 59333,              // Your street layer id.  (Must have been retrieved with getSearchServices
    			fields: ["st_name"]    // In this example we search only the 'street_name' field from the layer
			}
		ipa.searchByString(query);
		// setMarker();
		};
	
		
	
	
	// set the iframe src to load the IPA
        var iframe = document.getElementById('<?php echo $iframeId; ?>');
        iframe.setAttribute('src', '<?php echo $signedUrl; ?>');
		
    </script>   
	
</body>
</html>