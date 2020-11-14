console.log('hi')

tf.loadLayersModel("Notebooks/jsmodel/model.json").then(model => {
    this._model = model;
})