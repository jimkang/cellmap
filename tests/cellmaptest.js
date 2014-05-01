var assert = require('assert');
var cellmapmaker = require('../cellmapmaker');
var _ = require('lodash');

var maps = {};
var cells = {
  a: {
    name: 'a',
    p: 0.4
  },
  b: {
    name: 'b',
    p: 0.5
  },
  c: {
    name: 'c',
    p: 0.1
  },
  d: {
    name: 'd',
    p: 1.0
  },
  e: {
    name: 'e',
    p: 0.6
  }
};

var cellCoords = {
  a: [0, 0],
  b: [1000, 1000],
  c: [300, 500],
  d: [234, 789],
  e: [768, 384],
};

var overlaidCells = {
  f: {
    name: 'f',
    p: 0.4
  },
  g: {
    name: 'g',
    p: 0.4
  },
  h: {
    name: 'h',
    p: 0.4
  },
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
        var coords = cellCoords[cell.name];
        maps.nullMap.addCell(cell, coords);
        assert.deepEqual(maps.nullMap.getCell(coords), cell);
        // console.log('Got cell:', maps.nullMap.getCell(cell.coords));
      });
    }
  );

  test('getCell should return null for coords without added cells', 
    function testNullCellsAfterAdd() {
      assert.equal(maps.nullMap.getCell([1, 1]), null);
      assert.equal(maps.nullMap.getCell([999, 999]), null);
      assert.equal(maps.nullMap.getCell([800, 400]), null);
      assert.equal(maps.nullMap.getCell([235, 790]), null);
      assert.equal(maps.nullMap.getCell([365, 93]), null);
    }
  );
});

suite('Cell X default map', function cellXMapSuite() {
  var cellX = {
    name: 'x',
    p: 0.25
  };
  test('A map with cell X as the default with should be created', 
    function testMakingDefaultMap() {
      maps.defaultMap = cellmapmaker.createMap({
        size: [1000, 1000],
        defaultCell: cellX
      });

      assert.equal(typeof maps.defaultMap, 'object');
      assert.equal(maps.defaultMap.defaultCell, cellX);
    }
  );

  // TODO: Cell effects should produce copies. Cells should be immutable.
  test('getCell should return cellX if no points were added', 
    function testDefaultCell() {
      assert.deepEqual(maps.defaultMap.getCell([0, 0]), cellX);
    }
  );

  test('addCell should add cells that can be got with getCell', 
    function testAddCellGetCell() {
      _.each(cells, function testAddingOneCell(cell) {
        var coords = cellCoords[cell.name];
        maps.defaultMap.addCell(cell, coords);
        assert.deepEqual(maps.defaultMap.getCell(coords), cell);
      });
    }
  );

  test('getCell should return cell X for coords without explicitly added cells', 
    function testNullCellsAfterAdd() {
      assert.deepEqual(maps.defaultMap.getCell([1, 1]), cellX);
      assert.deepEqual(maps.defaultMap.getCell([999, 999]), cellX);
      assert.deepEqual(maps.defaultMap.getCell([800, 400]), cellX);
      assert.deepEqual(maps.defaultMap.getCell([235, 790]), cellX);
      assert.deepEqual(maps.defaultMap.getCell([365, 93]), cellX);
    }
  );

  // test('adding cells at the same coords should kick previous occupants out', 
  //   function testCellsAtSameSpot() {
  //       maps.defaultMap.addCell(overlaidCells.f, overlaidCells.f.coords);
  //       assert.deepEqual(maps.defaultMap.getCell(coords), cell);
        
  //       // console.log('Got cell:', maps.defaultMap.getCell(coords));
  //     });
  //   }
  // );

});

suite('Adding cells to null-default map', function cellAddSuite() {

});

suite('Adding cells to cellA-default map', function cellAddDefaultSuite() {

});
