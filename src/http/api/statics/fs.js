
var uid = require('shortid').generate
var promisify = require('promisify-node')
var mkdirp = promisify(require('mkdirp'))

var writeTo = require('fs').createWriteStream

var fs = require('fs')
var stat = promisify(fs.stat)
var unlink = promisify(fs.unlink)

var streamToPromise = require('stream-to-promise')

module.exports = function (rootpath)
{
	var static_ctrl = {}
	var root_img = rootpath.partial('static/images/userpic')

	static_ctrl.remove = function (hash)
	{
		var t = tuple(hash)
		var path = tuple_to_filename(t)

		return stat(path)
		.then(() =>
		{
			return unlink(path)
		})
		.catch(() =>
		{
			return
		})
	}

	static_ctrl.save = function (file)
	{
		var hash = uid()
		var filename = get_filename(hash, file.mimetype)

		var t = tuple(filename)

		var dirname = tuple_to_dir(t)
		var filenameFull = tuple_to_filename(t)

		console.log(filenameFull)

		return mkdirp(dirname)
		.then(() =>
		{
			writeTo(filenameFull).end(file.buffer)

			return streamToPromise(writeTo).then(() =>
			{
				return filename
			})
		})
	}

	function tuple (filename)
	{
		return [
			filename.charAt(0),
			filename.charAt(1),
			filename.slice(2)
		]
	}

	function get_ext (mime)
	{
		switch (mime)
		{
			case 'image/png' : return  'png'
			case 'image/jpeg': return 'jpeg'
			default: return 'jpeg'
		}
	}

	function get_filename (id, mime)
	{
		var ext = get_ext(mime)

		return `${id}.${ext}`
	}

	function tuple_to_dir (tuple)
	{
		return root_img(tuple.slice(0, -1))
	}

	function tuple_to_filename (tuple)
	{
		return root_img(tuple)
	}

	return static_ctrl
}
