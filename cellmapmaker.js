function createCellMapmaker() {
  if (typeof require === 'function') {
    var d3 = require('./d3-adapted/d3-jr');
    var _ = require('lodash');
  }

  function createMap(opts) {
    var quadtreeFactory = d3.geom.quadtree()
      .extent([[-1, -1], [opts.size[0] + 1, opts.size[1] + 1]]);
    var quadtree = quadtreeFactory([]);

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
        cell = {
          d: opts.defaultCellData,
          coords: coords
        };
        if (!quadtreeIsEmpty(quadtree)) {
          targetNode = null;
          targetCoords = coords;
          quadtree.visit(matchCellNode);
          if (targetNode) {
            cell = targetNode.point.cell;
          }
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
      if (_.isEqual(cell.d, opts.defaultCellData)) {
        // If it's the default cell, it doesn't need to be in the quadtree.
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

    function interestingCells() {
      return filterCells(alwaysTrue);
    }

    function filterCells(shouldInclude) {
      var filtered = [];
      quadtree.visit(function addCellFromNode(n, x1, y1, x2, y2) {
        if (n.leaf && shouldInclude(n.point.cell)) {
          filtered.push(n.point.cell);
        }
      });
      return filtered;
    }

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

    function pointsUsedForStorage() {
      var pointCount = 0;
      quadtree.visit(function countPoint(n, x1, y1, x2, y2) {
        if (n.leaf) {
          pointCount += 1;
        }
      });
      return pointCount;
    }

    return {
      defaultCellData: opts.defaultCellData ? opts.defaultCellData : null,
      getCell: getCell,
      setCell: setCell,
      setCells: setCells,
      getNeighbors: getNeighbors,
      interestingCells: interestingCells,
      filterCells: filterCells,
      removeCell: removeCell,
      plusX: plusX,
      plusY: plusY,
      minusX: minusX,
      minusY: minusY,
      pointsUsedForStorage: pointsUsedForStorage
    };
  }

  return {
    createMap: createMap
  };
}

if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = createCellMapmaker();
}
