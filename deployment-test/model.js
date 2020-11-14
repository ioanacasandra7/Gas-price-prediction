const url = `http://api.eia.gov/series/?api_key=${API_KEY}&series_id=PET.EMM_EPMRR_PTE_YORD_DPG.W`
d3.json(url).then( function(d){
    // read in data from the API
    let gasPrices = d.series[0].data

    // Difference data from the API
    let arr =[]
    for(let i =1; i<11; i++){
        arr.push(gasPrices[gasPrices.length -i][1] - gasPrices[gasPrices.length -i-1][1])
    }
    arr = arr.reverse()
    
    // Load model
    tf.loadLayersModel("jsmodel/model.json").then(model => {
        // convert data into a tensor
        data = tf.tensor(arr, [1,10,1])

        // run the model
        var prediction = model.predict(data).as1D();

        // print prediction to console
        prediction.array().then(a => console.log(parseFloat(a)));
    });
});
    