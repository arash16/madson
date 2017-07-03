BABEL := node_modules/.bin/babel
MOCHA := node_modules/.bin/mocha
MOCHA_PHANTOM := node_modules/.bin/mocha-phantomjs
NYC := node_modules/.bin/nyc

build: build-node build-browser

build-node:
	IS_NODE_MODULE=1 IS_SERVER=1 IS_CLIENT=0 IS_DEV=0 $(BABEL) src/index.js -o lib/index.js

build-browser:
	IS_NODE_MODULE=0 IS_SERVER=0 IS_CLIENT=1 IS_DEV=0 $(BABEL) src/index.js -o dist/madson.js

test: test-node test-phantom

test-node:
	$(NYC) --reporter=html $(MOCHA) -r ./test/setup.js

test-phantom:
	$(MOCHA_PHANTOM) ./test/browser.html

