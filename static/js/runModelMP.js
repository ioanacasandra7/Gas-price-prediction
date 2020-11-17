const eastCoastURL = `http://api.eia.gov/series/?api_key=84914f4bb99838aa4a20314d97b18449&series_id=PET.EMM_EPM0_PTE_R10_DPG.W`
const midwestURL = `http://api.eia.gov/series/?api_key=84914f4bb99838aa4a20314d97b18449&series_id=PET.EMM_EPM0_PTE_R20_DPG.W`
const gulfCoastURL = `http://api.eia.gov/series/?api_key=84914f4bb99838aa4a20314d97b18449&series_id=PET.EMM_EPM0_PTE_R30_DPG.W`
const rockyMountainURL = `http://api.eia.gov/series/?api_key=84914f4bb99838aa4a20314d97b18449&series_id=PET.EMM_EPM0_PTE_R40_DPG.W`
const westCoastURL = `http://api.eia.gov/series/?api_key=84914f4bb99838aa4a20314d97b18449&series_id=PET.EMM_EPM0_PTE_R50_DPG.W`
const WTIURL = `http://api.eia.gov/series/?api_key=84914f4bb99838aa4a20314d97b18449&series_id=PET.RWTC.W`
const petroleum_exportURL = `http://api.eia.gov/series/?api_key=84914f4bb99838aa4a20314d97b18449&series_id=PET.WTTEXUS2.W`
const petroleum_importURL = `http://api.eia.gov/series/?api_key=84914f4bb99838aa4a20314d97b18449&series_id=PET.WTTIMUS2.W`

function difference(arr) {
    // Difference data from the API
    let arrDifferenced = []
    for (let i = 1; i < arr.length; i++) {
        arrDifferenced.push(arr[i] - arr[i - 1])
    }

    return arrDifferenced
}

function processData(d) {
    //difference gas prices
    let gasPricesProcessed = []
    for (let i = 0; i < 5; i++) {
        gasPricesProcessed.push(difference(d[i]).slice(0, 4).reverse());
    }

    // Process WTI spot price
    let WTIProcessed = difference(d[5].map(a => a / 100)).slice(0, 4).reverse();

    // Process Import/Export data
    let petroleum_exportProcessed = d[6].map(a => a / 100000).slice(0, 4).reverse();
    let petroleum_importProcessed = d[7].map(a => a / 100000).slice(0, 4).reverse();

    //make tensor
    let week = []
    for (let i = 0; i < 4; i++) {
        week.push([gasPricesProcessed[0][i],
        gasPricesProcessed[1][i],
        gasPricesProcessed[2][i],
        gasPricesProcessed[3][i],
        gasPricesProcessed[4][i],
        WTIProcessed[i],
        petroleum_exportProcessed[i],
        petroleum_importProcessed[i]])
    }

    return week
}

async function makePrediction(d, timesteps, modelChoice) {

    // Load model
    const model = await tf.loadLayersModel(`models/${modelChoice}/model.json`)
    let week = processData(d);

    //use model to compute predicted quantities for timestep periods
    for (let i = 0; i < timesteps; i++) {
        //convert week to tensor
        let forPrediction = tf.tensor([[week[week.length - 4], week[week.length - 3], week[week.length - 2], week[week.length - 1]]], [1, 4, 8])

        // run the model
        prediction = model.predict(forPrediction).arraySync()[0];

        week.push(prediction)
    }

    for (let i = 0; i < 5; i++) {
        for (let j = 1; j <= timesteps; j++) {
            d[i].unshift(d[i][0] + week[j][i])
        }
    }

    predictedGasPrices = [d[0], d[1], d[2], d[3], d[4]]

    return predictedGasPrices

}

function makeModelChart(data, timeStamps, region, timesteps, modelChoice) {

    //make predicitons
    makePrediction(data, timesteps, modelChoice).then(function (prediction) {

        predictedData = []
        pastData = []

        for (let i = timesteps; i < timesteps + 96; i++) {
            pastData.push({
                time: timeStamps[i],
                eastCoast: parseFloat(prediction[0][i]),
                midwest: parseFloat(prediction[1][i]),
                gulfCoast: parseFloat(prediction[2][i]),
                rockyMountain: parseFloat(prediction[3][i]),
                westCoast: parseFloat(prediction[4][i])
            })
        }

        for (let i = 0; i <= timesteps; i++) {
            predictedData.push({
                time: timeStamps[i],
                eastCoast: parseFloat(prediction[0][i]),
                midwest: parseFloat(prediction[1][i]),
                gulfCoast: parseFloat(prediction[2][i]),
                rockyMountain: parseFloat(prediction[3][i]),
                westCoast: parseFloat(prediction[4][i])
            })
        }

        chartWidth = parseInt(d3.select("#model-chart").style("width"));
        chartHeight = parseInt(d3.select("#model-chart").style("height"));

        // set the dimensions and margins of the graph
        let margin = { top: 10, right: 30, bottom: 30, left: 60 },
            width = chartWidth - margin.left - margin.right,
            height = chartHeight - margin.top - margin.bottom;

        // append the svg object to the body of the page
        let svg = d3.select("#model-chart")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");


        xMin = Math.min(d3.min(pastData, function (d) { return d.time; }), d3.min(predictedData, function (d) { return d.time; }))
        xMax = Math.max(d3.max(pastData, function (d) { return d.time; }), d3.max(predictedData, function (d) { return d.time; }))

        // Add X axis --> it is a date format
        var xScale = d3.scaleTime()
            .domain([xMin, xMax])
            .range([0, width]);

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale));

        yMin = Math.min(d3.min(pastData, function (d) { return d[region]; }), d3.min(predictedData, function (d) { return d[region]; })) - 0.25
        yMax = Math.max(d3.max(pastData, function (d) { return d[region]; }), d3.max(predictedData, function (d) { return d[region]; })) + 0.25

        // Add Y axis
        var yScale = d3.scaleLinear()
            .domain([yMin, yMax])
            .range([height, 0]);

        svg.append("g")
            .call(d3.axisLeft(yScale));

        //create line
        let makeLine = d3.line()
            .x(d => xScale(d.time))
            .y(d => yScale(d[region]));

        // Add the past line
        svg.append("path")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", makeLine(pastData))

        //add the prediction line
        svg.append("path")
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 1.5)
            .attr("d", makeLine(predictedData))

        //add y label
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Retail Price of Gas");

        let regionName = ""

        if(region == "westCoast"){
            regionName = "West Coast"
        } else if(region == "eastCoast"){
            regionName = "East Coast"
        }else if(region == "gulfCoast"){
            regionName = "Gulf Coast"
        }else if(region == "midwest"){
            regionName = "Midwest"
        }else if(region == "rockyMountain"){
            regionName = "Rocky Mountains"
        }
        

        //add Chart Title
        svg.append("text")
            .attr("x", (width / 2))
            .attr("y", 0 - (margin.top / 2 - 20))
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("text-decoration", "underline")
            .text(regionName);
    });
};

 function makePage(region, timesteps, modelChoice){

    Promise.all([
        d3.json(eastCoastURL),
        d3.json(midwestURL),
        d3.json(gulfCoastURL),
        d3.json(rockyMountainURL),
        d3.json(westCoastURL),
        d3.json(WTIURL),
        d3.json(petroleum_exportURL),
        d3.json(petroleum_importURL)
    ]).then(function (d) {

        let data = [];
        let timeStamps = [];

        for (let i = 0; i < 8; i++) {
            data.push(d[i].series[0].data.map(a => parseFloat(a[1])));
        }

        // convert dates to javescript date objects
        let parser = d3.timeParse("%Y%m%d");
        timeStamps = d[0].series[0].data.map(a => parser(a[0]));

        //add additional timeStamps for the predicted values
        for (let i = 0; i < timesteps; i++) {
            timeStamps.unshift(d3.timeWeek.offset(timeStamps[0], 1))
        }

        makeModelChart(data, timeStamps, region, timesteps, modelChoice)

    });}

// select dropdown menu and make an event handler
let dropDownModel = d3.select("#model-selector");
dropDownModel.on("change", onSelect);

let dropDownRegion = d3.select("#region-selector");
dropDownRegion.on("change", onSelect);

// event handler function for drop down menu
function onSelect(){
    d3.select("#model-chart").html("")
    let modelChoice = d3.select("#model-selector").property("value");
    let region = d3.select("#region-selector").property("value");
    makePage(region, 12, modelChoice);
}

makePage("eastCoast", 12, "all_channel_linear_js")

