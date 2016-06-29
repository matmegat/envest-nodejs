
exports.seed = function (knex)
{
	return knex('symbols').del()
	.then(() =>
	{
		return knex('symbols')
		.insert(
		[
			{
				exchange: 'NYXE',
				ticker: 'BABA',
				company: 'Alibaba Group Holding Limited'
			},
			{
				exchange: 'NASDAQ',
				ticker: 'MBUU',
				company: 'Malibu Boats Inc'
			},
			{
				exchange: 'OTC',
				ticker: 'CXBMF',
				company: 'Calibre Mining Corp'
			},
			{
				exchange: 'OTC',
				ticker: 'EXCFF',
				company: 'Excalibur Resources Ltd.'
			},
			{
				exchange: 'OTC',
				ticker: 'CABE',
				company: 'Calibre Energy'
			},
			{
				exchange: 'NASDAQ',
				ticker: 'AAPL',
				company: 'Apple Inc'
			},
			{
				exchange: 'NYSE',
				ticker: 'CMG',
				company: 'Chipotle Mexican Grill'
			},
			{
				exchange: 'NASDAQ',
				ticker: 'COKE',
				company: 'Coca-Cola Bottle Corp.'
			},
			{
				exchange: 'NASDAQ',
				ticker: 'FB',
				company: 'Facebook'
			},
			{
				exchange: 'NASDAQ',
				ticker: 'NFLX',
				company: 'Netflix Inc'
			},
			{
				exchange: 'NASDAQ',
				ticker: 'GOOG',
				company: 'Alphabet Inc'
			},
			{
				exchange: 'NYSE',
				ticker: 'GE',
				company: 'Genral Electric'
			},
			{
				exchange: 'NYSE',
				ticker: 'FIT',
				company: 'Firbit Inc'
			},
			{
				exchange: 'NASDAQ',
				ticker: 'YHOO',
				company: 'YAhoo Inc'
			},
			{
				exchange: 'NASDAQ',
				ticker: 'GRMN',
				company: 'Garmin Ltd.'
			},
			{
				exchange: 'NYSE',
				ticker: 'TWTR',
				company: 'Twitter'
			},
			{
				exchange: 'NASDAQ',
				ticker: 'ATVI',
				company: 'Activation Blizzard'
			},
			{
				exchange: 'NASDAQ',
				ticker: 'ZG',
				company: 'Zillow'
			}
		])
	})
}
