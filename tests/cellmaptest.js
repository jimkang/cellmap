var assert = require('assert');
var cellmapmaker = require('../cellmapmaker');
var _ = require('lodash');

var maps = {};
var cells = {
  a: {
    coords: [0, 0],
    p: 0.4
  },
  b: {
    coords: [1000, 1000],
    p: 0.5
  },
  c: {
    coords: [300, 500],
    p: 0.1
  },
  d: {
    coords: [234, 789],
    p: 1.0
  },
  e: {
    coords: [768, 384],
    p: 0.6
  }
};

suite('Null-default map', function emptyMapSuite() {
  test('A null-default map should be created', function testMakingNullMap() {
    maps.nullMap = cellmapmaker.createMap({
      size: [1000, 1000]
    });

    assert.equal(typeof maps.nullMap, 'object');
    assert.equal(maps.nullMap.defaultCell, null);
  });

  test('getCell should return null if no points were added', 
    function testNullCell() {
      assert.equal(maps.nullMap.getCell([0, 0]), null);
    }
  );

  test('addCell should add cells that can be got with getCell', 
    function testAddCellGetCell() {
      _.each(cells, function testAddingOneCell(cell) {
        maps.nullMap.addCell(cell, cell.coords);
        assert.deepEqual(maps.nullMap.getCell(cell.coords), cell);
        // console.log('Got cell:', maps.nullMap.getCell(cell.coords));
      });

      // TODO: Add several cells at same coords.
    }
  );

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
