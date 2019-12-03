const express = require('express')
const path = require('path')
const axios = require("axios")
const PORT = process.env.PORT || 5000
const app = express();
const Rates = require('./Rates')
const bodyParser = require("body-parser")

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

const coinAPIKey = "121A0A85-0D3B-4F01-8D29-DF60A4638FDB"
const baseCurrency = "USD"
//note that exchangeAPI.io does not require API key

app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.get('/', (req, res) => res.render('pages/index'))
app.listen(PORT, () => console.log(`Listening on ${ PORT }`))

//convert the value
app.get("/api/convert",(req,res)=>{
    let base = req.query.base;
    let to = req.query.to;
    let amount = req.query.amount
    let querydate = req.query.date

    //check if got based else use baseCurrency(USD as default)
  if (base==null) base=baseCurrency
  if (querydate==null){
    //check mongodb for today data
    var today = new Date();
    var thismonth = (today.getMonth() < 10 ? '0' : '') + (today.getMonth()+1)
    var thisday = (today.getDate() < 10 ? '0' : '') + (today.getDate()-1)
    querydate = today.getFullYear() + "-" + thismonth + "-" + thisday;
  }
  
  //search
  Rates.find({'date':querydate})
    .sort([['_id']])
    .then(response=>{
    //console.log(response)
    //res.status(200).json(response)
    let output
    console.log(response[0])
    if(base == response[0].fromCurrency){
      output = (amount*response[0].toCurrency[to])
    }else if(to == response[0].fromCurrency){
      output = (amount/response[0].toCurrency[base])
    }else{
      output = amount/response[0].toCurrency[base]*response[0].toCurrency[to]
    }
    res.send("Amount from " + amount + " " + base + " to " + to + " is: " + output);
    })
    .catch(error=>{
      console.log(error)
      res.status(400).json(response)
    })
})

//rates include rates history search
app.get("/api/rates/search",(req,res)=>{
  let base = req.query.base
  let querydate = req.query.date
  //check if got based else use baseCurrency(USD as default)
  if (base==null) base=baseCurrency
  if (querydate==null){
    var today = new Date();
    querydate = today.getFullYear() + "-" + (today.getMonth()+1) + "-" + (today.getDate()+1);
  }
  //check mongodb for today data
  //search
  Rates.find({'date':querydate})
    .sort([['_id']])
    .then(response=>{
    console.log(response)
    res.status(200).json(response)
    })
    .catch(error=>{
      res.status(400).json(response)
    })
})

//rates add
app.get("/api/rates/add",(req,res)=>{
  let base = req.query.base
  let querydate = req.query.date
  //check if got based else use baseCurrency(USD as default)
  if (base==null) base=baseCurrency
  let exchangeRateQuery
  let coinAPIBTCQuery
  let coinAPIETHQuery
  if(querydate==null){
    var today = new Date();
    querydate = today.getFullYear() + "-" + (today.getMonth()+1) + "-" + (today.getDate());
    console.log(querydate)
    //get normal currency
    exchangeRateQuery =`http://api.exchangeratesapi.io/${querydate}?base=${base}`
    //get 2 cryptocurrency
    coinAPIBTCQuery = `https://rest.coinapi.io/v1/exchangerate/${base}/BTC?time=${querydate}&apikey=${coinAPIKey}`
    coinAPIETHQuery = `https://rest.coinapi.io/v1/exchangerate/${base}/ETH?time=${querydate}&apikey=${coinAPIKey}`
  }
  else{
    //get normal currency
    exchangeRateQuery = `https://api.exchangeratesapi.io/${querydate}?base=USD`
    //get 2 cryptocurrency
    coinAPIBTCQuery = `https://rest.coinapi.io/v1/exchangerate/${base}/BTC?time=${querydate}&apikey=${coinAPIKey}`
    coinAPIETHQuery = `https://rest.coinapi.io/v1/exchangerate/${base}/ETH?time=${querydate}&apikey=${coinAPIKey}`
  }
  //else get the lastest rates from api and save it to db

  let exchangeRate
  let exchangeBase 
  let exchangeDate
  axios.get(exchangeRateQuery)
  .then (response =>{
    exchangeRate = response.data.rates
    exchangeBase = response.data.base
    exchangeDate = response.data.date  
  })
  .catch(error =>{
    console.log("Error at rates: "+error);
  })

  axios.get(coinAPIETHQuery)
  .then(response=>{
    exchangeRate.ETH = response.data.rate
    axios.get(coinAPIBTCQuery)
  .then(response=>{
    exchangeRate.BTC = response.data.rate
    let rates = new Rates({
      fromCurrency:exchangeBase,
      toCurrency:exchangeRate,
      date:exchangeDate,
  });
    rates.save().then(result=>{
      console.log("Success" + result);
      console.log("Heyhey")
      res.send(result)
  })
  .catch(error=>{
    console.log("Error on api rates: "+ error)
    })
  })
})
.catch(error=>{
  console.log("Error on api rates: "+ error)
})
})

//get all data from mongodb
app.get("/api/rates/list",(req,res)=>{
  //list all data history from mongodb
  Rates.find({})
  .sort([['_id']])
  .then(response=>{
    res.status(200).json(response)
  })
  .catch(error=>{
    res.status(400).json(error)
  })
})

//delete the individual id
app.get("api/rates/delete",(req,res)=>{
  let id = req.query.id;
  Rates.deleteOne("id")
  .then(response=>{
    console.log("Done deleted at rates list delete:"+ response)
    res.send("Done deleted")
  })
  .catch(error=>{
    console.log("Error delete at rates list delete:"+ error)
  })
})

app.get("/convert",(req,res)=>{
  res.render('pages/convert',{result:""});
})
app.get("/index",(req,res)=>{
  res.render('pages/index');
})
app.get("/history",(req,res)=>{
  res.render('pages/history',{result:""});
})
app.post("/converting",(req,res)=>{
  let base = req.body.fromConvert;
  let to = req.body.toConvert;
  let amount = req.body.toAmount;
  let querydate = req.body.toDate;

var todaydate
  //check if got based else use baseCurrency(USD as default)
if (base==null) base=baseCurrency
if (querydate==null){
  var today = new Date();
  var thismonth = (today.getMonth() < 10 ? '0' : '') + (today.getMonth()+1)
  var thisday = (today.getDate() < 10 ? '0' : '') + (today.getDate()-1)
  querydate = today.getFullYear() + "-" + thismonth + "-" + thisday;
  console.log(querydate)
  todaydate = querydate
}
//search
Rates.find({'date':querydate})
  .sort([['_id']])
  .then(response=>{
  //console.log(response)
  //res.status(200).json(response)
  let output
  console.log(response.data)
  if(base == response[0].fromCurrency){
    output = (amount*response[0].toCurrency[to])
  }else if(to == response[0].fromCurrency){
    output = (amount/response[0].toCurrency[base])
  }else{
    output = amount/response[0].toCurrency[base]*response[0].toCurrency[to]
  }

  if(querydate==todaydate){
    res.render("pages/convert",{
      result:"Amount from " + amount + " " + base + " to " + to + " is: " + output
    })
  }else{
    res.render("pages/history",{
      result:"Amount from " + amount + " " + base + " to " + to + " is: " + output
    })
  }
  })
  .catch(error=>{
    console.log(error)
    //res.status(400).json(response)
  })
})

 