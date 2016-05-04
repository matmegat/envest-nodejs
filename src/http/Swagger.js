
var swaggerTools  = require('swagger-tools')
var swaggerParser = require('swagger-parser')

module.exports = function Swagger (app, express)
{
	if (app.cfg.env !== 'prod')
	{
		/* eslint-disable max-len */
		// didn't find declaration of using 'body' schema of parameters
		// swagger.io/specification/#parameterObject
		// github.com/apigee-127/swagger-tools/blob/master/schemas/2.0/schema.json#L887-L908
		// http.express.use(body_parser.urlencoded({ extended: true }))
		/* eslint-enable */
		return swaggerParser.bundle(app.root('api/swagger/swagger.yaml'))
		.then((swaggerDoc) =>
		{
			swaggerTools.initializeMiddleware(swaggerDoc, (middleware) =>
			{
				// Serve the Swagger documents and Swagger UI
				express.use(middleware.swaggerUi())
			})
		})
	}
	else
	{
		return Promise.resolve()
	}
}
