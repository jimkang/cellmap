var assert = require('assert');
var cellmapmaker = require('../cellmapmaker');

var maps = {};

suite('Null-default map', function emptyMapSuite() {
  test('A null-default map should be created', function testMakingNullMap() {
    maps.nullMap = cellmapmaker.createmap({
      size: [100, 100]
    });

    assert.equal(typeof maps.nullMap, 'object');
    assert.equal(maps.nullMap.defaultCell, null);
  });

  test('A request for a cell at 0, 0 should return null');
  test('A request for a cell at 1000, 1000 should return null');
});

suite('cellA default map', function cellAMapSuite() {
  test('A map with cellA as the default with should be created');
  test('A request for a cell at 0,0 should return a copy of cellA');
  test('A request for a cell at 1000, 1000 should return null');
});

suite('Adding cells to null-default map', function cellAddSuite() {

});

suite('Adding cells to cellA-default map', function cellAddDefaultSuite() {

});
