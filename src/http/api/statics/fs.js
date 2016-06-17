
var uid = require('shortid').generate
var promisify = require('promisify-node')
var mkdirp = promisify(require('mkdirp'))

var writeTo = require('fs').createWriteStream

var fs = require('fs')
var stat = promisify(fs.stat)
var unlink = promisify(fs.unlink)

var streamToPromise = require('stream-to-promise')

var Err = require('../../../Err')

module.exports = function (rootpath)
{
	var static = {}
	var root_img = rootpath.partial('static/images/userpic')

	static.remove = function (hash)
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

	var AlreadyExists = Err('file_already_exists', 'File already exists')
	var FileSavingErr = Err('file_saving_error', 'File Saving Error')

	static.save = function (file)
	{
		var hash = uid()
		var filename = get_filename(hash, file.mimetype)

		var t = tuple(filename)

		var dirname = tuple_to_dir(t)
		var filenameFull = tuple_to_filename(t)

		return stat(filenameFull)
		.then(() =>
		{
			throw AlreadyExists()
		})
		.catch(err =>
		{
			if (err.code === 'ENOENT')
			{
				return mkdirp(dirname)
			}
			else
			{
				throw FileSavingErr(err)
			}
		})
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

	static.get_ext = function (mime)
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
		var ext = static.get_ext(mime)

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

	return static
}
