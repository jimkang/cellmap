LIBRARY_FILES = \
	node_modules/d3/src/start.js \
	d3-adapted/quadtree.js \
	node_modules/d3/src/end.js

d3-adapted/d3-jr.js: $(LIBRARY_FILES)
	node_modules/.bin/smash $(LIBRARY_FILES) > d3-adapted/d3-jr.js

# TODO: Minify.

test-quadtree:
	mocha --ui tdd -R spec tests/cellmaptest.js

test-hashmap:
	mocha --ui tdd -R spec tests/cellmaptest.js --use-hashmap
