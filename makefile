default_target: all

TARGET = run

all: $(TARGET)

setup:
	npm install

run:
	@node app.js

