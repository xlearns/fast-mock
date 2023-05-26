#!/usr/bin/env node

const path = require("path");
const chalk = require('chalk');
const fs = require("fs");
const express = require("express");
const expressWs = require('express-ws')
const app = express();
const root = process.cwd();
const configPath = path.resolve(root, "fn.config.js");
const apiPath = path.resolve(root, "fn.config.api.js");
const bodyParser = require("body-parser");

let dataStore = {}

app.use(bodyParser.urlencoded({ extended: true }));

expressWs(app);

const defaultConfig = {
  port: 7001,
};

const defineApi = {
  type: "rest",
  data: [],
  custom: "",
  pagination: {
    field: "list",
    enable: true,
    pageKey: "page",
    limitation: "limit",
  },
};

function init(first) {
  if (fs.existsSync(apiPath)) {
    const api = require(apiPath);
    if (fs.existsSync(configPath)) {
      const config = require(configPath);
      start({ config, api, first });
    } else {
      start({ api, first });
    }
  } else {
    console.log(chalk.red("Please provide the fn.config.api.js file."));
  }
}

init(true);

fs.watch(apiPath, () => {
  console.log(chalk.blue(`The API file ${apiPath} has changed, reloading..`));
  delete require.cache[require.resolve(apiPath)];
  init();
});

function throttle(func, wait) {
  let timer = null;
  return function (...args) {
    if (!timer) {
      timer = setTimeout(() => {
        func.apply(this, args);
        timer = null;
      }, wait);
    }
  };
}

function start({ config, api, first }) {
  const _config = Object.assign({}, defaultConfig, config);
  server({ config: _config, api, first });
}

function server(conf) {
  const { config, api, first } = conf;
  const { port } = config;

  app.use(express.json());

  Object.entries(api).forEach(([key, val]) => {
    createApi(key, val);
  });

  if (!first) return
  app.listen(port, () => {
    console.log(chalk.blue(`Server listening at http://localhost:${port}`));
  });
}

function formatUrl(url) {
  if (url.startsWith("/")) url = url.substr(1);
  return url;
}

function formatData(val) {
  let res;
  if (typeof val == "object" && val != null) {
    const omit = val?.__data;
    if (!omit) {
      res = {
        data: val,
      };
    } else {
      const obj = {};
      for (let key in val) {
        if (key == "__data") {
          obj["data"] = omit;
        } else {
          obj[key] = val[key];
        }
      }
      res = obj;
    }
  } else {
    res = {
      data: val,
    };
  }
  return res;
}

function createApi(key, val) {
  const _val = formatData(val);
  const { data, pagination, type } = merge(defineApi, _val);
  const url = `/${formatUrl(key)}`;
  switch (type) {
    case "rest":
      createRest({ key, url, data, pagination });
      break;
    case "ws":
      createWs({ key, url, data, pagination });
      break;
    case "download":
      break;
  }
}

function isObject(obj) {
  return typeof obj == "object" && obj != null;
}

function paginAction(data, { page, limit }, config) {
  const _isObject = isObject(data);
  let res = _isObject ? Object.assign({}, data) : data;
  const { field, enable } = config;
  if (enable) {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    if (_isObject) {
      if (Array.isArray(data)) {
        res[field] = data.slice(startIndex, endIndex);
      } else {
        if (Array.isArray(data[field])) {
          res[field] = data[field].slice(startIndex, endIndex);
        }
      }
    }
  }
  return res;
}

function createWs({ key, url, data, pagination }) {
  dataStore[key] = data;
  app.ws('/websocket', (ws, req) => {
    ws.send('Welcome to the WebSocket server!');

    ws.on('message', (msg) => {
      console.log(`Received message: ${msg}`);
      ws.send(msg);
    });
  });
}

function createRest({ key, url, data, pagination }) {
  dataStore[key] = data;
  app.get(url, (req, res) => {
    const { pageKey, limitation } = pagination;
    const page = req.query[pageKey] || 1;
    const limit = req.query[limitation] || 10;
    const msg = paginAction(dataStore[key], { page, limit }, pagination);
    res.set("Cache-Control", "no-store");
    res.send(msg);
  });

  app.post(url, (req, res) => {
    const { pageKey, limitation } = pagination;
    const { body, query } = req;
    const page = body[pageKey] || query[pageKey] || 1;
    const limit = body[limitation] || query[limitation] || 10;
    res.send(paginAction(dataStore[key], { page, limit }, pagination));
  });

  app.put(url, (req, res) => {
    //change json
    res.send(dataStore[key]);
  });

  app.delete(url, (req, res) => {
    // delete json
    res.send(dataStore[key]);
  });

  // app.get(`url/:id`, (req, res) => {
  //   const product = products.find(p => p.id === parseInt(req.params.id));
  //   if (!product) return res.status(404).send('Product not found');
  //   res.send(product);
  // });
}

function merge(obj1, obj2) {
  const mergedObj = Object.assign({}, obj1);
  for (let key in obj2) {
    const _obj = obj2[key];
    if (typeof _obj === "object" && _obj !== null && !Array.isArray(_obj)) {
      mergedObj[key] = merge(obj1[key], obj2[key]);
    } else {
      mergedObj[key] = _obj;
    }
  }
  return mergedObj;
}
