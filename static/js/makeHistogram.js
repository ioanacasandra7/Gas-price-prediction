function makeHistogram(data){
    Prices = data.map(d => d.Sale_Price )
    var trace = {
        x: Prices,
        type: 'histogram',
      };
    var data = [trace];

    var layout = {
      title: 'Price Histogram',
      xaxis:{
        title: 'Price'
      },
      yaxis: {
        title: 'Count'
      },
      // width: 500,
      // height: 300,
    }
    Plotly.newPlot('histogram', data, layout);
}

