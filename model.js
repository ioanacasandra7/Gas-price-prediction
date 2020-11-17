east_url = `http://api.eia.gov/series/?api_key=${API_KEY}&series_id=PET.EMM_EPM0_PTE_R10_DPG.W`
mid_url=`http://api.eia.gov/series/?api_key=${API_KEY}&series_id=PET.EMM_EPM0_PTE_R20_DPG.W`
gulf_url=`http://api.eia.gov/series/?api_key=${API_KEY}&series_id=PET.EMM_EPM0_PTE_R30_DPG.W`
rock_url=`http://api.eia.gov/series/?api_key=${API_KEY}&series_id=PET.EMM_EPM0_PTE_R40_DPG.W`
west_url=`http://api.eia.gov/series/?api_key=${API_KEY}&series_id=PET.EMM_EPM0_PTE_R50_DPG.W`

d3.json(east_url).then( function(d){
    // read in data from the API
    let gasPrices = d.series[0].data

    // Difference data from the API
    let arr =[]
    for(let i =1; i<131; i++){
        arr.push(gasPrices[gasPrices.length -i][1] - gasPrices[gasPrices.length -i-1][1])
    }
    arr = arr.reverse()

    console.log(arr)
    
    // Load model
    tf.loadLayersModel("models/model.json").then(model => {
        // convert data into a tensor
        data = tf.tensor(arr, [1,10,13])

        // run the model
        var prediction = model.predict(data).as1D();

        // print prediction to console
        prediction.array().then(a => console.log(parseFloat(a)));
    });
});
    