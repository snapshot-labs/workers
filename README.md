# Workers

To run workers in your local machine, run following commands:

#### Install Wrangler

```
npm i @cloudflare/wrangler -g
```

#### Dev command

Before running the dev command make sure to change entry point in `package.json` to the worker you want to test

```
"main": "mirror.js",
```
Workers currently available in this repo:
`mirror.js` and `node.js`

```
wrangler dev
```


Further documentation for local debugging can be found [here](https://developers.cloudflare.com/workers/learning/debugging-workers#local-testing-with-wrangler-dev).

