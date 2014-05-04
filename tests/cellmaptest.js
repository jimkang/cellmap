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
  c: [233, 789],
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

  test('Verify that only one cell can be mapped per coordinate',
    function testCellsAtSameSpot() {
        var spot = [10, 700];
        maps.defaultMap.addCell(overlaidCells.f, spot);
        assert.deepEqual(maps.defaultMap.getCell(spot), overlaidCells.f);

        maps.defaultMap.addCell(overlaidCells.g, spot);
        assert.deepEqual(maps.defaultMap.getCell(spot), overlaidCells.g);        
        assert.notDeepEqual(maps.defaultMap.getCell(spot), overlaidCells.f);

        maps.defaultMap.addCell(overlaidCells.h, spot);
        assert.notDeepEqual(maps.defaultMap.getCell(spot), overlaidCells.g);        
        assert.notDeepEqual(maps.defaultMap.getCell(spot), overlaidCells.f);
        assert.deepEqual(maps.defaultMap.getCell(spot), overlaidCells.h);
    }
  );

  test('Verify that getCell returns null for out-of-bounds coords', 
    function testOutOfBoundGets() {
      assert.equal(maps.defaultMap.getCell([-1, 1]), null);
      assert.equal(maps.defaultMap.getCell([1, -1]), null);
      assert.equal(maps.defaultMap.getCell([1001, 0]), null);
      assert.equal(maps.defaultMap.getCell([0, 1001]), null);
      assert.equal(maps.defaultMap.getCell([500, 100000]), null);
    }
  );

  // How important is direction? Isn't direction emergent as a result of 
  // naturally occurring flow?
  test('Verify basic neighbors method',
    function testNeighborsMethod() {
      assert.deepEqual(
        maps.defaultMap.getNeighbors(cellCoords[cells.a.name]),
        [cellX, cellX, null, null]
      );

      assert.deepEqual(
        maps.defaultMap.getNeighbors(cellCoords[cells.b.name]),
        [null, null, cellX, cellX]
      );

      assert.deepEqual(
        maps.defaultMap.getNeighbors(cellCoords[cells.c.name]),
        [cells.d, cellX, cellX, cellX]
      );

      assert.deepEqual(
        maps.defaultMap.getNeighbors(cellCoords[cells.d.name]),
        [cellX, cellX, cells.c, cellX]
      );

      assert.deepEqual(
        maps.defaultMap.getNeighbors(cellCoords[cells.e.name]),
        [cellX, cellX, cellX, cellX]
      );
    }
  );

  test('Verify that removeCell removes cells', 
    function testRemoveCell() {
      var eCoords = cellCoords[cells.e.name];
      maps.defaultMap.removeCell(eCoords);
      assert.deepEqual(maps.defaultMap.getCell(eCoords), cellX);

      var dCoords = cellCoords[cells.d.name];
      maps.defaultMap.removeCell(dCoords);
      assert.deepEqual(maps.defaultMap.getCell(dCoords), cellX);

      var cCoords = cellCoords[cells.c.name];
      maps.defaultMap.removeCell(cCoords);
      assert.deepEqual(maps.defaultMap.getCell(cCoords), cellX);

      var bCoords = cellCoords[cells.b.name];
      maps.defaultMap.removeCell(bCoords);
      assert.deepEqual(maps.defaultMap.getCell(bCoords), cellX);

      var aCoords = cellCoords[cells.a.name];
      maps.defaultMap.removeCell(aCoords);
      assert.deepEqual(maps.defaultMap.getCell(aCoords), cellX);
    }
  );

  test('Verify that addCells adds a list of cells',
    function testAddCells() {
      maps.defaultMap.addCells([
        [cells.a, cellCoords[cells.a.name]],
        [cells.b, cellCoords[cells.b.name]],
        [cells.c, cellCoords[cells.c.name]],
        [cells.d, cellCoords[cells.d.name]],
        [cells.e, cellCoords[cells.e.name]]
      ]);

      _.each(cells, function checkCell(cell) {
        assert.deepEqual(maps.defaultMap.getCell(cellCoords[cell.name]), cell);
      });
    }
  );

});
