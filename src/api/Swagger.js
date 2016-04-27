var swaggerTools = require('swagger-tools')
var jsyaml = require('js-yaml')
var fs = require('fs')
var rootpath = require('rootpath')

module.exports = function Swagger (app, expressApp) {
	// swaggerRouter configuration
	var options =
	{
		swaggerUi: '/swagger.json',
	}

	// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
	var spec = fs.readFileSync(rootpath(app.root(), 'var/docs/swagger.yaml')(), 'utf8');
	var swaggerDoc = jsyaml.safeLoad(spec);

	swaggerTools.initializeMiddleware(swaggerDoc, (middleware) =>
	{
		// Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
		expressApp.use(middleware.swaggerMetadata());

		// Validate Swagger requests
		expressApp.use(middleware.swaggerValidator());

		// Route validated requests to appropriate controller
		expressApp.use(middleware.swaggerRouter(options));

		// Serve the Swagger documents and Swagger UI
		expressApp.use(middleware.swaggerUi());
	});
}
