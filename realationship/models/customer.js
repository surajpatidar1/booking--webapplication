const mongoose = require("mongoose");
const{Schema} = mongoose;
main()
.then(()=>{console.log("db connected..");})
.catch((err)=>{console.log(err);});

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/relationdemo');
  }

  const orderScehma = new Schema({
    item: String,
    price: Number,
  });


  const customerSchema = new Schema({
    name: String,
    price: Number,
    orders: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Order'

        },
    ],
  });
const Order = mongoose.model("Order",orderScehma);
const Customer = mongoose.model("Customer",customerSchema);


//functions

const findCustomer = async()=>{
  let result = await Customer.find({}).populate("orders");
  console.log(result[0]);
};





