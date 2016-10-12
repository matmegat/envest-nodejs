CREATE TABLE portfolio
(
  investor_id INTEGER NOT NULL
    REFERENCES investors(user_id),

  symbol_exchange VARCHAR NOT NULL,
  symbol_ticker   VARCHAR NOT NULL,

  timestamp TIMESTAMP NOT NULL,

  amount REAL NOT NULL,
  price  REAL NOT NULL,

  CONSTRAINT prec_timed_portfolio_point_unique
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
  AND amount > 0
  AND timestamp =
  (
    SELECT MAX(timestamp) FROM portfolio
    WHERE investor_id     = P.investor_id
      AND symbol_exchange = P.symbol_exchange
      AND symbol_ticker   = P.symbol_ticker
    -- AND timestamp <= NOW()
  );
--

CREATE TABLE brokerage
(
  investor_id INTEGER NOT NULL
    REFERENCES investors(user_id),

  timestamp TIMESTAMP NOT NULL,

  cash DECIMAL(12, 2) NOT NULL,
  multiplier REAL NOT NULL,

  CONSTRAINT timed_brokerage_point_unique
    UNIQUE (investor_id, timestamp)
);

--
SELECT
  cash,
  multiplier

FROM brokerage AS B

WHERE investor_id = 120
  AND timestamp =
  (
    SELECT MAX(timestamp) FROM brokerage
    WHERE investor_id = B.investor_id
    -- AND timestamp <= NOW()
  );
--

-- grid
SELECT
  timestamp,
  date_trunc('day', timestamp) + INTERVAL '1 day' as day,
  -- CAST(date_trunc('day', timestamp) as DATE) as day,
  symbol_exchange,
  symbol_ticker,
  amount,
  price

FROM
  portfolio

WHERE
  investor_id = 120

ORDER BY
  timestamp;


SELECT
  timestamp,
  date_trunc('day', timestamp) + INTERVAL '1 day' as day,
  cash,
  multiplier

FROM
  brokerage

WHERE
  investor_id = 120

ORDER BY
  timestamp;
--
