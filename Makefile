default_target: all

TARGET = run

all: $(TARGET)

setup: clean
	npm install

clean:
	rm -rf node_modules

lint:
	./node_modules/jshint/bin/jshint -c ./.jshintrc ./*.js

login_test:
	@node login_test.js

timer:
	@node start_timer.js
