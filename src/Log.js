
var format = require('util').format
var moment = require('moment')

module.exports = function Log (stream)
{
	stream || (stream = process.stdout)

	var log = function log ()
	{
		var str = format.apply(null, arguments)

		str = pad(str)

		str = clockline() + nl + str + nl

		stream.write(str)
	}

	function clockline ()
	{
		return '⌚ ' + timemark()
	}

	function timemark ()
	{
		return moment().format('HH:mm | D.MMM')
	}

	var nl = '\n'

	return log
}

function pad (str)
{
	return str.split('\n').map(line => '  ' + line).join('\n')
}
