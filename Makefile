TESTS = tests/*.js
REPORTER = spec
HARMONY = node --harmony --harmony_arrow_functions
TIMEOUT = 20000
ISTANBUL = $(HARMONY) ./node_modules/istanbul/lib/cli.js
MOCHA = ./node_modules/mocha/bin/_mocha
COVERALLS = ./node_modules/coveralls/bin/coveralls.js
HINT =  ./node_modules/.bin/jshint

check:
	@$(HINT) .
	
test:
	@NODE_ENV=test $(HARMONY) $(MOCHA) -R $(REPORTER) -t $(TIMEOUT) \
		$(MOCHA_OPTS) \
		$(TESTS)

test-cov:
	@$(ISTANBUL) cover --report html $(MOCHA) -- -t $(TIMEOUT) -R spec $(TESTS)

test-coveralls:
	@$(ISTANBUL) cover --report lcovonly $(MOCHA) -- -t $(TIMEOUT) -R spec $(TESTS)
	@echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	@cat ./coverage/lcov.info | $(COVERALLS) && rm -rf ./coverage

test-all: check test test-coveralls

.PHONY: test