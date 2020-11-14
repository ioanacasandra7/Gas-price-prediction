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
    let day=[]
    for(let i=0; i<4; i++){
        day.push([gasPricesProcessed[0][i], 
        gasPricesProcessed[1][i], 
        gasPricesProcessed[2][i], 
        gasPricesProcessed[3][i],
        gasPricesProcessed[4][i], 
        WTIProcessed[i], 
        petroleum_exportProcessed[i],
        petroleum_importProcessed[i]])
    }

    return tf.tensor([[day[0], day[1], day[2], day[3]]], [1, 4,8])
}

function makePrediction(d, numberofsteps){

        // Load model
        tf.loadLayersModel("all_channel_LSTM_js/model.json").then(model => {
            forPrediction = processData(d)

            // run the model
            console.log(model.predict(forPrediction).arraySync()[0])
        });
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

    let data = []
    for(let i =0; i<8; i++){
        data.push(d[i].series[0].data.map(a => parseFloat(a[1])))
    }

    makePrediction(data, 3);
    
});
    