#!/bin/bash
npm install 
node node_modules/bower/bin/bower install --allow-root
npm run deploy
