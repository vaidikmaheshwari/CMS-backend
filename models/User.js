const mongoose=require('mongoose');
const UserSchema = new mongoose.Schema({
    name:{
        type: String,
        required:[true,' Name is required..'],
    },
    email:{
        type :String , 
        required:[true,"Email id is Required"],
    },
    password:{
        type:String,
        required:[true ,"Password is Required"],
    },
});

const User = new mongoose.model("User",UserSchema);

module.exports= User;