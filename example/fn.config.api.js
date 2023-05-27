module.exports = {
  test: "hello world",
  custom: () => {
    return {
      data: (req, res) => {
        res.send("hello");
      },
    };
  },
  new: () => {
    return {
      data: {
        code: 200,
        msg: "hello world",
      },
    };
  },
  download: () => {
    return {
      type: "download",
      file: {
        url: "./example/fn.config.api.js",
        auto: false,
      },
    };
  },
  websocket: () => {
    return {
      type: "ws",
      data: {
        code: 200,
        msg: "websocket 测试",
      },
    };
  },
  "/api/list": {
    code: 200,
    message: "ok",
    list: Array.from({ length: 100 }).map((item, index) => {
      return {
        code: 200,
        data: index,
        message: "ok",
      };
    }),
  },
  api: () => {
    return {
      data: {
        status: 200,
        msg: "ok",
        list: Array.from({ length: 100 }).map((item, index) => {
          return {
            code: 200,
            data: index,
            message: "ok",
          };
        }),
      },
      pagination: {
        field: "data",
        pageKey: "page",
        limitation: "pageSize",
      },
    };
  },
};
