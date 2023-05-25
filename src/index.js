#!/usr/bin/env node
const kill = require('kill-port');

const path = require('path')

const fs = require('fs')

const express = require('express');

const http = require('http');

const app = express();

const root = process.cwd()

const configPath = path.resolve(root, 'fn.config.js')

const apiPath = path.resolve(root, 'fn.config.api.js')

const bodyParser = require('body-parser');

const appServer = http.createServer(app);


let global_port

app.use(bodyParser.urlencoded({ extended: true }));

const defaultConfig = {
  port: 7001
}

const defineApi = {
  type: 'rest',
  data: [],
  custom: '',
  pagination: {
    field: 'list',
    enable: true,
    pageKey: 'page',
    limitation: "limit"
  }
}




function init() {
  if (fs.existsSync(apiPath)) {
    const api = require(apiPath)
    if (fs.existsSync(configPath)) {
      const config = require(configPath)
      start({ config, api })
    } else {
      start({ api })
    }
  } else {
    console.error('请提供fn.config.api.js文件')
  }
}


// fs.watch(apiPath, throttle(() => {
//   appServer.close(() => {
//     init()
//   })
// }), 100);


init()


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


function start({ config, api }) {
  const _config = Object.assign({}, defaultConfig, config)
  server({ config: _config, api })
}


function server(conf) {
  const { config, api } = conf
  const { port } = config;

  app.use(express.json());

  Object.entries(api).forEach(([key, val]) => {
    createApi(key, val)
  })

  global_port = port
  appServer.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}

function formatUrl(url) {
  if (url.startsWith('/'))
    url = url.substr(1);
  return url;
}

function formatData(val) {
  let res
  if (typeof val == 'object' && val != null) {
    const omit = val?.__data
    if (!omit) {
      res = {
        data: val
      }
    } else {
      const obj = {}
      for (let key in val) {
        if (key == '__data') {
          obj['data'] = omit
        } else {
          obj[key] = val[key]
        }
      }
      res = obj
    }
  } else {
    res = {
      data: val
    }
  }
  return res
}

function createApi(key, val) {
  const _val = formatData(val);
  const { data, pagination, type } = merge(defineApi, _val);
  const url = `/${formatUrl(key)}`;
  switch (type) {
    case 'rest':
      createRest({ key, url, data, pagination })
      break;
    case 'ws':

      break;
    case 'download':

      break;
  }

}

function isObject(obj) {
  return typeof obj == 'object' && obj != null
}


function paginAction(data, { page, limit }, config) {
  const _isObject = isObject(data);
  let res = _isObject ? Object.assign({}, data) : data
  const { field, enable } = config;
  if (enable) {
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    if (_isObject) {
      if (Array.isArray(data)) {
        res[field] = data.slice(startIndex, endIndex)
      } else {
        if (Array.isArray(data[field])) {
          res[field] = data[field].slice(startIndex, endIndex)
        }
      }
    }
  }
  return res
}

function createRest({ key, url, data, pagination }) {
  app.get(url, (req, res) => {
    const { pageKey, limitation } = pagination
    const page = req.query[pageKey] || 1
    const limit = req.query[limitation] || 10
    res.send(paginAction(data, { page, limit }, pagination));
  });

  app.post(url, (req, res) => {
    const { pageKey, limitation } = pagination
    const { body, query } = req;
    const page = body[pageKey] || query[pageKey] || 1
    const limit = body[limitation] || query[limitation] || 10
    res.send(paginAction(data, { page, limit }, pagination));
  });

  app.put(url, (req, res) => {
    res.send(data);
  });

  app.delete(url, (req, res) => {
    res.send(data);
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
    const _obj = obj2[key]
    if (typeof _obj === 'object' && _obj !== null && !Array.isArray(_obj)) {
      mergedObj[key] = merge(obj1[key], obj2[key]);
    } else {
      mergedObj[key] = _obj;
    }
  }
  return mergedObj;
};
