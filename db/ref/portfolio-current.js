
module.exports = (base_table) =>
{
	return `CREATE VIEW portfolio_current
(
  investor_id,
  symbol_exchange,
  symbol_ticker,
  amount,
  price
)
AS SELECT
  investor_id,
  symbol_exchange,
  symbol_ticker,
  amount,
  price

FROM
  ${base_table} AS P

WHERE amount > 0
  AND timestamp =
  (
    SELECT MAX(timestamp) FROM ${base_table}
    WHERE investor_id     = P.investor_id
      AND symbol_exchange = P.symbol_exchange
      AND symbol_ticker   = P.symbol_ticker
  );
`
}
