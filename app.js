const express = require("express");
const connectDB = require("./mongoose.js");
const Counsellor = require("./models/counsellorSchema.js");
const app = express();
const path = require('path');
const bodyParser = require('express').urlencoded;
app.use(bodyParser({ extended: false }));
const User = require("./models/userSchema.js");

app.use(express.json()); 

app.use(express.static(path.join(__dirname, 'frontend')));

app.get("/api",(req,res)=>{
   res.sendFile(path.join(__dirname,'frontend','index.html'));
})

connectDB();

app.get("/api/counsellor/new",(req,res)=>{
    res.sendFile(path.join(__dirname,'frontend','counsellorSignup.html'));
})

app.get("/api/counsellor",(req,res)=>{
 res.sendFile(path.join(__dirname,'frontend','counsellorDashboard.html'));
})


app.get("/api/user/new",(req,res)=>{
    res.sendFile(path.join(__dirname,'frontend','user_register.html'));
})

app.post("/api/user/signup", async (req, res) => {
  try {
    const user = new User(req.body);
    const savedUser = await user.save();
    res.status(201).json({ success: true, user: savedUser });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post("/api/counsellor/signup", async (req, res) => {
  try {
    const user = new User(req.body);
    const savedUser = await user.save();
    res.status(201).json({ success: true, user: savedUser });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, error: err.message });
  }
});




app.get("/api/user",(req,res)=>{
 res.sendFile(path.join(__dirname,'frontend','userDashboard.html'));
})

app.get("/api/about",(req,res)=>{
    res.sendFile(path.join(__dirname,'frontend','about.html'));
})

app.get("/api/termsandpolicy",(req,res)=>{
    res.sendFile(path.join(__dirname,'frontend','termsandpolicy.html'));
})


app.get("/api/user/heath-tracker",(req,res)=>{
 res.sendFile(path.join(__dirname,'frontend','healthTracker.html'));
})

app.get("/api/self-analysis",(req,res)=>{
 res.sendFile(path.join(__dirname,'frontend','selfAnalysis.html'));
})

app.get("/api/user/test",(req,res)=>{
 res.sendFile(path.join(__dirname,'frontend','test.html'));
})

app.get("/api/user/report",(req,res)=>{
 res.sendFile(path.join(__dirname,'frontend','report.html'));
})

app.put("/api/user/emergency-contact",(req,res)=>{
      res.send("well");
})
app.get("/api/role",(req,res)=>{
     res.sendFile(path.join(__dirname,'frontend','role.html'));
})
const port = 8080;
app.listen(port,(req,res)=>{
    console.log("server is running");
})