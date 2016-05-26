var userPic = '/api/static/pic/:hash'
var investorProfilePic = '/api/static/pic/:hash2'
/* TODO: fill with real links / hashes */

exports.up = function (knex, Promise)
{
	/*
	* Add column "pic" to users, with default url
	* Remove column "icon" from investors
	* Remove column "cover_image" of investors
	* Add "profile_image" to investors and set default url
	*   because of Error: table.renameColumn(...).defaultTo is not a function
	* ...
	* Update codebase to work with this stuff
	* */

	return Promise.resolve()
	.then(() =>
	{
		return knex.schema.table('users', (table) =>
		{
			table
			.text('pic')
			.defaultTo(userPic)
		})
	})
	.then(() =>
	{
		return knex.schema.table('investors', (table) =>
		{
			table.dropColumns('icon', 'cover_image')
			table.text('profile_image').defaultTo(investorProfilePic)
		})
	})
}

exports.down = function (knex, Promise)
{
	/*
	* Remove column "pic" from users
	* Add column "icon" to investors and set default url
	* Rename "profile_image" to "cover_image" and save default url
	* */
	return Promise.resolve()
	.then(() =>
	{
		return knex.schema.table('users', (table) =>
		{
			table.dropColumn('pic')
		})
	})
	.then(() =>
	{
		return knex.schema.table('investors', (table) =>
		{
			table.text('icon').defaultTo(userPic)
			table.renameColumn('profile_image', 'cover_image')
		})
	})
}
