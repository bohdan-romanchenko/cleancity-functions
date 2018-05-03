const functions = require('firebase-functions');
const { Clusterer } = require("k-medoids");
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

const validateShortestPathBody = (matrices) => {
  if (!matrices || !Array.isArray(matrices) || matrices.length === 0) {
    return 'Body should be an array';
  }

  return matrices.map((matrix, index) => {
    if (!matrix || !Array.isArray(matrix) || matrices.length === 0) {
      return `Matrix on index ${index} is incorrect`;
    }

    if (!matrix.find(({start}) => start)) {
      return `Matrix on index ${index} has no start object`;
    }

    if (!matrix.find(({finish}) => finish)) {
      return `Matrix on index ${index} has no finish object`;
    }
  }).filter(x => x);
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

const countShortestPath = (matrix = []) => {
  const visitedNodes = [];
  const currentIndex = matrix.findIndex(({start}) => start);
  const finishIndex = matrix.findIndex(({finish}) => finish);

  const {visitedNodes: result} = getShortestPath({currentIndex, visitedNodes, matrix, finishIndex});
  return result.map((index) => matrix[index].id);
};

const getShortestPath = ({currentIndex, visitedNodes, matrix, finishIndex}) => {
  const currentPossibleValues = matrix[currentIndex].value.map((val, index) => {
    if (index !== currentIndex && !visitedNodes.includes(index) && index !== finishIndex) {
      return val;
    }

    return Number.POSITIVE_INFINITY;
  });
  const minValue = Math.min(...currentPossibleValues);
  const indices = currentPossibleValues.map((e, i) => {
    return e === minValue ? i : ''
  }).filter(x => x !== '');
  visitedNodes.push(currentIndex);

  if (visitedNodes.length - 1 === matrix.length - 2) {
    visitedNodes.push(finishIndex);
    return {visitedNodes};
  }

  return getShortestPath({currentIndex: indices[0], visitedNodes, matrix, finishIndex})
};

exports.getShortestPath = getShortestPath;
exports.countShortestPath = countShortestPath;

exports.shortestPath = functions.https.onRequest((req, res) => {
  const validationResult = validateShortestPathBody(req.body);

  if (Array.isArray(validationResult) ? validationResult.length : validationResult) {
    return res.status(400).json({message: validationResult});
  }

  req.body.map((matrix) => countShortestPath(matrix));
  res.status(200).json(req.body.map((matrix) => countShortestPath(matrix)));
});
