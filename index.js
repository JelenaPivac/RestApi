const { json } = require('express');
const express = require('express');
const carsModule=require('./cars');
const categoriesModule=require('./categories');
const reservationModule=require('./reservations');

const app = express();
const PORT=8080;



app.use(express.json());

app.listen(PORT,()=>{});

carsModule.createEndPointForAllPreviousCars(app);
carsModule.listenForCreateRequest(app);
carsModule.listenForListRequest(app);
carsModule.listenForUpdateRequest(app);
carsModule.listenForDeleteRequest(app);
carsModule.listenForSearchRequest(app);

categoriesModule.listenForCreateRequest(app);
categoriesModule.listenForUpdateRequest(app);
categoriesModule.listenForListRequest(app);
categoriesModule.listenForCurrencyChangeRequest(app);
categoriesModule.listenForDeleteRequest(app);

reservationModule.listenForReservationRequest(app);