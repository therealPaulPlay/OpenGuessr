# OpenGuessr
The free location guessing game. 

## Get started with the repo:
After cloning the repo, make sure you have
installed all of the required npm packages.
To do so, run `npm install` in the repository.

Webpack is configured to create two bundled javascript files,
one from main.js as well as one from analytics js. It resolves import and export dependencies
automatically which means that we do not need to specify multiple entry points for one bundle.

The signup screen currently does not use a bundled javascript file, rather than that, the userAPI as
well as errorPopup.js are being included in conjunction with the signupScreen.js file to work together
without bundling. This is needed, right now, as errorHandling.js is being accessed both in the bundled form in
main.js and as a standalone file in signupScreen.js. We could later split this up in two files to work
around dom call issues.

In order to configure the VS Code live server plugin to use the build folder as the new entry point / root folder,
you need to specify `"liveServer.settings.root": "/build"` in the settings.json of the live server plugin. 
The file is available through Extensions -> Live Server -> Settings (gear icon) -> Click where it says "edit in settings.json".

Running `npm run build` is currently configured
(in the package.json file) to build with webpack.
All necessary files will be included in the build folder.
