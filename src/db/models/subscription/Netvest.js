
var Subscription = require('./Subscription')
var PromoCode    = require('./PromoCode')

module.exports = function NetvestSubsc (db)
{
	var netvest_subsc  = Subscription(db,
	{
		premium:
		{
			features: ['multiple_investors']
		},
		trial:
		{
			days: 30,
			once: true,
			features: ['multiple_investors']
		},
		promo:
		{
			days: 30,
			once: true,
			features: ['multiple_investors']
		},
	})

	var promo = PromoCode(db)

	netvest_subsc.code = function (code, user_id)
	{
		return promo.isValid(code)
		.then((item) =>
		{
			netvest_subsc.activate(item.type, user_id)
		})
	}

	return netvest_subsc
}
