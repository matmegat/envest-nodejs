
module.exports =
{
	extends: './node_modules/js-outlander/outlander.eslint.js',

	env:
	{
		es6: true
	},

	rules:
	{
		'no-unused-expressions': 0,
		 complexity:  [ 1, 7 ],
		'max-params': [ 1, 5 ],
		'max-nested-callbacks': [ 1, 4 ]
	}
}
