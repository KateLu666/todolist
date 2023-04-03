//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://zhinanlu3:19981205@cluster0.wqea9ak.mongodb.net/?retryWrites=true&w=majority", {
  useNewUrlParser: true,
});

const itemsSchema = {
  name: String,
};

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item. ",
});

const item3 = new Item({
  name: "<-- Hit this delete an item.",
});

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  const day = date.getDate();

  Item.find({})
    .then(function (foundItems) {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems);
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  let listName = req.body.list;
  let listNameRemain = listName.toLowerCase();
  listName = listName.charAt(0).toUpperCase() + listNameRemain.slice(1);

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then(function (foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  let listName = req.body.listName;
  let listNameRemain = listName.toLowerCase();
  listName = listName.charAt(0).toUpperCase() + listNameRemain.slice(1);

  if (listName === "Today") {
    Item.findByIdAndDelete(checkedItemId)
      .then(() => {
        res.redirect("/");
      })
      .catch((err) => {
        console.log(err);
      });
  }
  else {
    let doc =  List.findOneAndUpdate({name:listName}, {$pull: {items: {_id: checkedItemId}}}, {
      new: true
    }).then(function (foundList)
    {
      res.redirect("/" + listName);
    }).catch( err => console.log(err));
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = req.params.customListName;

  List.findOne({ name: customListName })
    .then(function (foundList) {
      if (foundList === null) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
