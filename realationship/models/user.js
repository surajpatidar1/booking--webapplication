const mongoose = require("mongoose");
const{Schema} = mongoose;
main().catch(err => console.log(err));

main()
.then(()=>{console.log("db connected..");})
.catch((err)=>{console.log(err);});

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/relationdemo');
}
const userSchema = new Schema({
    username: String,
    address: [{
        location: String,
        city: String,
    },
],
});

// create collections

const User = mongoose.model("User",userSchema);

const addusers = async ()=>{
    let user1 = new User({
        username: "suryaprakash",
        address:[{
                 location: "apollo",
                 city: "indore",
        },
    ]
    });
    user1.address.push({location: "arvindo" , city: "indore"});
    await user1.save();
};
addusers();