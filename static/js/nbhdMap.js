var nbmap = L.map("nbhdMap", {
  center: [41.878113, -87.629799],
  zoom: 12,
});
      
function createMarkers(response) {
  // Remove any layers from map
  nbmap.eachLayer(function (layer) {
       nbmap.removeLayer(layer);
    });
  
    //Add Tile Layer
  L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
          attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
          maxZoom: 18,
          id: "light-v10",
          accessToken: API_KEY
  }).addTo(nbmap);
  
  // Pull the "adresses" property off of response
    var properties = response.filter(d=>d.Sale_Year==2019);
    var pins = Math.min(properties.length,200)
    
    // get average lat/lon 
    let newLat = math.mean(properties.map(d=>d.Latitude));
    let newLon = math.mean(properties.map(d=>d.Longitude));

    // Initialize an array to hold property markers
    var propertyMarkers = [];
     
    // Loop through the property array
    for (var index = 0; index < pins; index++) {
       var property = properties[index];
        // For each property, create a marker and bind a popup with the property's address
        var propertyMarker = L.marker([property.Latitude, property.Longitude])
            .bindPopup("<p>Address: " + property.Address + "</p>" + "<p>Sale Date: " + property.Sale_Date + "</p><p>Sale Year: " + property.Sale_Year + "</p><p>Sale Price: $" + property.Sale_Price + "</p>");
          // Add the marker to the propertymarker array
          propertyMarkers.push(propertyMarker);
        }
      
        // Create a layer group made from the property markers array, pass it into the createMap function
        let makers = L.layerGroup(propertyMarkers);
        makers.addTo(nbmap);

        //fly to new center
        nbmap.flyTo([newLat, newLon], 14);
};

      