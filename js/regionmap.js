//East Coast
const url1 = `https://api.eia.gov/series/?api_key=${API_KEY}&series_id=PET.EMM_EPM0_PTE_R10_DPG.W`
//Midwest
const url2 = `http://api.eia.gov/series/?api_key=${API_KEY}&series_id=PET.EMM_EPM0_PTE_R20_DPG.W`
//Gulf Coast
const url3 = `http://api.eia.gov/series/?api_key=${API_KEY}&series_id=PET.EMM_EPM0_PTE_R30_DPG.W`
//Rocky Mountain
const url4 = `http://api.eia.gov/series/?api_key=${API_KEY}&series_id=PET.EMM_EPM0_PTE_R40_DPG.W`	
//West Coast
const url5 = `http://api.eia.gov/series/?api_key=${API_KEY}&series_id=PET.EMM_EPM0_PTE_R50_DPG.W`	


d3.json(url1).then( function(d){
    // read in data from the API
    let gasPrices = d.series[0].data

    
});
    
