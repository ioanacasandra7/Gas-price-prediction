const eastCoastURL = `http://api.eia.gov/series/?api_key=84914f4bb99838aa4a20314d97b18449&series_id=PET.EMM_EPM0_PTE_R10_DPG.W`
const midwestURL = `http://api.eia.gov/series/?api_key=84914f4bb99838aa4a20314d97b18449&series_id=PET.EMM_EPM0_PTE_R20_DPG.W`
const gulfCoastURL = `http://api.eia.gov/series/?api_key=84914f4bb99838aa4a20314d97b18449&series_id=PET.EMM_EPM0_PTE_R30_DPG.W`
const rockyMountainURL = `http://api.eia.gov/series/?api_key=84914f4bb99838aa4a20314d97b18449&series_id=PET.EMM_EPM0_PTE_R40_DPG.W`
const westCoastURL = `http://api.eia.gov/series/?api_key=84914f4bb99838aa4a20314d97b18449&series_id=PET.EMM_EPM0_PTE_R50_DPG.W`
const WTIURL = `http://api.eia.gov/series/?api_key=84914f4bb99838aa4a20314d97b18449&series_id=PET.RWTC.W`
const petroleum_exportURL = `http://api.eia.gov/series/?api_key=84914f4bb99838aa4a20314d97b18449&series_id=PET.WTTEXUS2.W`
const petroleum_importURL = `http://api.eia.gov/series/?api_key=84914f4bb99838aa4a20314d97b18449&series_id=PET.WTTIMUS2.W`

function simpleAve(arr){

    let arrSimpleave = []
    let arrStdev=math.std(arr)
    let arrMean=math.mean(arr)

    for (let i = 1; i < arr.length; i++){

        // normalizing the data using simple averages. Subtracting the array mean then dividing the result by the standard deviation
        arrSimpleave.push((arr[i] - arrMean)/arrStdev)
    }

    console.log(arrSimpleave)
    return arrSimpleave

}



function difference(arr) {
    
    // Difference data from the API
    let arrDifferenced = []
    for (let i = 1; i < arr.length; i++){

        arrDifferenced.push(arr[i] - arr[i - 1])
    }

    return arrDifferenced
}

function processData(d,modelChoice) {
    //difference gas prices
    let gasPricesProcessed = []

    //make tensor
    let week = []

    if (modelChoice=='LSTM_model'){
        for(let i = 0; i<8; i++){
            gasPricesProcessed.push(simpleAve(d[i]).slice(0,8).reverse());
        }

        // Process WTI spot price
        let WTIProcessed = simpleAve(d[5].slice(0,8).reverse());
    
        // console.log(`There are ${WTIProcessed.length} WTI processed elements`)
        // console.log(WTIProcessed)
    
        // Process Import/Export data
        let petroleum_exportProcessed = simpleAve(d[6].slice(0,8).reverse());
        let petroleum_importProcessed = simpleAve(d[7].map(a => a /100000).slice(0,8).reverse());
    
        // console.log(`There are ${petroleum_exportProcessed.length} Petroleum export processed elements`)
        // console.log(`There are ${petroleum_importProcessed .length} Petroleum import processed elements`)
    
        for(let i=0; i<8; i++){
            week.push([gasPricesProcessed[0][i], 
            gasPricesProcessed[1][i], 
            gasPricesProcessed[2][i], 
            gasPricesProcessed[3][i],
            gasPricesProcessed[4][i], 
            WTIProcessed[i], 
            petroleum_exportProcessed[i],
            petroleum_importProcessed[i]])
        }
    }
            else{

            for (let i = 0; i < 5; i++) {
                gasPricesProcessed.push(difference(d[i]).slice(0, 4).reverse());
            }
        
            // Process WTI spot price
            let WTIProcessed = difference(d[5].map(a => a / 100)).slice(0, 4).reverse();
        
            // Process Import/Export data
            let petroleum_exportProcessed = d[6].map(a => a / 100000).slice(0, 4).reverse();
            let petroleum_importProcessed = d[7].map(a => a / 100000).slice(0, 4).reverse();
        

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
        }
        
    return week
}

async function makePrediction(d, timesteps, modelChoice) {

    // Load model
    const model = await tf.loadLayersModel(`static/js/models/${modelChoice}/model.json`)
    let week = processData(d,modelChoice);
    let forPrediction

    //use model to compute predicted quantities for timestep periods
    for (let i = 0; i < timesteps; i++) {
        //convert week to tensor

        if (modelChoice == 'LSTM_model'){
            forPrediction = tf.tensor([[week[week.length - 8], week[week.length - 7], week[week.length - 7], week[week.length - 5]
                ,week[week.length - 4], week[week.length - 3], week[week.length - 2], week[week.length - 1]]], [1, 8,8])

        } else {
        
            forPrediction = tf.tensor([[week[week.length - 4], week[week.length - 3], week[week.length - 2], week[week.length - 1]]], [1, 4, 8])
        }
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
            regionName = "Rocky Mountain"
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

function makeGasPriceChart(data, timeStamps, region) {
        pastData = []

        for (let i = 0; i < 96; i++) {
            pastData.push({
                time: timeStamps[i],
                eastCoast: parseFloat(data[0][i]),
                midwest: parseFloat(data[1][i]),
                gulfCoast: parseFloat(data[2][i]),
                rockyMountain: parseFloat(data[3][i]),
                westCoast: parseFloat(data[4][i]),
                WTI : parseFloat(data[5][i]),
                import : parseFloat(data[6][i]),
                export : parseFloat(data[7][i])
            })}


        chartWidth = parseInt(d3.select("#chart1").style("width"));
        chartHeight = parseInt(d3.select("#chart1").style("height"));

        // set the dimensions and margins of the graph
        let margin = { top: 10, right: 30, bottom: 30, left: 60 },
            width = chartWidth - margin.left - margin.right,
            height = chartHeight - margin.top - margin.bottom;

        // append the svg object to the body of the page
        let svgGasPrice = d3.select("#chart1")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");


        xMin = Math.min(d3.min(pastData, function (d) { return d.time; }), d3.min(pastData, function (d) { return d.time; }))
        xMax = Math.max(d3.max(pastData, function (d) { return d.time; }), d3.max(pastData, function (d) { return d.time; }))

        // Add X axis --> it is a date format
        var xScale = d3.scaleTime()
            .domain([xMin, xMax])
            .range([0, width]);

        svgGasPrice.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale));

        yMin = Math.min(d3.min(pastData, function (d) { return d[region]; }), d3.min(pastData, function (d) { return d[region]; })) - 0.25
        yMax = Math.max(d3.max(pastData, function (d) { return d[region]; }), d3.max(pastData, function (d) { return d[region]; })) + 0.25

        // Add Y axis
        var yScale = d3.scaleLinear()
            .domain([yMin, yMax])
            .range([height, 0]);

        svgGasPrice.append("g")
            .call(d3.axisLeft(yScale));

        //create line
        let makeLineGasPrice = d3.line()
            .x(d => xScale(d.time))
            .y(d => yScale(d[region]));

        // Add the past line
        svgGasPrice.append("path")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", makeLineGasPrice(pastData))

        //add y label
        svgGasPrice.append("text")
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
            regionName = "Rocky Mountain"
        }
        

        //add Chart Title
        svgGasPrice.append("text")
            .attr("x", (width / 2))
            .attr("y", 0 - (margin.top / 2 - 20))
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("text-decoration", "underline")
            .text(regionName);
    
};

function makeWTIChart(data, timeStamps) {
    pastData = []

    for (let i = 0; i < 96; i++) {
        pastData.push({
            time: timeStamps[i],
            eastCoast: parseFloat(data[0][i]),
            midwest: parseFloat(data[1][i]),
            gulfCoast: parseFloat(data[2][i]),
            rockyMountain: parseFloat(data[3][i]),
            westCoast: parseFloat(data[4][i]),
            WTI : parseFloat(data[5][i]),
            import : parseFloat(data[6][i]),
            export : parseFloat(data[7][i])
        })}


    chartWidth = parseInt(d3.select("#chart2").style("width"));
    chartHeight = parseInt(d3.select("#chart2").style("height"));

    // set the dimensions and margins of the graph
    let margin = { top: 10, right: 30, bottom: 30, left: 60 },
        width = chartWidth - margin.left - margin.right,
        height = chartHeight - margin.top - margin.bottom;

    // append the svg object to the body of the page
    let svgWTI = d3.select("#chart2")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");


    xMin = Math.min(d3.min(pastData, function (d) { return d.time; }), d3.min(pastData, function (d) { return d.time; }))
    xMax = Math.max(d3.max(pastData, function (d) { return d.time; }), d3.max(pastData, function (d) { return d.time; }))

    // Add X axis --> it is a date format
    var xScale = d3.scaleTime()
        .domain([xMin, xMax])
        .range([0, width]);

    svgWTI.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));

    yMin = Math.min(d3.min(pastData, function (d) { return d.WTI; }), d3.min(pastData, function (d) { return d.WTI; })) - 10
    yMax = Math.max(d3.max(pastData, function (d) { return d.WTI; }), d3.max(pastData, function (d) { return d.WTI; })) + 20

    // Add Y axis
    var yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([height, 0]);

    svgWTI.append("g")
        .call(d3.axisLeft(yScale));

    //create line
    let makeLineWTI = d3.line()
        .x(d => xScale(d.time))
        .y(d => yScale(d.WTI));

    // Add the past line
    svgWTI.append("path")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", makeLineWTI(pastData))

    //add y label
    svgWTI.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Spot Price of WTI");
    
    //add Chart Title
    svgWTI.append("text")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2 - 20))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text("WTI Crude");

};

function makeImportExportChart(data, timeStamps) {
    pastData = []

    for (let i = 0; i < 96; i++) {
        pastData.push({
            time: timeStamps[i],
            eastCoast: parseFloat(data[0][i]),
            midwest: parseFloat(data[1][i]),
            gulfCoast: parseFloat(data[2][i]),
            rockyMountain: parseFloat(data[3][i]),
            westCoast: parseFloat(data[4][i]),
            WTI : parseFloat(data[5][i]),
            import : parseFloat(data[6][i]),
            export : parseFloat(data[7][i])
        })}


    chartWidth = parseInt(d3.select("#chart3").style("width"));
    chartHeight = parseInt(d3.select("#chart3").style("height"));

    // set the dimensions and margins of the graph
    let margin = { top: 10, right: 30, bottom: 30, left: 60 },
        width = chartWidth - margin.left - margin.right,
        height = chartHeight - margin.top - margin.bottom;

    // append the svg object to the body of the page
    let svgImportExport = d3.select("#chart3")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");


    xMin = Math.min(d3.min(pastData, function (d) { return d.time; }), d3.min(pastData, function (d) { return d.time; }))
    xMax = Math.max(d3.max(pastData, function (d) { return d.time; }), d3.max(pastData, function (d) { return d.time; }))

    // Add X axis --> it is a date format
    var xScale = d3.scaleTime()
        .domain([xMin, xMax])
        .range([0, width]);

    svgImportExport.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));

    yMin = Math.min(d3.min(pastData, function (d) { return d.import; }), d3.min(pastData, function (d) { return d.export; })) - 2000
    yMax = Math.max(d3.max(pastData, function (d) { return d.import; }), d3.max(pastData, function (d) { return d.export; })) + 2000

    // Add Y axis
    var yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([height, 0]);

    svgImportExport.append("g")
        .call(d3.axisLeft(yScale));

    //create line
    let makeLineImport = d3.line()
        .x(d => xScale(d.time))
        .y(d => yScale(d.import));

    let makeLineExport = d3.line()
        .x(d => xScale(d.time))
        .y(d => yScale(d.export));

    // Add the past line
    svgImportExport.append("path")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", makeLineImport(pastData))

    svgImportExport.append("path")
        .attr("fill", "none")
        .attr("stroke", "green")
        .attr("stroke-width", 1.5)
        .attr("d", makeLineExport(pastData))

    //add y label
    svgImportExport.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Thousands of Barrels");
    
    //add Chart Title
    svgImportExport.append("text")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2 - 20))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text("Import/Export");

    //add legend
    svgImportExport.append("circle").attr("cx",210).attr("cy",230).attr("r", 3).style("fill", "steelblue")
    svgImportExport.append("circle").attr("cx",210).attr("cy",250).attr("r", 3).style("fill", "green")
    svgImportExport.append("text").attr("x", 220).attr("y", 230).text("Imports").style("font-size", "10px").attr("alignment-baseline","middle")
    svgImportExport.append("text").attr("x", 220).attr("y", 250).text("Exports").style("font-size", "10px").attr("alignment-baseline","middle")

};

 function makePage(region, timesteps, modelChoice){
     //add model descriptions
    let modelDescription = d3.select("#model-description")
    if(modelChoice == "all_channel_linear_js"){
        modelDescription.html("<pre><code> model = keras.models.Sequential([keras.Input(shape=(X_train.shape[1],X_train.shape[2])),keras.layers.Flatten(),keras.layers.Dense(units=8)]) </code></pre>")
    }else if (modelChoice == "all_channel_LSTM_js"){
        modelDescription.html("<pre><code>model = keras.models.Sequential([keras.layers.LSTM(units = 8, input_shape=(X_train.shape[1],X_train.shape[2]), return_sequences=False),keras.layers.Dense(units=8)])</code></pre>")
    }else if(modelChoice == "LSTM_model"){
        modelDescription.html("<pre><code>model = tf.keras.models.Sequential([tf.keras.layers.LSTM(32, return_sequences=True),tf.keras.layers.Dense(units=1)])</code></pre>")
    }

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

        makeModelChart(data, timeStamps, region, timesteps, modelChoice);
        makeGasPriceChart(data, timeStamps, region);
        makeWTIChart(data, timeStamps);
        makeImportExportChart(data, timeStamps);

    });}

// select dropdown menu and make an event handler
let dropDownModel = d3.select("#model-selector");
dropDownModel.on("change", onSelect);

let dropDownRegion = d3.select("#region-selector");
dropDownRegion.on("change", onSelect);

// event handler function for drop down menu
function onSelect(){
    d3.select("#model-chart").html("")
    d3.select("#chart1").html("")
    d3.select("#chart2").html("")
    d3.select("#chart3").html("")
    let modelChoice = d3.select("#model-selector").property("value");
    let region = d3.select("#region-selector").property("value");
    
    makePage(region, 12, modelChoice);
}

makePage("eastCoast", 12, "all_channel_linear_js")

