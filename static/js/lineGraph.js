// Taken from Rui's Branch
let years =[2013, 2014, 2015, 2016, 2017 , 2018 , 2019]
function buildLineGraph(data){ 
    avePrice =[]
    for(y of years){
        avePrice.push(math.mean(data.filter(d => d.Sale_Year == y ).map(d => d.Sale_Price)));
    };
    var trace1 = {
        x: years,
        y: avePrice,
        name: "Average Sale Price",
        mode: "lines",
        line: {
        color: 'rgb(219, 64, 82)',
        width: 3
        }
    };
      
    // data
    var chartData = [trace1];
      
    // Apply the group line mode to the layout
    var layout = {
        title: "Average Sale Price by Year ",
        margin: {
            l: 100,
            r: 100,
            t: 100,
            b: 100
        },
        xaxis: {
            title: 'Year'
        },
        yaxis: {
            title: 'Average Sale Price'
        }
    };
      
        // Render the plot to the div tag with id "plot"
        Plotly.newPlot("lineGraph", chartData, layout);

    }