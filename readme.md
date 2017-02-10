# EnVest Backend

## npm scripts
`npm run <script>` to run a script.

* `start-node` — start bare node server process
* `dev` — start development server with auto-reload
* `start` — start server with monitor
* `stop` — stop monitored server
* `st` — check styles against js-outlander style
* `db-migrate` — migrates local DB on latest revision
* `db-rollback` — rollbacks local DB last migrations batch

## deploy

**push & run**:
To push and run backend `deploy` must be used.
```sh
cd envest-nodejs
run/deploy --env=<env> --key={pemfile}
```

**migrate**:
To migrate database use npm scripts.
```sh
npm run db-migrate # runs a batch of new migrations
npm run db-rollback # CAREFUL; rollbacks last batch
```

### backup
To snap backup to current machine use `backup` script:
```sh
run/backup --env=<env> --key={pemfile}
```
Backup will be stored in local project's `backup/` dir.


## API
**Swagger** DOC: open in browser `/docs/`.
