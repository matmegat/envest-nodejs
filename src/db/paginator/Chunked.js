
var extend = require('lodash/extend')

var expect = require('chai').expect

var toId = require('../../id').toId

var defaults =
{
	order_column: 'id',
	real_order_column: 'timestamp',
	table: null,
	limit: 20
}

module.exports = function Paginator__Chunked (paginator_options)
{
	var paginator = {}

	paginator_options = extend({}, defaults, paginator_options)

	expect(paginator_options.table, 'paginator target relation').a('function')

	/* ... */

	return paginator
}
