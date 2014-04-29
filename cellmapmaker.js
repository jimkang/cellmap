function createCellMapmaker() {
  function createMap(opts) {
    function getCell(location) {
    }

    return {
      defaultCell: opts.defaultCell ? opts.defaultCell : null,
      getCell: getCell
    };
  }

  return {
    createMap: createMap
  };
}

module.exports = createCellMapmaker();
