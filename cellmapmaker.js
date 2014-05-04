function createCellMapmaker() {
  var d3 = require('./d3-adapted/d3-jr');

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
        cell = opts.defaultCell;
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

    function addCell(cell, coords) {
      var node = quadtree.add(coords);
      // Adding the cell to the point object (which is technically an array)
      // instead of directly to the node because nodes get destroyed and 
      // recreated as the quadtree makes space for new points, but points 
      // get moved along.
      node.point.cell = cell;
    }

    function addCells(cellsAndCoords) {
      cellsAndCoords.forEach(function addCellPack(cellPack) {
        addCell(cellPack[0], cellPack[1]);
      });
    }

    function getNeighbors(coords) {
      var neighborCoords = [
        [coords[0] + 1, coords[1]],
        [coords[0], coords[1] + 1],
        [coords[0] - 1, coords[1]],
        [coords[0], coords[1] - 1]
      ];
      return neighborCoords.map(getCell);
    }

    function removeCell(coords) {
      debugger;
      if (coordsAreWithinBounds(coords)) {
        quadtree.remove(coords);
      }
    }

    return {
      defaultCell: opts.defaultCell ? opts.defaultCell : null,
      getCell: getCell,
      addCell: addCell,
      addCells: addCells,
      getNeighbors: getNeighbors,
      removeCell: removeCell
    };
  }

  return {
    createMap: createMap
  };
}

module.exports = createCellMapmaker();
