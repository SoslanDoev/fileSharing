const multer = require("multer")
require("dotenv").config()
const path = require("path")
const mongoose = require("mongoose")
const bcryptjs = require("bcryptjs")
const express = require("express")
const File = require("./models/File")
const app = express()
const port = process.env.PORT || 8080
const upload = multer({dest: "uploads"})
app.listen(port)
app
  .use(express.urlencoded({extended: true}))
mongoose.connect(process.env.DATABASE_URL)
app.use(express.static(path.join(__dirname, 'public')))

app.set("view engine", "ejs")

app.get("/", (req, res) => {
  res.render("index")
})

app.post("/upload", upload.single("file"), async (req, res) => {
  const fileData = {
    path: req.file.path,
    originalName: req.file.originalname,
  }
  if (req.body.password !== null && req.body.password !== "") {
    fileData.password = await bcryptjs.hash(req.body.password, 7)
  }
  const file = await File.create(fileData)
  res.render("index", {fileLink: `${req.headers.origin}/file/${file.id}`})
})

app.route("/file/:id")
  .get(handleDownload )
  .post(handleDownload)

async function handleDownload(req, res) {
  const file = await File.findById(req.params.id)
  if (file.password != null) {
    if (req.body.password == null) {
      res.render("password")
      return 
    }
    if (!(await bcryptjs.compare(req.body.password, file.password))) {
      res.render("password", {error: true})
      return
    }
  }
  file.downloadCount++
  await file.save()
  res.download(file.path, file.originalName)
}