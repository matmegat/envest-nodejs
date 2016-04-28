var swaggerTools = require('swagger-tools')
var SwaggerParser = require('swagger-parser')

module.exports = function Swagger (app, expressApp)
{
	// swaggerRouter configuration
	var options =
	{
		swaggerUi: '/swagger.json',	// copied from generated app
	}

	SwaggerParser.bundle(app.root('api/swagger/swagger.yaml'))
		.then((swaggerDoc) =>
		{
			swaggerTools.initializeMiddleware(swaggerDoc, (middleware) =>
			{
				// Interpret Swagger resources and attach metadata to request -
				// must be first in swagger-tools middleware chain
				expressApp.use(middleware.swaggerMetadata())

				// Validate Swagger requests
				expressApp.use(middleware.swaggerValidator())

				// Route validated requests to appropriate controller
				expressApp.use(middleware.swaggerRouter(options))

				// Serve the Swagger documents and Swagger UI
				expressApp.use(middleware.swaggerUi())
			})
		})
		.catch((err) =>
		{
			console.error('SwaggerParser', err)
		})
}
