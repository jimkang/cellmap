cellmap
=======

cellmap is a map for keeping track of cells in a cellular automaton.

It's optimized for automata in which there are going to be a lot of cells that share the same default state. It conserves storage space by assuming most cells in its bounds are have a default value specified during initialization. It stores the interesting (non-default) cells in a quadtree.

Installation
------------

    npm install cellmap

Usage
-----

This module exports a `createMap` function that you can use to create a cellmap. With the cellmap, you can then set or remove cells, as well as get the neighbors to a set of coordinates.

    var cellmapmaker = require('cellmapmaker');

    var cellmap = cellmapmaker.createMap({
      size: [1000, 1000],
      defaultCellData: {
        p: 5,
        name: 'plain'
      }
    });

    cellmap.setCells([
      {
        d: {
          p: 10,
          name: 'excited'
        },
        coords: [490, 234]
      },
      {
        d: {
          p: 2,
          name: 'becalmed'
        },
        coords: [640, 789]
      }
    ]);

    cellmap.getCell([490, 234])

Cells are assumed to be objects that have a `d` object containing the cell's state, and a `coords` array, which contains two integers representing x and y.

Tests
-----

Run tests with `npm test`. Run tests in the debugger with 'npm run-script dtest'.

License
-------

MIT.
