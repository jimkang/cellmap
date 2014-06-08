function createCellMapmaker() {
  if (typeof require === 'function') {
    var d3 = require('./d3-adapted/d3-jr');
    var _ = require('lodash');
  }

  function createMap(opts) {
    var visitFns = [
      ['matchCellNode', function visit_matchCellNode(node, x1, y1, x2, y2) {
        var targetX = targetCoords[0];
        var targetY = targetCoords[1];
        if (node.leaf && targetX === node.point[0] && targetY === node.point[1]) {
          targetNode = node;
        }

        // If the target is outside the rect, don't search the children of this 
        // node.
        var stopSearching = targetNode || 
          (targetX < x1 || targetX > x2 || targetY < y1 || targetY > y2)

        if (!stopSearching) {
          var sx = (x1 + x2) * 0.5,
              sy = (y1 + y2) * 0.5,
              children = node.nodes;
          if (children[0]) visit_matchCellNode(children[0], x1, y1, sx, sy);
          if (children[1]) visit_matchCellNode(children[1], sx, y1, x2, sy);
          if (children[2]) visit_matchCellNode(children[2], x1, sy, sx, y2);
          if (children[3]) visit_matchCellNode(children[3], sx, sy, x2, y2);
        }
      }],
      ['lookForInteresting', function visit_lookForInteresting(node, x1, y1, x2, y2) {
        if (node.leaf) {
          interesting.push(node.point.cell)
        }

        if (true) {
          var sx = (x1 + x2) * 0.5,
              sy = (y1 + y2) * 0.5,
              children = node.nodes;
          if (children[0]) visit_lookForInteresting(children[0], x1, y1, sx, sy);
          if (children[1]) visit_lookForInteresting(children[1], sx, y1, x2, sy);
          if (children[2]) visit_lookForInteresting(children[2], x1, sy, sx, y2);
          if (children[3]) visit_lookForInteresting(children[3], sx, sy, x2, y2);
        }
      }],
      ['countPoint', function visit_countPoint(node, x1, y1, x2, y2) {
        if (node.leaf) {
          pointCount += 1;
        }
        if (true) {
          var sx = (x1 + x2) * 0.5,
              sy = (y1 + y2) * 0.5,
              children = node.nodes;
          if (children[0]) visit_countPoint(children[0], x1, y1, sx, sy);
          if (children[1]) visit_countPoint(children[1], sx, y1, x2, sy);
          if (children[2]) visit_countPoint(children[2], x1, sy, sx, y2);
          if (children[3]) visit_countPoint(children[3], sx, sy, x2, y2);
        }
      }],
      ['lookForNeedsUpdate', function visit_lookForNeedsUpdate(node, x1, y1, x2, y2) {
        if (node.leaf && node.point.cell.needsUpdate) {
          updateNeeders.push(node.point.cell)
        }
        if (true) {
          var sx = (x1 + x2) * 0.5,
              sy = (y1 + y2) * 0.5,
              children = node.nodes;
          if (children[0]) visit_lookForNeedsUpdate(children[0], x1, y1, sx, sy);
          if (children[1]) visit_lookForNeedsUpdate(children[1], sx, y1, x2, sy);
          if (children[2]) visit_lookForNeedsUpdate(children[2], x1, sy, sx, y2);
          if (children[3]) visit_lookForNeedsUpdate(children[3], sx, sy, x2, y2);
        }
      }],
      ['lookForNonZeroNewP', function visit_lookForNonZeroNewP(node, x1, y1, x2, y2) {
        if (node.leaf && node.point.cell.nextD.p !== 0) {
          nonZeroNewP.push(node.point.cell)
        }

        if (true) {
          var sx = (x1 + x2) * 0.5,
              sy = (y1 + y2) * 0.5,
              children = node.nodes;
          if (children[0]) visit_lookForNonZeroNewP(children[0], x1, y1, sx, sy);
          if (children[1]) visit_lookForNonZeroNewP(children[1], sx, y1, x2, sy);
          if (children[2]) visit_lookForNonZeroNewP(children[2], x1, sy, sx, y2);
          if (children[3]) visit_lookForNonZeroNewP(children[3], sx, sy, x2, y2);
        }
      }]
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

    // TODO: Unroll this into functions that do not generate a function but 
    // instead use a hardcoded nodeCheckFn.
    function makeVisitFunction(nodeCheckFn) {
      return function customVisit(node, x1, y1, x2, y2) {
        if (!nodeCheckFn(node, x1, y1, x2, y2)) {
          var sx = (x1 + x2) * 0.5,
              sy = (y1 + y2) * 0.5,
              children = node.nodes;
          if (children[0]) customVisit(children[0], x1, y1, sx, sy);
          if (children[1]) customVisit(children[1], sx, y1, x2, sy);
          if (children[2]) customVisit(children[2], x1, sy, sx, y2);
          if (children[3]) customVisit(children[3], sx, sy, x2, y2);
        }
      };
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
