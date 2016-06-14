
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
			case 'image/png' : return  'png';
			case 'image/jpeg': return 'jpeg';
		}
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

	fs.save = function (file)
	{
		console.log(file)

		var id = fs.id()
		var tuple = fs.tuple(id)
		var ext = fs.ext(file.mimetype)
		var dirname = tuple_to_dir(tuple)
		var filename = `${tuple[2]}.${ext}`
		var filenameFull = `${dirname}/${filename}`

		return mkdirp(dirname)
		.then(() =>
		{
			console.log('Folder created: ')
			console.log(`id: ${id}, ext: ${ext}, dirname: ${dirname}, filename: ${filename}, filenameFull: ${filenameFull}`)
			writeTo(filenameFull).end(file.buffer)
		})
	}

	return fs
}