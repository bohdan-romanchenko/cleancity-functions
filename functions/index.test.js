const {countShortestPath} = require('./index');

test('should count shortest path', () => {
  const matrix = [{
    id: 1, value: [0,3,2,3,4], start: true,
  },{
    id: 2, value: [1,0,2,3,4]
  },{
    id: 3, value: [4,2,0,4,5]
  },{
    id: 4, value: [3,4,2,0,1],
  },{
    id: 5, value: [4,4,2,4,0], finish: true,
  }];

  expect(countShortestPath(matrix)).toEqual([1,3,2,4,5]);
});