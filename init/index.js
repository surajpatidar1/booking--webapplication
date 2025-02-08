const mongoose = require("mongoose");
const initData = require("./data");
const listing = require("../models/listing.js");
main().then(()=>{console.log("db connected..");})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/booking');

}
const initDB = async ()=>{
    await listing.deleteMany({});
//insert a data every  for user(shortcut)
 initData.data = initData.data.map((obj)=>({...obj, Owner: '676ec48669c7013b43a31c41'}));
    await listing.insertMany(initData.data);
    console.log("data was intialized");

};
initDB();