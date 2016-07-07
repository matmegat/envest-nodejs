
var expect = require('chai').expect

var Err = require('../../../Err')

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

			return investor.fullProfile(investor_id)
		})
		.then((investor_entry) =>
		{
			validate.name(investor_entry.first_name, 'first_name')
			validate.name(investor_entry.last_name, 'last_name')

			validate.email(investor_entry.email)

			validate.string(investor_entry.pic, 'pic')
			validate.empty(investor_entry.pic, 'pic')

			validate.string(investor.profile_pic, 'profile_pic')
			validate.empty(investor.profile_pic, 'profile_pic')

			/* validate historical_returns */
			validate__historical_returns(investor_entry.historical_returns)

			onb.fields.background.validate(investor_entry.background)

			onb.fields.focus.validate(investor_entry.focus)

			onb.fields.profession.validate(investor_entry.profession)

			return investor.portfolio.full(investor_id)
		})
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

	var CannotGoPublic = Err('cannot_go_public',
		'Investor cannot be pushed to public')

	var PublicChanged = Emitter('pushed_to_public')

	// eslint-disable-next-line id-length
	function validate__historical_returns (hist_returns)
	{
		var current_year = new Date().getFullYear()

		onb.fields.hist_return.validate(hist_returns)

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
	}

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
		}
	})
}


var validateFocLength = validate.length(3)
// eslint-disable-next-line id-length
var validateFocItemLength = validate.length(250)

function Focus (investor)
{
	return Field(investor,
	{
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
		}
	})
}


var validateBackLength = validate.length(3000)

function Background (investor)
{
	return Field(investor,
	{
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
		}
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
		validate: (value) =>
		{
			if (! isFinite(value) || value < 0)
			{
				throw WrongBrokerageFormat({ field: 'brokerage' })
			}

			return value
		},
		set: (value, investor_queryset) =>
		{
			var portfolio = db.investor.portfolio

			return investor_queryset
			.select('user_id')
			.then(db.helpers.one)
			.then((investor) =>
			{
				return portfolio.setBrokerage(investor.user_id, value)
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
		set: (value, investor_queryset) =>
		{
			var portfolio = db.investor.portfolio

			return investor_queryset
			.select('user_id')
			.then(db.helpers.one)
			.then((investor) =>
			{
				return portfolio.setHoldings(investor.user_id, value)
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
		}
	})
}
