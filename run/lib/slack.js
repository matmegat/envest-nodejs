
var request = require('axios')
var format  = require('util').format

var uri =
'https://hooks.slack.com/services/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'

var slack = module.exports = function slack (text)
{
	return request.post(uri,
	{
		text: text
	})
}


slack.success = function (env, rev)
{
	var template = 'Backend *%s* успешно задеплоен, _rev: %s_'
	var text = format(template, ENV(env), rev)

	return slack(text)
}

slack.failure = function (env)
{
	var template = 'Backend *%s* ошибка деплоя'
	var text = format(template, ENV(env))

	return slack(text)
}

function ENV (env)
{
	return env.toUpperCase()
}
