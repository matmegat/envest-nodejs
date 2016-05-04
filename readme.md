# NetVest Backend

> Node.js

**Lead**: Ivan Puhtin

* [message in Slack](https://weezlabs.slack.com/messages/@strider/)
* [WeezLabs Jira](https://weezlabs.atlassian.net/wiki/display/~teamfortresslife)

**Developer**: Valentin Zlydnev

* [message in Slack](https://weezlabs.slack.com/messages/@jettary/)
* [WeezLabs Jira](https://weezlabs.atlassian.net/wiki/display/~vzlydnev)

**Developer**: Artem Tumin

* [message in Slack](https://weezlabs.slack.com/messages/@artem/)
* [WeezLabs Jira](https://weezlabs.atlassian.net/wiki/display/~arttumin)


## npm scripts
`npm run <script>` to run a script.

* `start-node` — start bare node server process
* `dev` — start development server with auto-reload
* `start` — start server with monitor
* `stop` — stop monitored server
* `restart` — stop if any, then start
* `st` — check styles against js-outlander style
* `db-migrate` — migrates local DB on latest revision
* `db-rollback` — rollbacks local DB last migration group
* `swagger` — open swagger GUI with docs
* `swagger-ver` — verify/validate swagger manifest

## deploy
```sh
cd netvest-backend-dir
run/deploy --env=<env> --key=~/.ssh/WeezLabsDev.pem
```

## API
```
GET  - /api/feed/latest
POST - /api/auth/register - { "full_name": "Alex Grind", "email": "test@mail.ru", "password": "dummy-pass" }
POST - /api/auth/login - POST { "email": "test@mail.ru", "password": "dummy-pass" }
GET  - /api/auth/logout
```
