/*
 * checks if tx is a knex transaction
 */

module.exports = (tx) =>
{
	return tx && Boolean(tx.transaction && tx.savepoint)
}
