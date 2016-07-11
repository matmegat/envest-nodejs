
var expect = require('chai').expect

var Err = require('../../../Err')
var CannotGoPublic = Err('cannot_go_public',
	'Investor cannot be pushed to public')

var validate = require('../../validate')

var _ = require('lodash')

module.exports = function Onboarding (db, investor)
{
	var onb = {}

	onb.fields = {}

	onb.fields.profession = Profession(investor)
	onb.fields.focus = Focus(investor)
	onb.fields.background = Background(investor)
	onb.fields.hist_return = HistReturn(investor)
	onb.fields.brokerage = Brokerage(investor, db)
	onb.fields.holdings = Holdings(investor, db)
	onb.fields.start_date = StartDate(investor)

	expect(db, 'Onboarding depends on Admin').property('admin')
	var admin = db.admin

	expect(db, 'Onboarding depends on Notifications').property('notifications')
	var Emitter = db.notifications.Emitter

	var FieldEditedA = Emitter('field_edited', { group: 'admins' })
	var FieldEditedI = Emitter('field_edited')


	onb.update = function update (whom_id, investor_id, field, value)
	{
		whom_id = Number(whom_id)
		investor_id = Number(investor_id)

		return ensure_can_edit(whom_id, investor_id)
		.then(mode =>
		{
			if (! (field in onb.fields))
			{
				throw WrongField({ field: field })
			}

			return mode
		})
		.then(mode =>
		{
			field = onb.fields[field]

			return field.set(investor_id, value)
			.then(() => mode) /* pass mode */
		})
		.then(mode =>
		{
			if (mode === 'mode:investor')
			{
				FieldEditedA({ by: 'investor', investor_id: investor_id })
			}
			else
			{
				FieldEditedI(investor_id, { by: 'admin', admin_id: whom_id })
			}
		})
	}

	function ensure_can_edit (whom_id, investor_id)
	{
		return Promise.all([ admin.is(whom_id), investor.all.is(whom_id) ])
		.then(so =>
		{
			var is_admin    = so[0]
			var is_investor = so[1]

			if (is_admin)
			{
				return 'mode:admin'
			}
			else if (is_investor)
			{
				if (whom_id === investor_id)
				{
					return 'mode:investor'
				}
				else
				{
					throw CantEdit()
				}
			}
			else
			{
				throw CantEdit()
			}
		})
	}

	onb.pushLive = function pushLive (whom_id, investor_id)
	{
		return Promise.all(
		[
			investor.all.is(investor_id),
			investor.public.is(investor_id)
		])
		.then((so) =>
		{
			var is_investor = so[0]
			var is_public = so[1]

			if (! is_investor)
			{
				throw CannotGoPublic({ reason: 'Not an investor' })
			}

			if (is_public)
			{
				throw CannotGoPublic({ reason: 'Already public' })
			}

			return Promise.all(_.map(onb.fields, (field) =>
			{
				return field.verify(investor_id, field.key)
			}))
		})
		.then(() => db.user.infoById(investor_id))
		.then((user) =>
		{
			validate.name(user.first_name, 'first_name')
			validate.name(user.last_name, 'last_name')

			validate.email(user.email)

			validate.string(user.pic, 'pic')
			validate.empty(user.pic, 'pic')

			validate.string(user.investor.profile_pic, 'profile_pic')
			validate.empty(user.investor.profile_pic, 'profile_pic')

			return investor.setPublic(investor_id, true, 'user_id')
		})
		.catch((err) =>
		{
			if (Err.is(err) && err.code !== CannotGoPublic().code)
			{
				throw CannotGoPublic({ reason: err.message, data: err.data })
			}

			throw err
		})
		.then((investor_id) =>
		{
			PublicChanged(investor_id, { by: 'admin', admin_id: whom_id })
		})
	}

	var PublicChanged = Emitter('pushed_to_public')

	return onb
}


var WrongField = Err('wrong_field', 'Wrong Onboarding field')

var CantEdit = Err('cant_edit',
	'This user must be an admin or onboarded investor')

var Field = require('./Field')


var validateProfLength = validate.length(50)

function Profession (investor)
{
	return Field(investor,
	{
		key: 'profession',
		validate: (value) =>
		{
			validate.string(value, 'profession')
			validate.empty(value, 'profession')
			validateProfLength(value, 'profession')
			return value
		},
		set: (value, queryset) =>
		{
			return queryset.update({ profession: value })
		},
		verify: (value) => value !== null
	})
}


var validateFocLength = validate.length(3)
// eslint-disable-next-line id-length
var validateFocItemLength = validate.length(250)

function Focus (investor)
{
	return Field(investor,
	{
		key: 'focus',
		validate: (value) =>
		{
			validate.array(value, 'focus')
			validateFocLength(value, 'focus')
			/* validate each element of array */
			value.forEach((focus_item, i) =>
			{
				validate.string(focus_item, `focus[${i}]`)
				validate.empty(focus_item, `focus[${i}]`)
				validateFocItemLength(focus_item, `focus[${i}]`)
			})
			return value
		},
		set: (value, queryset) =>
		{
			return queryset.update({ focus: JSON.stringify(value) })
		},
		verify: (value) => value !== null
	})
}


var validateBackLength = validate.length(3000)

function Background (investor)
{
	return Field(investor,
	{
		key: 'background',
		validate: (value) =>
		{
			validate.string(value, 'background')
			validate.empty(value, 'background')
			validateBackLength(value, 'background')
			return value
		},
		set: (value, queryset) =>
		{
			return queryset.update({ background: value })
		},
		verify: (value) => value !== null
	})
}


var WrongHistFormat = Err('wrong_hist_return',
   'Wrong historical returns format')

var isInteger = require('lodash/isInteger')
var isFinite = require('lodash/isFinite')
var inRange = require('lodash/inRange')

function HistReturn (investor)
{
	function vrow (row)
	{
		expect(row).an('object')

		try
		{
			if (! isInteger(row.year)) throw new Error
			if (! inRange(1900, 2050)) throw new Error
		}
		catch (e)
		{
			throw WrongHistFormat({ field: 'hist_return', subfield: 'year' })
		}

		try
		{
			if (! isFinite(row.percentage)) throw new Error
		}
		catch (e)
		{
			throw WrongHistFormat({ field: 'hist_return', subfield: 'percentage' })
		}
	}

	return Field(investor,
	{
		key: 'historical_returns',
		validate: (value) =>
		{
			try
			{
				validate.array(value, 'hist_return')

				value.forEach(vrow)
			}
			catch (e)
			{
				if (Err.is(e))
				{
					throw e
				}
				else
				{
					throw WrongHistFormat({ field: 'hist_return' })
				}
			}

			return value
		},
		set: (value, queryset) =>
		{
			return queryset.update({ historical_returns: JSON.stringify(value) })
		},
		verify: (hist_returns) =>
		{
			var current_year = new Date().getFullYear()

			/* validate that previous year included into historical_returns */
			var last_year = _.find(hist_returns, { year: current_year - 1 })
			if (! last_year)
			{
				throw WrongHistFormat(
				{
					field: 'hist_return',
					subfield: 'year',
					reason: `${current_year - 1} not included`
				})
			}

			/* validate duplicates */
			var is_duplicates = ! _.chain(hist_returns)
			.countBy('year')
			.every(value => value === 1)
			.value()

			if (is_duplicates)
			{
				throw WrongHistFormat(
				{
					field: 'hist_return',
					subfield: 'year',
					reason: `Duplicates exists`
				})
			}

			/* validate gaps */
			var sorted_returns = _.orderBy(hist_returns, [ 'year', 'asc' ])
			for (var i = 1; i < sorted_returns.length; i ++)
			{
				if (sorted_returns[i].year - sorted_returns[i - 1].year !== 1)
				{
					throw WrongHistFormat(
					{
						field: 'hist_return',
						subfield: 'year',
						reason: `Gaps in filled years`
					})
				}
			}

			return true
		}
	})
}


// eslint-disable-next-line id-length
var WrongBrokerageFormat = Err('wrong_brokerage_format',
	'Wrong brokerage format')

function Brokerage (investor_model, db)
{
	return Field(investor_model,
	{
		key: null,
		validate: (value) =>
		{
			if (! isFinite(value) || value < 0)
			{
				throw WrongBrokerageFormat({ field: 'brokerage' })
			}

			return value
		},
		set: (value, investor_queryset, investor_id) =>
		{
			var portfolio = db.investor.portfolio

			return portfolio.setBrokerage(investor_id, value)
		},
		verify: (value, investor_id) =>
		{
			return db.investor.portfolio.full(investor_id)
			.then((portfolio) =>
			{
				if (! portfolio.brokerage)
				{
					throw CannotGoPublic({ reason: 'Brokerage does not exist' })
				}
				if (! portfolio.brokerage.amount < 0)
				{
					throw CannotGoPublic({ reason: 'Wrong brokerage amount' })
				}
				if (! portfolio.brokerage.multiplier < 0)
				{
					throw CannotGoPublic({ reason: 'Wrong brokerage multiplier' })
				}

				return true
			})
		}
	})
}


var WrongHoldingsFormat = Err('wrong_holdings_format',
	'Wrong Portfolio Holdings Format')

function Holdings (investor_model, db)
{
	function vrow (row, i)
	{
		expect(row).an('object')

		validate.required(row.symbol, `holdings[${i}].symbol`)
		validate.empty(row.symbol, `holdings[${i}].symbol`)

		validate.number(row.amount, `holdings[${i}].amount`)
		if (row.amount <= 0)
		{
			throw WrongHoldingsFormat({ field: `holdings[${i}].amount` })
		}

		validate.number(row.buy_price, `holdings[${i}].buy_price`)
		if (row.buy_price <= 0)
		{
			throw WrongHoldingsFormat({ field: `holdings[${i}].buy_price` })
		}
	}


	return Field(investor_model,
	{
		key: null,
		validate: (value) =>
		{
			try
			{
				validate.array(value, 'holdings')

				value.forEach(vrow)
			}
			catch (e)
			{
				if (Err.is(e))
				{
					throw e
				}
				else
				{
					throw WrongHoldingsFormat({ field: 'holdings' })
				}
			}

			return value
		},
		set: (value, investor_queryset, investor_id) =>
		{
			var portfolio = db.investor.portfolio

			return portfolio.setHoldings(investor_id, value)
		},
		verify: (value, investor_id) =>
		{
			return db.investor.portfolio.full(investor_id)
			.then((portfolio) =>
			{
				validate.array(portfolio.holdings, 'holdings')
				portfolio.holdings.forEach(vrow)

				return true
			})
		}
	})
}


var moment = require('moment')
var WrongStartDateFormat = Err('wrong_start_date_format',
	'Wrong start_date format. Not ISO-8601')

function StartDate (investor)
{
	return Field(investor,
	{
		key: 'start_date',
		validate: (value) =>
		{
			validate.string(value, 'start_date')
			validate.empty(value, 'start_date')

			var moment_date = moment(value)
			if (! moment_date.isValid())
			{
				throw WrongStartDateFormat()
			}

			return moment_date.format()
		},
		set: (value, queryset) =>
		{
			return queryset.update({ start_date: value })
		},
		verify: (value) => value !== null
	})
}
