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

**Developer**: Vlas Popov

* [message in Slack](https://weezlabs.slack.com/messages/@no8ody0ne/)
* [WeezLabs Jira](https://weezlabs.atlassian.net/wiki/display/~vlas)


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

## deploy
```sh
cd netvest-backend-dir
run/deploy --env=<env> --key=~/.ssh/WeezLabsDev.pem
```

## API
**Swagger** DOC: open in browser `/docs/`.

Backend instances:
* [dev /docs/](http://ec2-52-38-31-214.us-west-2.compute.amazonaws.com:8000/docs/)
* [test /docs/](http://ec2-52-38-31-214.us-west-2.compute.amazonaws.com:8080/docs/)
* [staging /docs/](http://ec2-52-38-31-214.us-west-2.compute.amazonaws.com/docs/)
