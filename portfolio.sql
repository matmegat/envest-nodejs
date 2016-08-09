CREATE TABLE portfolio
(
  investor_id INTEGER NOT NULL
    REFERENCES investors(user_id),

  symbol_exchange VARCHAR NOT NULL,
  symbol_ticker   VARCHAR NOT NULL,

  timestamp TIMESTAMP NOT NULL,

  amount INTEGER NOT NULL,
  price  DECIMAL(10, 2) NOT NULL,

  CONSTRAINT timed_portfolio_symbol_unique
    UNIQUE (investor_id, symbol_exchange, symbol_ticker, timestamp)
);

--CREATE INDEX portfolio_symbol_unique ON portfolio
--  (investor_id, symbol_exchange, symbol_ticker);

--
SELECT
  symbol_exchange,
  symbol_ticker,
  amount,
  price

FROM
  portfolio AS P

WHERE investor_id = 120
  AND timestamp =
  (
    SELECT MAX(timestamp) FROM portfolio
    WHERE investor_id     = P.investor_id
      AND symbol_exchange = P.symbol_exchange
      AND symbol_ticker   = P.symbol_ticker
    -- AND timestamp <= NOW()
  );
--
