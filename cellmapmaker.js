function createCellMapmaker() {
  if (typeof require === 'function') {
    var d3 = require('./d3-adapted/d3-jr');
    var _ = require('lodash');
  }

  function createMap(opts) {
    var visitFns = [
      ['matchCellNode', matchCellNode],
      ['lookForInteresting', lookForInteresting],
      ['countPoint', countPoint],
      ['lookForNeedsUpdate', lookForNeedsUpdate],
      ['lookForNonZeroNewP', lookForNonZeroNewP]
    ];

    // if (opts.filterFunctions) {
    //   opts.filterFunctions.each(function setUpCustomVisitFunction(nameAndFn) {
    //     var filtered = [];
    //     function customFilterVisit(n, x1, y1, x2, y2) {
    //       if (n.leaf && nameAndFn[1](n.point.cell)) {
    //         filtered.push(n.point.cell);
    //       }
    //       return true;
    //     }

    //     visitFns.push([
    //       nameAndFn[0], 
    //       customFilterVisit
    //     ]);
    //   });
    // }

    var quadtreeFactory = d3.geom.quadtree()
      .extent([[-1, -1], [opts.size[0] + 1, opts.size[1] + 1]])
      .visitFunctions(visitFns);

    var quadtree = quadtreeFactory([]);

    if (!opts.createDefaultCell) {
      opts.createDefaultCell = function createNullDataCell(coords) {
        return {
          d: null,
          coords: _.cloneDeep(coords)
        };
      };
    }

    var targetNode;
    var targetCoords;

    function matchCellNode(n, x1, y1, x2, y2) {
      var targetX = targetCoords[0];
      var targetY = targetCoords[1];
      if (n.leaf && targetX === n.point[0] && targetY === n.point[1]) {
        targetNode = n;
      }

      // If the target is outside the rect, don't search the children of this 
      // node.
      return targetNode || 
        (targetX < x1 || targetX > x2 || targetY < y1 || targetY > y2);
    }

    function quadtreeIsEmpty(tree) {
      return tree.leaf && !tree.point;
    }

    function getCell(coords) {
      var cell = null;

      if (coordsAreWithinBounds(coords)) {
        if (!quadtreeIsEmpty(quadtree)) {
          targetNode = null;
          targetCoords = coords;
          quadtree.visit_matchCellNode();
          if (targetNode) {
            cell = targetNode.point.cell;
          }
        }
        if (!cell && opts.createDefaultCell) {
          cell = opts.createDefaultCell(coords);
        }
      }
      return cell;
    }

    function coordsAreWithinBounds(coords) {
      var extent = quadtreeFactory.extent();

      return (coords[0] > extent[0][0] && coords[0] < extent[1][0] &&
        coords[1] > extent[0][1] && coords[1] < extent[1][1]);
    }

    function setCell(cell) {
      if (opts.isDefault && opts.isDefault(cell)) {
        // If it's a default cell, it doesn't need to be in the quadtree.
        quadtree.remove(cell.coords);
      }
      else {
        var node = quadtree.add(cell.coords.slice());
        // Adding the cell to the point object (which is technically an array)
        // instead of directly to the node because nodes get destroyed and 
        // recreated as the quadtree makes space for new points, but points 
        // get moved along.
        node.point.cell = cell;
      }
    }

    function setCells(cellsAndCoords) {
      cellsAndCoords.forEach(setCell);
    }

    function getNeighbors(coords) {
      var neighborCoords = [
        plusX(coords), plusY(coords), minusX(coords), minusY(coords)
      ];
      return neighborCoords.map(getCell);
    }

    function alwaysTrue() {
      return true;
    }

    var interesting = [];
    function lookForInteresting(n, x1, y1, x2, y2) {
      if (!n) {
        debugger;
      }
      if (n.leaf) {
        interesting.push(n.point.cell)
      }

      return false;
    }

    function interestingCells() {
      interesting.length = 0;
      quadtree.visit_lookForInteresting();
      return interesting;
    }


    var nonZeroNewP = [];
    function lookForNonZeroNewP(n, x1, y1, x2, y2) {
      if (n.leaf && n.point.cell.nextD.p !== 0) {
        nonZeroNewP.push(n.point.cell)
      }

      return false;
    }
    function nonZeroNewPCells() {
      nonZeroNewP.length = 0;
      quadtree.visit_lookForNonZeroNewP();
      return nonZeroNewP;
    }


    var updateNeeders = [];
    function lookForNeedsUpdate(n, x1, y1, x2, y2) {
      if (n.leaf && n.point.cell.needsUpdate) {
        updateNeeders.push(n.point.cell)
      }

      return false;
    }
    function cellsThatNeedUpdate() {
      updateNeeders.length = 0;
      quadtree.visit_lookForNeedsUpdate();
      return updateNeeders;
    }

    /*
    // These are here so that addCellFromNode can be defined outside of 
    // filterCells, which results in about 1/3 of the ticks.
    var filtered = [];
    // var currentFilterFunction;

    function filterCells(filterFn) {
      filtered.length = 0;
      quadtree['visit_' + ]();
      return filtered;
    }

    function addCellFromNode(n, x1, y1, x2, y2) {
      if (n.leaf && currentFilterFunction(n.point.cell)) {
        filtered.push(n.point.cell);
      }
    }
    */





    function removeCell(coords) {
      if (coordsAreWithinBounds(coords)) {
        quadtree.remove(coords);
      }
    }

    function plusX(coords) {
      return [coords[0] + 1, coords[1]];
    }

    function plusY(coords) {
      return [coords[0], coords[1] + 1];
    }

    function minusX(coords) {
      return [coords[0] - 1, coords[1]];
    }

    function minusY(coords) {
      return [coords[0], coords[1] - 1];
    }

    var pointCount;
    function pointsUsedForStorage() {
      pointCount = 0;
      quadtree.visit_countPoint();
      return pointCount;
    }

    function countPoint(n, x1, y1, x2, y2) {
      if (n.leaf) {
        pointCount += 1;
      }
    }

    return {
      getCell: getCell,
      setCell: setCell,
      setCells: setCells,
      getNeighbors: getNeighbors,
      interestingCells: interestingCells,
      // filterCells: filterCells,
      nonZeroNewPCells: nonZeroNewPCells,
      cellsThatNeedUpdate: cellsThatNeedUpdate,
      removeCell: removeCell,
      plusX: plusX,
      plusY: plusY,
      minusX: minusX,
      minusY: minusY,
      pointsUsedForStorage: pointsUsedForStorage,
      createDefaultCell: opts.createDefaultCell,
      isDefault: opts.isDefault
    };
  }

  return {
    createMap: createMap
  };
}

if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = createCellMapmaker();
}
