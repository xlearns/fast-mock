module.exports = {
  "test": 'hello world',
  "websocket": {
    __data: {
      code: 200,
      msg: 'websocket 测试'
    },
    type: 'ws'
  },
  "/api/list": {
    code: 200,
    message: "ok",
    list: Array.from({ length: 100 }).map((item, index) => {
      return {
        code: 200,
        data: index,
        message: 'ok'
      }
    })
  },
  "api": {
    __data: {
      status: 200,
      msg: "ok",
      list: Array.from({ length: 100 }).map((item, index) => {
        return {
          code: 200,
          data: index,
          message: 'ok'
        }
      })
    },
    pagination: {
      field: 'data',
      pageKey: 'page',
      limitation: "pageSize"
    }
  }
}

