const eastCoastURL = `http://api.eia.gov/series/?api_key=${API_KEY}&series_id=PET.EMM_EPM0_PTE_R10_DPG.W`
const midwestURL = `http://api.eia.gov/series/?api_key=${API_KEY}&series_id=PET.EMM_EPM0_PTE_R20_DPG.W`
const gulfCoastURL = `http://api.eia.gov/series/?api_key=${API_KEY}&series_id=PET.EMM_EPM0_PTE_R30_DPG.W`
const rockyMountainURL = `http://api.eia.gov/series/?api_key=${API_KEY}&series_id=PET.EMM_EPM0_PTE_R40_DPG.W`
const westCoastURL = `http://api.eia.gov/series/?api_key=${API_KEY}&series_id=PET.EMM_EPM0_PTE_R50_DPG.W`
const WTIURL = `http://api.eia.gov/series/?api_key=${API_KEY}&series_id=PET.RWTC.W`
const petroleum_exportURL = `http://api.eia.gov/series/?api_key=${API_KEY}&series_id=PET.WTTEXUS2.W`
const petroleum_importURL = `http://api.eia.gov/series/?api_key=${API_KEY}&series_id=PET.WTTIMUS2.W`

function difference(arr){
    // Difference data from the API
    let arrDifferenced =[]
    for(let i =1; i<arr.length  ; i++){
        arrDifferenced.push(arr[i] - arr[i-1])
    }

    return arrDifferenced
}

function processData(d){
    //difference gas prices
    let gasPricesProcessed =[]
    for(let i = 0; i<5; i++){
        gasPricesProcessed.push(difference(d[i]).slice(0,4).reverse());
    }

    // Process WTI spot price
    let WTIProcessed = difference(d[5].map(a => a / 100)).slice(0,4).reverse();

    // Process Import/Export data
    let petroleum_exportProcessed = d[6].map(a => a /100000).slice(0,4).reverse();
    let petroleum_importProcessed = d[7].map(a => a /100000).slice(0,4).reverse();

    //make tensor
    let week=[]
    for(let i=0; i<4; i++){
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

async function makePrediction(d, timesteps){

        // Load model
        const model = await tf.loadLayersModel("all_channel_LSTM_js/model.json")
        let week = processData(d);

        //use model to compute predicted quantities for timestep periods
        for(let i=0; i<timesteps; i++){
            //convert week to tensor
            let forPrediction = tf.tensor([[week[week.length - 4], week[week.length - 3], week[week.length - 2], week[week.length - 1]]], [1, 4,8])

            // run the model
            prediction = model.predict(forPrediction).arraySync()[0];
            
            week.push(prediction)
        }
        
        for(let i=0; i<5; i++){
            for(let j=1;j<=timesteps;j++){
                d[i].unshift(d[i][0] + week[j][i])
            }
        }

        predictedGasPrices = [d[0],d[1],d[2],d[3],d[4]]

        return predictedGasPrices

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
]).then( function(d){

    let data = [];
    let timeStamps =[];
    let timesteps = 3;
    
    for(let i =0; i<8; i++){
        data.push(d[i].series[0].data.map(a => parseFloat(a[1])));
    }

    // convert dates to javescript date objects
    let parser =  d3.timeParse("%Y%m%d");
    timeStamps= d[0].series[0].data.map(a => parser(a[0]));

    //add additional timeStamps for the predicted values
    for(let i =0 ; i<timesteps; i++){
        timeStamps.unshift(d3.timeWeek.offset(timeStamps[0], 1))
    }
    
    //make predicitons
    makePrediction(data, timesteps).then(function(prediction){

        console.log(typeof prediction[0][0])

        predictedData = {
            time: timeStamps,
            eastCoast: prediction[0],
            midwest: prediction[1],
            gulfCoast: prediction[2],
            rockyMountain: prediction[3],
            westCoast: prediction[4]
        }

        // set the dimensions and margins of the graph
        let margin = {top: 10, right: 30, bottom: 30, left: 60},
            width = 460 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        let svg = d3.select("#my_dataviz")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");
            

        // Add X axis --> it is a date format
        var xScale = d3.scaleTime()
            .domain(d3.extent(predictedData.time))
            .range([ 0, width ]);

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale));

        // Add Y axis
        var yScale = d3.scaleLinear()
            .domain([0, d3.max(predictedData.eastCoast)])
            .range([ height, 0 ]);

        svg.append("g")
            .call(d3.axisLeft(yScale));

        //create line
        let makeLine = d3.line()
                        .x(d=> yScale(d.time))
                        .y(d => yScale(d.eastCoast));

        // Add the line
        svg.append("path")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", makeLine(predictedData))
    });
});
    