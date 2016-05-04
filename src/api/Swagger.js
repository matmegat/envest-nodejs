var swaggerTools = require('swagger-tools')
var SwaggerParser = require('swagger-parser')

module.exports = function Swagger (app, expressApp)
{
	SwaggerParser.bundle(app.root('api/swagger/swagger.yaml'))
		.then((swaggerDoc) =>
		{
			swaggerTools.initializeMiddleware(swaggerDoc, (middleware) =>
			{
				// Serve the Swagger documents and Swagger UI
				expressApp.use(middleware.swaggerUi())
			})
		})
		.catch((err) =>
		{
			console.error('SwaggerParser', err)
		})
}
