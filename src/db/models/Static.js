
var uid = require('shortid').generate
var promisify = require('promisify-node')
var mkdirp = promisify(require('mkdirp'))

var mime = require('mime')

var fs = require('fs')
var stat = promisify(fs.stat)
var unlink = promisify(fs.unlink)
var writeTo = require('fs').createWriteStream

var streamToPromise = require('stream-to-promise')

var Err = require('../../Err')

module.exports = function (rootpath)
{
	var static = {}
	var root_img = rootpath.partial('static/images')

	static.store = function (file)
	{
		return save_file(file)
	}

	var NotExists = Err('file_not_found', 'File not found')

	static.get = function (hash)
	{
		var path = path_by_hash(hash)
		var mimetype = mime.lookup(path)

		return exists(path)
		.then(exists =>
		{
			if (! exists)
			{
				throw NotExists()
			}
			else
			{
				return {
					type: mimetype,
					stream: fs.createReadStream(path)
				}
			}
		})
	}

	static.remove = function (hash)
	{
		return remove_file(hash)
	}

	static.getExt = function (mime)
	{
		return get_ext(mime)
	}

	function remove_file (hash)
	{
		if (! hash)
		{
			return new Promise(rs =>
			{
				return rs()
			})
		}

		var t = tuple(hash)
		var path = tuple_to_filename(t)

		return exists(path)
		.then(exists =>
		{
			if (exists)
			{
				return unlink(path)
			}
		})
	}

	var AlreadyExists = Err('file_already_exists', 'File already exists')
	var FileSavingErr = Err('file_saving_error', 'File Saving Error')

	function save_file (file)
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

	function path_by_hash (hash)
	{
		var t = tuple(hash)

		return tuple_to_filename(t)
	}

	function exists (path)
	{
		return stat(path)
		.then(() =>
		{
			return true
		})
		.catch(() =>
		{
			return false
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
			case 'image/jpg': return 'jpg'
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

	return static
}
