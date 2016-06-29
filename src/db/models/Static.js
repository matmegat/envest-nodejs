
var uid = require('shortid').generate
var promisify = require('promisify-node')
var mkdirp = promisify(require('mkdirp'))

var mime = require('mime')

var fs = require('fs')
var stat = promisify(fs.stat)
var unlink = promisify(fs.unlink)
var writeTo = require('fs').createWriteStream

var Err = require('../../Err')

module.exports = function (rootpath)
{
	var static = {}
	var root_img = rootpath.partial('static/images')


	var AlreadyExists = Err('file_already_exists', 'File already exists')
	var FileSavingErr = Err('file_saving_error', 'File Saving Error')

	static.store = function (file)
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
			return new Promise(rs =>
			{
				writeTo(filenameFull).end(file.buffer, () =>
				{
					return rs(filename)
				})
			})
		})
	}


	var NotExists = Err('file_not_found', 'File not found')

	static.get = function (hash)
	{
		var path = path_by_hash(hash)

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
					type: mime.lookup(path),
					stream: fs.createReadStream(path)
				}
			}
		})
	}


	static.remove = function (hash)
	{
		if (! hash)
		{
			return Promise.resolve()
		}

		var path = path_by_hash(hash)

		return exists(path)
		.then(exists =>
		{
			if (exists)
			{
				return unlink(path)
			}
		})
	}


	function get_filename (id, type)
	{
		var ext = mime.extension(type)

		return `${id}.${ext}`
	}

	function tuple (filename)
	{
		return [
			filename.charAt(0),
			filename.charAt(1),
			filename.slice(2)
		]
	}

	function tuple_to_dir (tuple)
	{
		return root_img(tuple.slice(0, -1))
	}

	function tuple_to_filename (tuple)
	{
		return root_img(tuple)
	}

	function path_by_hash (hash)
	{
		var t = tuple(hash)

		return tuple_to_filename(t)
	}

	function exists (path)
	{
		return stat(path)
		.then(() => true, () => false)
	}

	return static
}
