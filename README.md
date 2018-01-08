## Journal

> A simple Journaling app.

Built with Mithril, Ramda & Bootstrap.
Uses `parceljs` & `json-server` to serve the app and store your notes.

### Install

You should have a recent version of node on your machine, along with json-server & parceljs.

To install parcel bundler, use:

```sh
npm install -g parcel-bundler
```

For json-server installation, use:

```sh
npm install -g json-server
```

### Run

From one terminal, serve the data files `data/db.json`

```sh
json-server -w data/db.json
```

From another terminal, run:

```sh
parcel index.html
````

to serve the app at http://localhost:1234
