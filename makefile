default_target: all

TARGET = run

all: $(TARGET)

setup:
	@echo '-- Start download node modules to ./node_modules/'
	mkdir node_modules
	@echo '-- Start install xmlhttprequest'
	npm install xmlhttprequest@1.4.0
	@echo '-- Start install growl'
	npm install growl@1.5.1
	@echo '-- Start install jsdom'
	npm install jsdom@0.2.14

run:
	@node app.js

