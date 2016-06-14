
var uid = require('shortid').generate
var promisify = require('promisify-node')
var mkdirp = promisify(require('mkdirp'))

var writeTo = require('fs').createWriteStream

module.exports = function(rootpath)
{
	var fs = {}
	var imgFolder = rootpath('static/images/userpic')

	fs.id = function ()
	{
		return uid()
	}

	fs.ext = function (mime)
	{
		switch (mime)
		{
			case 'image/png' : return  'png'
			case 'image/jpeg': return 'jpeg'
			default: return 'jpeg'
		}
	}

	fs.getFilename = function (id, mime)
	{
		var ext = fs.ext(mime)

		return `${id}.${ext}`
	}

	fs.tuple = function (filename)
	{
		return [
			filename.charAt(0),
			filename.charAt(1),
			filename.slice(2)
		]
	}

	function tuple_to_dir (tuple)
	{
		return rootpath(imgFolder, tuple[0], tuple[1])
	}

	function tuple_to_filename (tuple)
	{
		return rootpath(imgFolder, tuple[0], tuple[1], tuple[2])
	}

	fs.save = function (file)
	{
		console.log(file)

		var id = fs.id()
		var filename = fs.getFilename(id, file.mimetype)

		var tuple = fs.tuple(filename)

		var dirname = tuple_to_dir(tuple)
		var filenameFull = tuple_to_filename(tuple)

		return mkdirp(dirname)
		.then(() =>
		{
			console.log('Folder created: ')
			console.log(`id: ${id}, dirname: ${dirname}, filename: ${filename}, filenameFull: ${filenameFull}`)
			writeTo(filenameFull).end(file.buffer)
		})
	}

	return fs
}