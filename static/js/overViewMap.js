// Tkaen from Kena's Branch
// Creating map object
var myMap = L.map("overViewMap", {
  center: [41.85, -87.6298],
  zoom: 10
});

  // Adding tile layer
L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
    tileSize: 512,
    maxZoom: 18,
    zoomOffset: -1,
    id: "mapbox/streets-v11",
    accessToken: API_KEY
}).addTo(myMap);

// Grabbing our GeoJSON data..
d3.json("/static/geo_data/Overview_price_age.json").then(function(data) {
  // Creating a GeoJSON layer with the retrieved data
//   L.geoJson(data).addTo(myMap);
    console.log(data);

  var choroplethLayer = L.choropleth(data, {
    valueProperty: 'ave_price',
    scale: ['orange', 'red'],
    steps: 5,
    mode: 'q',
    style: {
      color: '#fff',
      weight: 2,
      fillOpacity: 0.8
    },
    onEachFeature: function (feature, layer) {
      layer.bindPopup('Name ' + feature.properties.SEC_NEIGH + '<br> Average Price: $' + Math.round(feature.properties.ave_price))
    }
  }).addTo(myMap)

  // Add legend (don't forget to add the CSS from index.html)
//   var legend = L.control({ position: 'bottomright' })
//   legend.onAdd = function (map) {
//     var div = L.DomUtil.create('div', 'legend')
//     var limits = choroplethLayer.options.limits
//     var colors = choroplethLayer.options.colors
//     var labels = []

//     // Add min & max
//     div.innerHTML = '<div class="labels"><div class="min">' + limits[0] + '</div> \
// 			<div class="max">' + limits[limits.length - 1] + '</div></div>'

//     limits.forEach(function (index) {
//       labels.push('<i class ="box" style="background: ' + colors[index] + '"></i>')
//     })

//     div.innerHTML += '<ul>' + labels.join('') + '</ul>'
//     return div
//   }
//   legend.addTo(myMap);
});