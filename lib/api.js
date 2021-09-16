const { config } = require("./config");
const { JSDOM } = require("jsdom");
const currency = require("currency.js");
const got = require("got");

const api = got.extend({
  resolveBodyOnly: true,
});

module.exports = {
  listProducts,
};

async function listProducts() {
  var results = {};
  for (const p in config.get("products")) {
    let result = await api.get(config.get("products")[p]);
    let dom = new JSDOM(result);
    let title = JSON.parse(
      dom.window.document.querySelector("[type='application/ld+json']")
        .textContent
    )["name"];
    for (let i = 10; i <= 12; i++) {
      let desc = dom.window.document.querySelector(`[data-qa='${i}']`);
      if (desc) {
        let condition = desc.firstChild.children[0].textContent.replace(
          /\s/g,
          ""
        );
        let name = `${title} (${condition})`;
        results[name] = {
          price: currency(desc.firstChild.children[1].textContent),
          url: `${result.url}#l=${i}`,
          name: name,
        };
      }
    }
  }
  return results;
}
