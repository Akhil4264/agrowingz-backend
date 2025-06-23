const express = require("express");
const app = express();
const authRoutes = require("./routes/auth.router");
const formRoutes = require("./routes/form.router");
const analyticsRoutes = require("./routes/analytics.router");
const programRoutes = require("./routes/program.router");
const adminRoutes = require("./routes/admin.router")
const authMiddleware = require("./middleware/auth.middleware")
const path = require('path');
const cors = require('cors')

app.use(express.json());
app.use(cors({
  "origin" : "http://localhost:5173",
  credentials: true
}))

app.get("/",  (req,res)=>{
  res.json({message : "server running successfully"})
})

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')) ;

app.use(express.static(path.join(__dirname, 'public')));



app.use("/api/auth", authRoutes);
app.use("/api/me",authMiddleware)

app.use("/api/forms", formRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/programs", programRoutes);
app.use("/api/admin", adminRoutes);



app.listen(process.env.PORT || 3000, () => {
  console.log(`server running on http://localhost:${process.env.PORT || 3000}`);
});
