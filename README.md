# OpenGuessr
The free location guessing game. 

## Get started with the repo:
After cloning the repo, make sure you have
installed all of the required npm packages.
To do so, run `npm install` in the repository.

Webpack is currently configured to use logto.js
as the entry point. This means that all dependencies
will be resolved from there. Therefore,
make sure to import libraries [found in node-modolues]
in this file rather than somewhere else. 

Running `npm run build` is currently configured
(in the package.lock file) to build with webpack and
create a bundle.js file which includes all nedded 
node modules as well as logto.js. This file is being
loaded into the html.