# config

`config.json` is a base config. You can add `dev.json` config with the same structure as base
but with all fields optional, to setup your dev exceptions (like different DB port).

```json
{
  "pg":
  {
    "port":  5433,
    "password": "secret"
  }
}
```
