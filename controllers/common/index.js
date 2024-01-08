const httpCode = require("../../utils/httpCode");
const code_body = new httpCode();
const query = require("../../db");
const jwt = require("jsonwebtoken");
const path = require("path");
const serve_key = "iDark";
// 使用nanioid生成唯一id
const { nanoid } = require("nanoid");
const url = require("url");

function findOptimalRatio(materials, requiredEnergy, requiredCa, requiredP) {
  let optimalRatio = null;
  let minPrice = Infinity;
  const totalMaterials = materials.length;

  function calculatePriceAndRatio(combination) {
    let energy = 0,
      ca = 0,
      p = 0,
      price = 0;
    for (let i = 0; i < totalMaterials; i++) {
      energy += combination[i] * parseFloat(materials[i].energy);
      ca += combination[i] * parseFloat(materials[i].ca);
      p += combination[i] * parseFloat(materials[i].p);
      price += combination[i] * parseFloat(materials[i].price);
    }
    return { energy, ca, p, price };
  }

  function isWithinLimits(combination) {
    for (let i = 0; i < totalMaterials; i++) {
      const percent = combination[i] / 100;
      if (
        percent * 100 < materials[i].lower_limit ||
        percent * 100 > materials[i].upper_limit
      ) {
        return false;
      }
    }
    return true;
  }

  function findCombinations(total, currentCombination, depth) {
    if (depth === totalMaterials) {
      if (
        currentCombination.reduce((a, b) => a + b, 0) === 100 &&
        isWithinLimits(currentCombination)
      ) {
        const { energy, ca, p, price } =
          calculatePriceAndRatio(currentCombination);
        if (
          energy >= requiredEnergy * 100 &&
          ca >= requiredCa * 100 &&
          p >= requiredP * 100 &&
          price < minPrice
        ) {
          minPrice = price;
          optimalRatio = {};
          for (let i = 0; i < totalMaterials; i++) {
            optimalRatio[materials[i].name] = currentCombination[i] / 100;
          }
        }
      }
      return;
    }

    for (let i = 0; i <= total; i++) {
      currentCombination[depth] = i;
      findCombinations(total - i, currentCombination.slice(), depth + 1);
    }
  }

  findCombinations(100, Array(totalMaterials).fill(0), 0);

  return { optimalRatio, minPrice };
}

module.exports = {
  // 获取feed
  async getFeed(ctx) {
    // 获取原始数据
    const material = ctx.request.body;
    // ctx.body = code_body.success({
    //   material,
    // });
    // 将之前的数据库清空;
    await query(`delete from feed`, "");
    // 将material数据存到数据库中
    for (let i = 0; i < material.length; i++) {
      const item = material[i];
      const id = nanoid();
      const { name, energy, ca, p, upper_limit, lower_limit, price } = item;
      const sql = `insert into feed (id,name,energy,ca,p,lower_limit,upper_limit,price) values ('${id}', '${name}', '${energy}', '${ca}',   '${p}', '${lower_limit}', '${upper_limit}', '${price}')`;
      ctx.status = 200;
      await query(sql, "");
    }
  },
  // 获取res
  async getRes(ctx) {
    // 从数据库中获取材料数据
    const feeds = await query(`select * from feed`, "");
    const feedsArr = [];
    for (const feed in feeds) {
      feedsArr.push(feed);
    }
    // 获取需求数据
    const {
      energy: needEnergy,
      ca: needCa,
      p: needP,
    } = url.parse(ctx.request.url, true).query;

    // 开始计算
    const res = findOptimalRatio(feeds, needEnergy, needCa, needP);

    ctx.body = code_body.success({
      ...res,
    });
  },
};
