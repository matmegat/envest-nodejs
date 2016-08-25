
var Type = require('./Type')

var pick = require('lodash/pick')

var validate = require('../../validate')
var Err = require('../../../Err')

var Symbl = require('../symbols/Symbl')

var PostPicNotFound = Err('post_pic_not_found',
	'No corresponding picture for this hash')

module.exports = function Update (db)
{
	return Type(
	{
		validate: validate_update,
		set: (trx, investor_id, type, date, data) =>
		{
			return db.symbols.resolveMany(data.symbols)
			.then(symbls =>
			{
				data.symbols = symbls
				.map(item =>
				{
					return pick(item,
					[
						'ticker',
						'exchange'
					])
				})
			})
			.then(() =>
			{
				return db.feed.create(trx, investor_id, type, date, data)
			})
		}
	})

	function validate_update (data)
	{
		var data = pick(data,
		[
			'symbols',
			'title',
			'text',
			'pic',
			'chart'
		])

		var validate_symbols_length = validate.length(6, 1)

		return new Promise(rs =>
		{
			validate.required(data.text, 'text')
			validate.empty(data.text, 'text')

			validate.required(data.title, 'title')
			validate.empty(data.title, 'title')

			validate.required(data.symbols, 'symbols')
			validate.empty(data.symbols, 'symbols')
			validate.array(data.symbols, 'symbols')
			validate_symbols_length(data.symbols, 'symbols')

			validate.empty(data.pic, 'pic')

			rs(data)
		})
		.then(data =>
		{
			if (data.pic)
			{
				return db.static.exists(data.pic)
				.then(so =>
				{
					if (! so)
					{
						throw PostPicNotFound({ hash: data.pic })
					}

					return data
				})
			}

			return data
		})
		.then(data =>
		{
			var chart = data.chart
			var points_length = validate.length(Infinity, 1)
			var validate_point = (point, i) =>
			{
				validate.required(point.timestamp, `points[${i}].timestamp`)
				validate.required(point.value, `points[${i}].value`)

				validate.date(point.timestamp)
				validate.number(point.value, `points[${i}].value`)
			}

			if (chart)
			{
				validate.required(chart.symbol, 'chart.symbol')
				validate.required(chart.graph_as, 'chart.graph_as')
				validate.required(chart.series, 'chart.series')

				validate.empty(chart.symbol, 'chart.symbol')
				validate.date(chart.graph_as)

				validate.required(chart.series.period, 'chart.series.period')
				validate.required(chart.series.points, 'chart.series.points')

				validate.string(chart.series.period, 'chart.series.period')
				validate.empty(chart.series.period, 'chart.series.period')

				validate.array(chart.series.points, 'chart.series.points')
				points_length(chart.series.points, 'chart.series.points')
				chart.series.points.forEach(validate_point)

				return Symbl.validate(chart.symbol)
				.then(() => data)
			}
			else
			{
				return data
			}
		})
	}
}
