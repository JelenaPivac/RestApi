const classes=require('./Classes');
const serialization = require("./Serialization");
const fetch = require("node-fetch")
let categories = [];
categories = serialization.Load("categories.txt");


let to = "";
let priceMultiplier = 1;

function listenForCreateRequest(app) {
  app.post("/categories/create", (req, res) => {
    const body = req.body;

    let newCategory = classes.Category.FromJson(req.body);
    if (newCategory.parent_id == newCategory.id) {
      res.send({
        stats: 400,
        response: "ID and parent_id cannot be the same",
      });
    }
    for (let i = 0; i < categories.length;i++) {
      let existingCategory = classes.Category.FromJson(categories[i]);
      if (existingCategory.id == newCategory.id) {
        res.send({
          stats: 400,
          response: "ID already exists in the database",
        });
        return;
      }
    }
    let canAdd = false;
    if (newCategory.parent_id != -1) {
      for (let i = 0; i < categories.length; i++) {
        if (newCategory.parent_id == categories[i].id) {
          canAdd = true;
          break;
        }
      }
    } else {
      canAdd = true;
    }
    if (canAdd) {
      categories.push(req.body);
      serialization.Save("categories.txt", categories);
      res.send({
        status: 200,
        response: "Category added to the database",
      });
    } else {
      res.send({
        status: 400,
        response:
          "A category must either be parent or have parent category. Parent categories don't have parents",
      });
    }
  });
}

function listenForCurrencyChangeRequest(app) {
  app.get("/priceChange", (req, res) => {
    ChangePrice(req, res);
  });
}

async function ChangePrice(req, res) {
  let query = req.query;
  to = query.to;
  let price = await GetCurrency(to);

  if (price == -1) {
    res.send({
      status: 400,
      response: "Invalid currency",
    });
  } else {
    priceMultiplier = price;
    res.send({
      status: 200,
      response: "Price changed to " + to,
    });
  }
}
function listenForListRequest(app) {
  app.get("/categories/list", (req, res) => {
    
    let pricedCategories = categories.slice();

    for (let j = 0; j < pricedCategories.length; j++) {
      pricedCategories[j].price = pricedCategories[j].price * priceMultiplier;
      pricedCategories[j].price = Math.round(pricedCategories[j].price*100)/100; 
    }
    
    res.send({
      status: 200,
      categories: pricedCategories,
    });
  });
}

function listenForUpdateRequest(app) {
  app.post("/categories/update/:id", (req, res) => {
    const { id } = req.params;
    const body = req.body;
    for (let i = 0; i < categories.length; ++i) {
      let existingCategory = classes.Category.FromJson(categories[i]);
      if (existingCategory.id == id) {
        Object.assign(existingCategory, req.body);
        existingCategory.id = id;
        if (existingCategory.parent_id == existingCategory.id) {
          res.send({
            stats: 400,
            response: "ID and parent_id cannot be the same",
          });
        }
        let canAdd = false;
        if (existingCategory.parent_id != -1) {
          for (let i = 0; i < categories.length; i++) {
            if (existingCategory.parent_id == categories[i].id) {
              canAdd = true;
              break;
            }
          }
        } else {
          canAdd = true;
        }
        if (canAdd) {
          categories[i] = existingCategory;
          serialization.Save("categories.txt", categories);
          res.send({
            status: 200,
            response:
              "Category with the ID " +
              existingCategory.id +
              " has been updated",
          });
        } else {
          res.send({
            status: 400,
            response:
              "A category must either be parent or have parent category. Parent categories don't have parents",
          });
        }
      }
    }
  });
}

function listenForDeleteRequest(app) {
  app.delete("/categories/delete/:id", (req, res) => {
    const { id } = req.params;
    for (let i = 0; i < categories.length; i++) {
      let existingCategory = classes.Category.FromJson(categories[i]);
      if (existingCategory.id == id) {
        for (let j = 0; j < categories.length; j++) {
          if (categories[j].parent_id == existingCategory.id) {
            res.send({
              status: 400,
              response: "Cannot delete category with childs.",
            });
          }
        }
        categories.splice(i, 1);
        serialization.Save("categories.txt", categories);
        res.send({
          status: 200,
          response: "Category with the ID " + id + " is deleted.",
        });
        return;
      }
    }
    res.send({
      status: 404,
      response: "Category with the ID " + id + " is not found.",
    });
  });
}

async function GetCurrency(currency) {
  const response = await fetch(
    "http://data.fixer.io/api/latest" +
      "?access_key=" +
      "93e504ad513ca5d7d9b8a92a2907442f"
  );
  const json = await response.json();

  let usd = json.rates.USD;
  let currency = json.rates[currency];
  let result = currency / usd;

  if (!json.success) {
    return -1;
  }

  return result;
}

module.exports = {
  categories,
  listenForCreateRequest,
  listenForCurrencyChangeRequest,
  listenForListRequest,
  listenForDeleteRequest,
  listenForUpdateRequest
};
