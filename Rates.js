const mongoose = require('mongoose')
const DATABASE_NAME = "WebAPIAssignment"
const db = `mongodb+srv://shirayuki:abcd1234@clustermongo-4nyjl.mongodb.net/${DATABASE_NAME}?retryWrites=true&w=majority`


mongoose.connect(db,{useNewUrlParser:true})
.then(()=> {
    console.log("Connected to database");
})
.catch((error)=> {
console.log("Error Connected to database"+error);
})

let schema = new mongoose.Schema({
  fromCurrency:{type:String},
  toCurrency:{
      USD: Number,
      MYR: Number,
      CNY: Number,
      JPY: Number,
      EUR: Number,
      AUD: Number,
      SGD: Number,
      BTC: Number,
      ETH: Number,
  },
  date: {type: String},
  rates: {type: Number}
})
const Rates = mongoose.model("Rates",schema,"rates")
module.exports = Rates