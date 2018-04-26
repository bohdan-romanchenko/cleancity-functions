const functions = require('firebase-functions');
const { Cluster, Clusterer } = require("k-medoids");
const _ = require("lodash");

const validateKmeansBody = ({clusters, matrix}) => {
  if (!clusters || typeof clusters !== 'number' || clusters < 0) {
    return 'Invalid clusters field';
  }

  if (!matrix || !Array.isArray(matrix) || matrix.length < clusters) {
    return 'Invalid matrix field';
  }

  return matrix.map((object, index) => {
    if (!object || !object.id || !object.value || !Array.isArray(object.value)) {
      return `Invalid ${index + 1}s object in matrix`;
    }

    return object.value.map((value, valueIndex) => {
      if (typeof value !== 'number' || value < 0) {
        return `Invalid ${valueIndex + 1} value in ${index + 1}s object in matrix`;
      }

      return null;
    }).filter(x => x)
  }).filter(x => Array.isArray(x) ? x.length : x).reduce((acc, val) => acc.concat(val), []);
};

exports.kmeans = functions.https.onRequest(({body: {clusters, matrix}}, res) => {
  const validationResult = validateKmeansBody({clusters, matrix});
  if (Array.isArray(validationResult) ? validationResult.length : validationResult) {
    return res.status(400).json({message: validationResult});
  }

  const k = clusters;
  const myData = matrix.map(({value}) => value);

  const clusterer = Clusterer.getInstance(myData, k);
  const clusteredData = clusterer.getClusteredData();
  res.status(200).json(clusteredData.map((cluster) =>
     cluster.map((clusteredObject) => matrix.find((object) => _.isEqual(object.value, clusteredObject)).id)
  ));
});