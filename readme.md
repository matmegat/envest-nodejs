# NetVest Backend

> Node.js

Maintainer: Ivan Puhtin

* [message in Slack](https://weezlabs.slack.com/messages/@strider/)
* [WeezLabs Jira](https://weezlabs.atlassian.net/secure/ViewProfile.jspa?name=teamfortresslife)

## npm scripts
`npm run <script>` to run a script.

* `start` — start bare server process
* `dev` — start development server with auto-reload
* `st` — check styles against js-outlander style
* `db-migrate` — migrates local DB on latest revision
* `db-rollback` — rollbacks local DB last migration group

## deploy
```sh
cd netvest-backend-dir
npm install --production --no-optional
npm start
```

## API stub
```sh
curl localhost:8080/api/feed/latest
```
