function createmap(opts) {
  var map = {};
  map.defaultCell = opts.defaultCell ? opts.defaultCell : null;
  return map;
}

module.exports = {
  createmap: createmap
};

