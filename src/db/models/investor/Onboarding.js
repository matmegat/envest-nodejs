
var expect = require('chai').expect

var Err = require('../../../Err')
var CannotGoPublic = Err('cannot_go_public',
	'Investor cannot be pushed to public')

var validate = require('../../validate')

var _ = require('lodash')
var moment = require('moment')

module.exports = function Onboarding (db, investor)
{
	var onb = {}

	onb.fields = {}

	onb.fields.profession = Profession(investor)
	onb.fields.focus = Focus(investor)
	onb.fields.education = Education(investor)
	onb.fields.background = Background(investor)
	onb.fields.hist_return = HistReturn(investor)
	onb.fields.annual_return = AnnualReturn(investor)
	onb.fields.brokerage = Brokerage(investor, db)
	onb.fields.holdings = Holdings(investor, db)
	onb.fields.is_public = IsPublic(investor)

	expect(db, 'Onboarding depends on Notifications').property('notifications')
	var Emitter = db.notifications.Emitter

	var FieldEditedA = Emitter('field_edited', { group: 'admins' })
	var FieldEditedI = Emitter('field_edited')


	onb.update = function update (whom_id, investor_id, field, value)
	{
		whom_id = Number(whom_id)
		investor_id = Number(investor_id)

		return investor.getActionMode(whom_id, investor_id)
		.then(mode =>
		{
			if (! mode)
			{
				throw CantEdit()
			}

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
				FieldEditedA({
					by: 'investor',
					investor: [ ':user-id', investor_id ]
				})
			}
			else
			{
				FieldEditedI(investor_id, {
					by: 'admin',
					admin: [ ':user-id', whom_id ]
				})
			}
		})
	}

	onb.goPublic = function pushLive (whom_id, investor_id)
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
				return field.verify(investor_id)
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
			return investor.updateStartDate(investor_id, 'user_id')
		})
		.then((investor_id) =>
		{
			PublicChanged(investor_id, {
				by: 'admin',
				admin: [ ':user-id', whom_id ]
			})
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

var one = require('../../helpers').one

function Profession (investor)
{
	return Field(investor,
	{
		get: (queryset) =>
		{
			return queryset
			.select('profession')
			.then(one)
			.then(rs => rs.profession)
		},
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
		get: (queryset) =>
		{
			return queryset
			.select('focus')
			.then(one)
			.then(rs => rs.focus)
		},
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

var validateEduLength = validate.length(3)
// eslint-disable-next-line id-length
var validateEduItemLength = validate.length(250)

function Education (investor)
{
	return Field(investor,
	{
		get: (queryset) =>
		{
			return queryset
			.select('education')
			.then(one)
			.then(rs => rs.education)
		},
		validate: (value) =>
		{
			validate.array(value, 'education')
			validateEduLength(value, 'education')
			/* validate each element of array */
			value.forEach((education_item, i) =>
			{
				validate.string(education_item, `education[${i}]`)
				validate.empty(education_item, `education[${i}]`)
				validateEduItemLength(education_item, `education[${i}]`)
			})
			return value
		},
		set: (value, queryset) =>
		{
			return queryset.update({ education: JSON.stringify(value) })
		}
	})
}

var validateBackLength = validate.length(3000)

function Background (investor)
{
	return Field(investor,
	{
		get: (queryset) =>
		{
			return queryset
			.select('background')
			.then(one)
			.then(rs => rs.background)
		},
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
		get: (queryset) =>
		{
			return queryset
			.select('historical_returns')
			.then(one)
			.then(rs => rs.historical_returns)
		},
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


function AnnualReturn (investor)
{
	return Field(investor,
	{
		get: (queryset) =>
		{
			return queryset
			.select('annual_return')
			.then(one)
			.then(rs => rs.annual_return)
		},
		validate: (value) =>
		{
			validate.empty(value, 'annual_return')
			validate.number(value, 'annual_return')
			return value
		},
		set: (value, queryset) =>
		{
			return queryset.update({ annual_return: value })
		}
	})
}


// eslint-disable-next-line id-length
var WrongBrokerageFormat = Err('wrong_brokerage_format',
	'Wrong brokerage format')

function Brokerage (investor_model, db)
{
	var decimal = validate.number.decimal(10)

	return Field(investor_model,
	{
		get: (queryset, investor_id) =>
		{
			return db.investor.portfolio.brokerage.byId(investor_id)
			.then((value) =>
			{
				value.amount = value.cash
				value.date = moment.utc().format()

				return value
			})
		},
		validate: (value) =>
		{
			validate.required(value.amount, 'brokerage.amount')
			validate.required(value.date, 'brokerage.date')

			decimal(value.amount, 'brokerage.amount')

			if (value.amount < 0)
			{
				throw WrongBrokerageFormat({ field: 'brokerage.amount' })
			}

			validate.date(value.date, 'brokerage.date')

			if (moment.utc(value.date) > moment.utc())
			{
				throw WrongBrokerageFormat({ field: 'brokerage.date' })
			}

			return value
		},
		set: (value, investor_queryset, investor_id) =>
		{
			var portfolio = db.investor.portfolio

			return portfolio.brokerage.set(investor_id, value.amount, value.date)
		},
		verify: (value) =>
		{
			if (value.cash < 0)
			{
				throw CannotGoPublic({ reason: 'Wrong brokerage amount' })
			}
			if (value.multiplier < 0)
			{
				throw CannotGoPublic({ reason: 'Wrong brokerage multiplier' })
			}

			return true
		}
	})
}


var WrongHoldingsFormat = Err('wrong_holdings_format',
	'Wrong Portfolio Holdings Format')

function Holdings (investor_model, db)
{
	var decimal = validate.number.decimal(10)

	function vrow (row, i)
	{
		expect(row).an('object')

		validate.required(row.symbol, `holdings[${i}].symbol`)
		validate.empty(row.symbol, `holdings[${i}].symbol`)

		validate.number(row.amount, `holdings[${i}].amount`)
		if (row.amount < 0)
		{
			throw WrongHoldingsFormat({ field: `holdings[${i}].amount` })
		}

		decimal(row.price, `holdings[${i}].price`)
		if (row.price <= 0)
		{
			throw WrongHoldingsFormat({ field: `holdings[${i}].price` })
		}

		validate.required(row.date, `holdings[${i}].date`)
		validate.date(row.date, `holdings[${i}].date`)
		if (moment.utc(row.date) > moment.utc())
		{
			throw WrongHoldingsFormat({ field: `holdings[${i}].date` })
		}
	}


	return Field(investor_model,
	{
		get: (queryset, investor_id) =>
		{
			return db.investor.portfolio.holdings.byId(investor_id)
			.then(holdings =>
			{
				var now = moment.utc().format()

				holdings.forEach((holding) =>
				{
					holding.symbol
					 = `${holding.symbol_ticker}.${holding.symbol_exchange}`
					holding.date = now
				})

				return holdings
			})
		},
		validate: (value, investor_id) =>
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

			return db.investor.portfolio.availableDate(investor_id)
			.then((min_date) =>
			{
				if (min_date === null)
				{
					min_date = moment.utc(0)
				}

				value.forEach((row, i) =>
				{
					if (moment.utc(row.date) < min_date)
					{
						throw WrongHoldingsFormat({ field: `holdings[${i}].date` })
					}
				})

				return value
			})
		},
		set: (value, investor_queryset, investor_id) =>
		{
			var portfolio = db.investor.portfolio

			return portfolio.holdings.set(investor_id, value)
		}
	})
}


var CannotSetPrivate = Err('cannot_set_private',
	`Cannot set Investor to private`)

function IsPublic (investor)
{
	return Field(investor,
	{
		get: (queryset) =>
		{
			return queryset
			.select('is_public')
			.then(one)
			.then(rs => rs.is_public)
		},
		validate: (value) =>
		{
			validate.boolean.false(value, 'is_public')

			return value
		},
		set: (value, queryset, investor_id) =>
		{
			return investor.featured.is(investor_id)
			.then(so =>
			{
				if (so)
				{
					throw CannotSetPrivate({ reason: 'Investor is featured' })
				}

				return queryset.update('is_public', value)
			})
		}
	})
}
