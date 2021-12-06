const exportModule=require('./export');
const carsModule = require("./cars");
const categoriesModule = require("./categories");
const serialization = require("./Serialization");
let cars = carsModule.cars;
let categories = categoriesModule.categories;

let reservedCars = [];
reservedCars = serialization.Load("reservations.txt");
exportModule.exportCsv(reservedCars);
function listenForReservationRequest(app) {
  app.get("/cars/reserve", (req, res) => {
    const query = req.query;
    const category_id = query.category_id;
    const license = query.registration_license;
    const dateStart = query.dateStart;
    const dateEnd = query.dateEnd;

    if (Date.parse(dateStart) > Date.parse(dateEnd)) {
      res.send({
        status: "fail",
        message: "Start date cant be greater than end date",
      });
      return;
    }

    for (let i = 0; i < cars.length; i++) {
      if (license) {
        if (cars[i].registration_license == license) {
          if (!isCarReserved(cars[i], dateStart, dateEnd)) {
            reserveCar(cars[i], dateEnd, dateStart, res);
          } else {
            res.send({
              status: "fail",
            });
          }
        }
      } else if (category_id) {
        let selectedCars = [];
        for (let i = 0; i < cars.length; i++) {
          if (cars[i].category_id == category_id) {
            selectedCars.push(cars[i]);
          }
        }

        while (selectedCars.length) {
          let index = Math.floor(Math.random() * selectedCars.length);
          if (!isCarReserved(selectedCars[index], dateStart, dateEnd)) {
            reserveCar(selectedCars[index], dateEnd, dateStart, res);
            return;
          }
          selectedCars.splice(index, 1);
        }
        res.send({
          status: "fail",
          message: "Car with the category ID is not available.",
        });
      }
    }

    res.send({
      status: "fail",
      message: "Car specified not found",
    });
  });
}

function isCarReserved(car, from, to) {
  for (let i = 0; i < reservedCars.length; i++) {
    if (reservedCars[i].car.id == car.id) {
      let reservedCarsEnd = Date.parse(reservedCars[i].dateEnd);
      let reservedCarsStart = Date.parse(reservedCars[i].dateStart);
      let fromDate = Date.parse(from);
      let toDate = Date.parse(to);
      if (fromDate <= reservedCarsStart && toDate >= reservedCarsStart) {
        return true;
      }
      if (fromDate >= reservedCarsStart && fromDate <= reservedCarsEnd)
        return true;
    }
  }
  return false;
}

function reserveCar(car, dateEnd, dateStart, res) {
  reservedCars.push({
    car: car,
    dateStart: dateStart,
    dateEnd: dateEnd,
  });
  let category;
  for (let j = 0; j < categories.length; j++) {
    if (categories[j].id == car.category_id) {
      category = categories[j];
    }
  }
  let numberOfDays =
    (Date.parse(dateEnd) - Date.parse(dateStart)) / (1000 * 3600 * 24);
  serialization.Save("reservations.txt", reservedCars);
  res.send({
    status: "successful",
    registraton_license: car.registraton_license,
    category: category,
    dateStart: dateStart,
    dateEnd: dateEnd,
    price: numberOfDays * category.price,
  });
}

module.exports = {
  listenForReservationRequest,
};
