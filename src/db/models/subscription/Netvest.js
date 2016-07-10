
var Subscription   = require('./Subscription')

module.exports = function NetvestSubsc (db)
{
	var netvest_subsc = {}

	var subsc = Subscription(db,
	{
		premium: ['multiple_investors'],
		trial: ['multiple_investors'],
		promo: ['multiple_investors']
	})

	netvest_subsc.premium = subsc.activate('premium')
	netvest_subsc.trial   = subsc.onceActivate('trial', 30)
	netvest_subsc.promo   = subsc.onceActivate('promo', 30)

	netvest_subsc.isAble = subsc.isAble

	return netvest_subsc
}
