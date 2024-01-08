const Router = require("koa-router");
const userctrl = require("../controllers/common");

let routes = new Router();

routes
  .get("/", (ctx) => {
    ctx.body = "welcome!";
  })
  .get("/feed/getRes", userctrl.getRes)
  .post("/feed/getFeed", userctrl.getFeed);

module.exports = routes;
