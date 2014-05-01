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
      var cell = opts.defaultCell;
      if (!quadtreeIsEmpty(quadtree)) {
        targetNode = null;
        targetCoords = coords;
        quadtree.visit(matchCellNode);
        if (targetNode) {
          cell = targetNode.cell;
        }
      }
      return cell;
    }

    function addCell(cell, coords) {
      var node = quadtree.add(coords);
      node.cell = cell;
    }

    return {
      defaultCell: opts.defaultCell ? opts.defaultCell : null,
      getCell: getCell,
      addCell: addCell
    };
  }

  return {
    createMap: createMap
  };
}

module.exports = createCellMapmaker();
