var assert = require('assert');
var cellmapmaker = require('../cellmapmaker');
var _ = require('lodash');

var maps = {};
var cells = {
  a: {
    d: {
      name: 'a',
      p: 0.4
    },
    coords: [0, 0],
  },
  b: {
    d: {
      name: 'b',
      p: 0.5
    },
    coords: [1000, 1000]
  },
  c: {
    d: {
      name: 'c',
      p: 0.1
    },
    coords: [233, 789]
  },
  d: {
    d: {
      name: 'd',
      p: 1.0
    },
    coords: [234, 789]
  },
  e: {
    d: {
      name: 'e',
      p: 0.6
    },
    coords: [768, 384]
  }
};

var overlaySpot = [10, 700];

var overlaidCells = {
  f: {
    d: {
      name: 'f',
      p: 0.4
    },
    coords: overlaySpot
  },
  g: {
    d: {
      name: 'g',
      p: 0.4
    },
    coords: overlaySpot
  },
  h: {
    d: {
      name: 'h',
      p: 0.4
    },
    coords: overlaySpot
  }
};    

suite('Null-default map', function emptyMapSuite() {
  test('A null-default map should be created', function testMakingNullMap() {
    maps.nullMap = cellmapmaker.createMap({
      size: [1000, 1000]
    });

    assert.equal(typeof maps.nullMap, 'object');
    assert.equal(maps.nullMap.defaultCellData, null);
  });

  test('getCell should return a cell with null data if no points were added', 
    function testNullCell() {
      assert.equal(maps.nullMap.getCell([0, 0]).d, null);
    }
  );

  test('setCell should add cells that can be got with getCell', 
    function testsetCellGetCell() {
      _.each(cells, function testAddingOneCell(cell) {
        maps.nullMap.setCell(cell);
        assert.deepEqual(maps.nullMap.getCell(cell.coords), cell);
        // console.log('Got cell:', maps.nullMap.getCell(cell.coords));
      });
    }
  );

  test('getCell should return null-data cells for coords without added cells', 
    function testNullCellsAfterAdd() {
      assert.equal(maps.nullMap.getCell([1, 1]).d, null);
      assert.equal(maps.nullMap.getCell([999, 999]).d, null);
      assert.equal(maps.nullMap.getCell([800, 400]).d, null);
      assert.equal(maps.nullMap.getCell([235, 790]).d, null);
      assert.equal(maps.nullMap.getCell([365, 93]).d, null);
    }
  );

  // a: [0, 0],
  // b: [1000, 1000],
  // c: [233, 789],
  // d: [234, 789],
  // e: [768, 384],

  test('interestingCells should return only cells that don\'t match the default',
    function testInterestingCells() {
      assert.deepEqual(
        maps.nullMap.interestingCells(), 
        [cells.a, cells.e, cells.c, cells.d, cells.b]
      );
    }
  );

  test('filterCells should return cells with p of at least 0.5 only', 
    function testFilterCells() {
      assert.deepEqual(
        maps.nullMap.filterCells(function gteHalf(cell) {
          return cell.d.p >= 0.5;
        }),
        [cells.e, cells.d, cells.b]
      )
    }
  );
});

suite('Cell X default map', function cellXMapSuite() {
  var cellXData = {
    name: 'x',
    p: 0.25
  };
  test('A map with cell X as the default with should be created', 
    function testMakingDefaultMap() {
      maps.defaultMap = cellmapmaker.createMap({
        size: [1000, 1000],
        defaultCellData: cellXData
      });

      assert.equal(typeof maps.defaultMap, 'object');
      assert.equal(maps.defaultMap.defaultCellData, cellXData);
    }
  );

  // TODO: Cell effects should produce copies. Cells should be immutable.
  test('getCell should return cellX if no points were added', 
    function testDefaultCell() {
      assert.deepEqual(maps.defaultMap.getCell([0, 0]), {
        d: cellXData,
        coords: [0, 0]
      });
    }
  );

  test('setCell should add cells that can be got with getCell', 
    function testsetCellGetCell() {
      _.each(cells, function testAddingOneCell(cell) {
        maps.defaultMap.setCell(cell, cell.coords);
        assert.deepEqual(maps.defaultMap.getCell(cell.coords), cell);
      });
    }
  );

  test('getCell should return cell X for coords without explicitly added cells', 
    function testNullCellsAfterAdd() {
      assert.deepEqual(maps.defaultMap.getCell([1, 1]), {
        d: cellXData,
        coords: [1, 1]
      });
      assert.deepEqual(maps.defaultMap.getCell([999, 999]), {
        d: cellXData,
        coords: [999, 999]
      });
      assert.deepEqual(maps.defaultMap.getCell([800, 400]), {
        d: cellXData,
        coords: [800, 400]
      });
      assert.deepEqual(maps.defaultMap.getCell([235, 790]), {
        d: cellXData,
        coords: [235, 790]
      });
      assert.deepEqual(maps.defaultMap.getCell([365, 93]), {
        d: cellXData,
        coords: [365, 93]
      });
    }
  );

  test('Verify that only one cell can be mapped per coordinate',
    function testCellsAtSameSpot() {  
        maps.defaultMap.setCell(overlaidCells.f);

        assert.deepEqual(maps.defaultMap.getCell(overlaySpot), overlaidCells.f);

        maps.defaultMap.setCell(overlaidCells.g);

        assert.deepEqual(maps.defaultMap.getCell(overlaySpot), overlaidCells.g);        
        assert.notDeepEqual(maps.defaultMap.getCell(overlaySpot), 
          overlaidCells.f);

        maps.defaultMap.setCell(overlaidCells.h);

        assert.notDeepEqual(maps.defaultMap.getCell(overlaySpot), 
          overlaidCells.g);        
        assert.notDeepEqual(maps.defaultMap.getCell(overlaySpot), 
          overlaidCells.f);
        assert.deepEqual(maps.defaultMap.getCell(overlaySpot), overlaidCells.h);
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
        maps.defaultMap.getNeighbors(cells.a.coords),
        [
          {
            d: cellXData,
            coords: maps.defaultMap.plusX(cells.a.coords),
          }, 
          {
            d: cellXData,
            coords: maps.defaultMap.plusY(cells.a.coords)
          }, 
          null,
          null
        ]
      );

      assert.deepEqual(
        maps.defaultMap.getNeighbors(cells.b.coords),
        [
          null, 
          null,
          {
            d: cellXData,
            coords: maps.defaultMap.minusX(cells.b.coords)
          },
          {
            d: cellXData,
            coords: maps.defaultMap.minusY(cells.b.coords)
          }
        ]
      );

      assert.deepEqual(
        maps.defaultMap.getNeighbors(cells.c.coords),
        [
          cells.d, 
          {
            d: cellXData,
            coords: maps.defaultMap.plusY(cells.c.coords)
          }, 
          {
            d: cellXData,
            coords: maps.defaultMap.minusX(cells.c.coords)
          },
          {
            d: cellXData,
            coords: maps.defaultMap.minusY(cells.c.coords)
          }
        ]
      );

      assert.deepEqual(
        maps.defaultMap.getNeighbors(cells.d.coords),
        [
          {
            d: cellXData,
            coords: maps.defaultMap.plusX(cells.d.coords)
          }, 
          {
            d: cellXData,
            coords: maps.defaultMap.plusY(cells.d.coords)
          }, 
          cells.c,
          {
            d: cellXData,
            coords: maps.defaultMap.minusY(cells.d.coords)
          }
        ]
      );

      assert.deepEqual(
        maps.defaultMap.getNeighbors(cells.e.coords),
        [
          {
            d: cellXData,
            coords: maps.defaultMap.plusX(cells.e.coords),
          }, 
          {
            d: cellXData,
            coords: maps.defaultMap.plusY(cells.e.coords)
          }, 
          {
            d: cellXData,
            coords: maps.defaultMap.minusX(cells.e.coords)
          },
          {
            d: cellXData,
            coords: maps.defaultMap.minusY(cells.e.coords)
          }
        ]
      );
    }
  );

  test('Verify that removeCell removes cells', 
    function testRemoveCell() {
      maps.defaultMap.removeCell(cells.e.coords);
      assert.deepEqual(maps.defaultMap.getCell(cells.e.coords), {
        d: cellXData,
        coords: cells.e.coords
      });

      maps.defaultMap.removeCell(cells.d.coords);
      assert.deepEqual(maps.defaultMap.getCell(cells.d.coords), {
        d: cellXData,
        coords: cells.d.coords
      });

      maps.defaultMap.removeCell(cells.c.coords);
      assert.deepEqual(maps.defaultMap.getCell(cells.c.coords), {
        d: cellXData,
        coords: cells.c.coords
      });

      maps.defaultMap.removeCell(cells.b.coords);
      assert.deepEqual(maps.defaultMap.getCell(cells.b.coords), {
        d: cellXData,
        coords: cells.b.coords
      });

      maps.defaultMap.removeCell(cells.a.coords);
      assert.deepEqual(maps.defaultMap.getCell(cells.a.coords), {
        d: cellXData,
        coords: cells.a.coords
      });
    }
  );

  test('Verify that setCells adds a list of cells',
    function testSetCells() {
      maps.defaultMap.setCells([
        cells.a,
        cells.b,
        cells.c,
        cells.d,
        cells.e
      ]);

      _.each(cells, function checkCell(cell) {
        assert.deepEqual(maps.defaultMap.getCell(cell.coords), cell);
      });
    }
  );

  test('Verify that setting cells to the default cell data clears the quadtree',
    function testSetCellsToDefault() {
      maps.defaultMap.setCells([
        {
          d: cellXData,
          coords: cells.a.coords
        },
        {
          d: cellXData,
          coords: cells.b.coords
        },
        {
          d: cellXData,
          coords: cells.c.coords
        }
      ]);

      assert.equal(maps.defaultMap.pointsUsedForStorage(), 3);      

      maps.defaultMap.setCells([
        {
          d: cellXData,
          coords: cells.d.coords
        },
        {
          d: cellXData,
          coords: cells.e.coords
        }
      ]);

      assert.equal(maps.defaultMap.pointsUsedForStorage(), 1);

      maps.defaultMap.setCell({d: cellXData, coords: overlaySpot});
      assert.equal(maps.defaultMap.pointsUsedForStorage(), 0);
    }
  );

});
