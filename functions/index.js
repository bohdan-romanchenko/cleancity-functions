const functions = require('firebase-functions');
const { Cluster, Clusterer } = require("k-medoids");

exports.kmeans = functions.https.onRequest((req, res) => {
  const k = 2;
  const myData = [
    [0, 2, 10, 15, 100],
    [2, 0, 13, 11, 2],
    [10, 13, 0, 3, 16],
    [15, 11, 3, 0, 17],
    [1, 2, 16, 17, 0]
  ];

  const clusterer = Clusterer.getInstance(myData, k);
  const clusteredData = clusterer.getClusteredData();
  console.log(JSON.stringify(clusteredData));
  res.status(200).json(clusteredData);
});