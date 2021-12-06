const classes = require('./Classes');
const serialization = require('./Serialization')
let categories= require('./categories').categories;

let cars = [];
cars = serialization.Load('cars.txt');

function createEndPointForAllPreviousCars(app){
for(let i=0;i<cars.length;i++){
    let newCar = classes.Car.FromJson(cars[i]);
    createEndpointForCar(newCar,app)
}}

function listenForCreateRequest(app) {
  app.post("/cars/create", (req, res) => {
    const body = req.body;
    let newCar = classes.Car.FromJson(req.body);
    for (let i = 0; i < cars.length;i++) {
      let existingCar = classes.Car.FromJson(cars[i]);
      if (existingCar.id == newCar.id) {
        res.send({
          stats: 400,
          response: "ID already exists in the database",
        });
        return;
      }
    }
    let canAdd = false;
    for (let i = 0; i < categories.length; i++) {
      if (categories[i].id == newCar.category_id) {
        canAdd = true;
        for (let j = 0; j < categories.length; j++) {
          if (newCar.category_id == categories[j].parent_id) {
            res.send({
              status: 400,
              response: "A car can only have child categories.",
            });
            return;
          }
        }
      }
    }
    if (!canAdd) {
      res.send({
        status: 404,
        response: "Category with the ID doesn't exist.",
      });
      return;
    }
    cars.push(req.body);
    serialization.Save("cars.txt", cars);
    createEndpointForCar(newCar,app);
    res.send({
      status: 200,
      response: "Car added to the database",
    });
  });
}

function listenForListRequest(app) {
  app.get("/cars/list", (req, res) => {
    let query = req.query;
    let field = query.field;
    let order = query.order;
    console.log(cars);
    let sortedCars = [...cars];
    sortedCars.sort(function (a, b) {
      let ascending = order == "ascending";
      if (field != "price") {
        if (a[field] >= b[field]) {
          return ascending ? 1 : -1;
        } else {
          return ascending ? -1 : 1;
        }
      } else {
        let aPrice = 0;
        let bPrice = 0;
        for (let i = 0; i < categories.length; i++) {
          if (a.category_id == categories[i].id) {
            aPrice = categories[i].price;
          }
          if (b.category_id == categories[i].id) {
            bPrice = categories[i].price;
          }
        }
        if (aPrice >= bPrice) {
          return ascending ? 1 : -1;
        } else {
          return ascending ? -1 : 1;
        }
      }
    });
    res.send({
      status: 200,
      cars: sortedCars,
    });
  });
}

function listenForUpdateRequest(app) {
  app.post("/cars/update/:id", (req, res) => {
    const { id } = req.params;
    const body = req.body;

    for (let i = 0; i < cars.length;i++) {
      let existingCar = classes.Car.FromJson(cars[i]);
      if (existingCar.id == id) {
        Object.assign(existingCar, req.body);
        existingCar.id = id;
        let canAdd = false;
        for (let i = 0; i < categories.length; i++) {
          if (categories[i].id == existingCar.category_id) {
            canAdd = true;
            for (let j = 0; j < categories.length; j++) {
              if (existingCar.category_id == categories[j].parent_id) {
                res.send({
                  status: 400,
                  response: "A car can only have child categories.",
                });
                return;
              }
            }
          }
        }
        if (!canAdd) {
          res.send({
            status: 404,
            response: "Category with the ID doesn't exist.",
          });
          return;
        }
        cars[i] = existingCar;
        res.send({
          status: 200,
          response: "Car with the ID " + id + " is updated.",
        });
        serialization.Save("cars.txt", cars);
        return;
      }
    }
    res.send({
      status: 404,
      response: "Car with the ID " + id + " is not found.",
    });
  });
}

function listenForDeleteRequest(app) {
  app.delete("/cars/delete/:id", (req, res) => {
    const { id } = req.params;
    for (let i = 0; i < cars.length; i++) {
      let existingCar = classes.Car.FromJson(cars[i]);
      if (existingCar.id == id) {
        cars.splice(i, 1);
        serialization.Save("cars.txt", cars);
        res.send({
          status: 200,
          response: "Car with the ID " + id + " is deleted.",
        });
        return;
      }
    }
    res.send({
      status: 404,
      response: "Car with the ID " + id + " is not found.",
    });
  });
}

function listenForSearchRequest(app) {
  app.get("/cars/search", (req, res) => {
    let query = req.query;
    let brand = query.brand;
    let model = query.model;
    let priceMin = query.priceMin;
    let priceMax = query.priceMax;

    let selectedCars = [...cars];
    if (brand) {
      for (let i = 0; i < selectedCars.length; ) {
        let car = classes.Car.FromJson(selectedCars[i]);
        if (car.brand != brand) {
          selectedCars.splice(i, 1);
        } else {
          i++;
        }
      }
    }
    if (model) {
      for (let i = 0; i < selectedCars.length; ) {
        let car = classes.Car.FromJson(selectedCars[i]);
        if (car.model != model) {
          selectedCars.splice(i, 1);
        } else {
          i++;
        }
      }
    }
    if (priceMin) {
      for (let i = 0; i < selectedCars.length; ) {
        let car = classes.Car.FromJson(selectedCars[i]);
        let price = 0;
        for (let j = 0; j < categories.length; j++) {
          if (car.category_id == categories[j].id) {
            price = categories[j].price;
          }
        }
        if (price < priceMin) {
          selectedCars.splice(i, 1);
        } else {
          i++;
        }
      }
    }
    if (priceMax) {
      for (let i = 0; i < selectedCars.length; ) {
        let car = classes.Car.FromJson(selectedCars[i]);
        let price = 0;
        for (let j = 0; j < categories.length; j++) {
          if (car.category_id == categories[j].id) {
            price = categories[j].price;
          }
        }
        if (price > priceMax) {
          selectedCars.splice(i, 1);
        } else {
          i++;
        }
      }
    }
    res.send({
      response: selectedCars,
    });
  });
}

function createEndpointForCar(car, app) {
  app.get(
    "/" + car.brand + "_" + car.model + "_" + car.registration_license,
    (req, res) => {
      res.send({
        car,
      });
    }
  );
}

module.exports={
    listenForCreateRequest,
    listenForListRequest,
    listenForUpdateRequest,
    listenForDeleteRequest,
    listenForSearchRequest,
    createEndpointForCar,
    createEndPointForAllPreviousCars,
    cars
}
