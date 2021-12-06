class Car {
    constructor(id, registration_license,brand, model, manufacture_date, description,
        category_id, properties){
            this.id=id;
            this.registration_license=registration_license;
            this.brand=brand;
            this.model=model;
            this.manufacture_date=manufacture_date;
            this.description=description;
            this.category_id=category_id;
            this.properties=properties;
        }
        static FromJson(json){
            return Object.assign(new Car(),json);
        }
}

class Category{
    constructor(id, name, price, parent_id){
        this.id=id;
        this.name=name;
        this.price=price;
        this.parent_id=parent_id;
    }
    static FromJson(json){
        return Object.assign(new Category(),json);
    }
}

module.exports = {
    Car,
    Category
}