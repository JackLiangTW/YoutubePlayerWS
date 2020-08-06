require('dotenv').config();
const path=require('path');
const express=require("express");
const mongoose=require("mongoose");
const bodyParser=require("body-parser");
const socketIO = require('socket.io');
const router = express.Router();
var app=express();
app.use(express.json());
app.use(express.static(__dirname + '/public'));//allows access to public directory
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/', router);//use app/router要放在最後(至少要bodyParser之後)
const PORT = process.env.PORT || 3030;
const CrawlerPost=require('./routes/CrawlerData');

mongoose.connect(
  `${process.env.MONGOOSEID}`,
  {     
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true//導致heroku timeout 30000??
   },
  ()=>console.log("Connected mongoose!")
)
// mongoose.connect(
//   `${process.env.MONGOOSEID}`,
//   { useUnifiedTopology: true ,useNewUrlParser: true},
//   ()=>console.log("Connected mongoose!")
// )
router.get('/', (req, res) => {//router Render html
  res.sendFile(path.join(__dirname, './public', 'showPost.html'))
});
router.get('/getData',async function(req, res) {//抓該schema的crawler資料
  req.connection.setTimeout( 1000 * 60 * 5 );
  let VAL;
  let TP=0;
  let KIND=req.query.kind;
  if(Object.keys(req.query)[0]=='_id'){//if use _id findOne
    VAL=req.query['_id'];    
    TP=1;
  }else{//if use 日期 findOne
    let Days=req.query.date;
    Days=Days.split(',');
    VAL=new Date(parseInt(Days[0]),parseInt(Days[1]),parseInt(Days[2]));
  }
  console.log(VAL);
  let datas=await CrawlerPost.CrawlerGetSchema(
    Object.keys(req.query)[0],
    VAL,
    TP,
    KIND
  );
  res.send({data:datas});
});
  
// app.listen(process.env.port || 4000,function(){  
//   console.log("LS4000");
// });
const server=app.listen(PORT, function () {
  console.log(`Listening on ${ PORT }`);
});

//----------------------Do Socket IO------------------------
const io = socketIO(server);
io.on("connection",function(socket){
  socket.emit('newclientconnect',{id:socket.id});//--登入後台
  socket.on("ListFromClient",function(msg){
    //console.log(msg);
    io.emit("SendList",{id:socket.id,title:msg.title,list:msg.list}); 
  });
});
//----------------------Do Socket IO------------------------
 