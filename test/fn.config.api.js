module.exports = {
  test: "你好世界",
  api: {
    code: 200,
    msg: "ok",
    list: Array.from({ length: 100 }).map((item, index) => {
      return {
        id: index + 1,
      };
    }),
  },
};
