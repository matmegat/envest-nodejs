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
* `st` — check styles against js-outlander style
* `db-migrate` — migrates local DB on latest revision
* `db-rollback` — rollbacks local DB last migrations batch

## deploy

**push & run**:
To push and run backend `deploy` must be used.
```sh
cd netvest-backend-dir
run/deploy --env=<env> --key=~/.ssh/WeezLabsDev.pem
```

**migrate**:
To migrate database use npm scripts.
```sh
npm run db-migrate # runs a batch of new migrations
npm run db-rollback # CAREFUL; rollbacks last batch
```


## API
**Swagger** DOC: open in browser `/docs/`.

Backend instances:
* [dev /docs/](http://ec2-35-161-140-145.us-west-2.compute.amazonaws.com:8000/docs/)
* [test /docs/](http://ec2-35-161-140-145.us-west-2.compute.amazonaws.com:8080/docs/)
* [staging /docs/](http://ec2-35-161-140-145.us-west-2.compute.amazonaws.com/docs/)
