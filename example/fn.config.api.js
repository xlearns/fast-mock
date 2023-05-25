module.exports = {
  "test": 'hello world',
  "test/t": {
    code: 200
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
      data: Array.from({ length: 100 }).map((item, index) => {
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

