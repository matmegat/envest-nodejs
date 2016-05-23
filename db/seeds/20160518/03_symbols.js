
exports.seed = function (knex)
{
	return knex('symbols').del()
	.then(() =>
	{
		return knex('symbols')
		.insert(
		[
			{
				ticker: 'BABA',
				company: 'Alibaba Group Holding Limited'
			},
			{
				ticker: 'MBUU',
				company: 'Malibu Boats Inc'
			},
			{
				ticker: 'CXBMF',
				company: 'Calibre Mining Corp'
			},
			{
				ticker: 'EXCFF',
				company: 'Excalibur Resources Ltd.'
			},
			{
				ticker: 'CABE',
				company: 'Calibre Energy'
			},
			{
				ticker: 'AAPL',
				company: 'Apple Inc'
			},
			{
				ticker: 'CMG',
				company: 'Chipotle Mexican Grill'
			},
			{
				ticker: 'COKE',
				company: 'Coca-Cola Bottle Corp.'
			},
			{
				ticker: 'FB',
				company: 'Facebook'
			},
			{
				ticker: 'NFLX',
				company: 'Netflix Inc'
			},
			{
				ticker: 'GOOG',
				company: 'Alphabet Inc'
			},
			{
				ticker: 'GE',
				company: 'Genral Electric'
			},
			{
				ticker: 'FIT',
				company: 'Firbit Inc'
			},
			{
				ticker: 'YHOO',
				company: 'YAhoo Inc'
			},
			{
				ticker: 'GRMN',
				company: 'Garmin Ltd.'
			},
			{
				ticker: 'TWTR',
				company: 'Twitter'
			},
			{
				ticker: 'ATVI',
				company: 'Activation Blizzard'
			},
			{
				ticker: 'ZG',
				company: 'Zillow'
			}
		])
	})
}
