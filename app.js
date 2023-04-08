const express = require ("express");
const bodyParser = require ("body-parser");
const mongoose = require ("mongoose");
const _ = require("lodash");

const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

const itemsSchema = ({
    name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
    name: "Welcome to your todolist"
});

const item2 = new Item ({
    name: "Hit the + button to add a new item"
});

const item3 = new Item ({
    name: "<-- Hit this do delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema)

app.get("/", function(req, res){

    Item.find({})
    .then(foundItems => {
        if(foundItems.length === 0) {
            Item.insertMany(defaultItems)
                .then(() => {
                console.log("Successfully saved default items to DB.");
                })
                .catch((err) => {
                console.log(err);
                });
                res.redirect("/");
            } else {
            res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
        })
    .catch(err => {
        console.log(err);
    });

    
});

app.post("/", function(req, res){

    const itemName = req.body.newItem;
    const listName = req.body.list;
    
    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save()
            .then(() => res.redirect("/"))
            .catch(err => console.log(err));
    } else {
        List.findOne({name: listName})
            .then(foundList => {
                foundList.items.push(item);
                foundList.save()
                    .then(() => res.redirect("/" + listName))
                    .catch(err => console.log(err));
            })
            .catch(err => console.log(err));
    }
});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findOneAndDelete({ _id: checkedItemId })
        .then(function(result) {
            console.log("Successfully deleted checked item");
            res.redirect("/");
        })
        .catch(function(err) {
            console.log(err);
        });   
    } else {
        List.findOneAndUpdate(
            {name: listName},
            {$pull: {items: {_id: checkedItemId}}},
            {useFindAndModify: false}
        )
        .then(foundList => {
            res.redirect("/" + listName);
        })
        .catch(err => console.log(err));
    }
});

app.get("/work", function(req, res){
    res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName})
    .then(foundList => {
        if (foundList) {
            //Show an existing list
            res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        } else {
            //Create a new list
            const list = new List({
                name: customListName,
                items: defaultItems
            });
            list.save();
            res.redirect("/" + customListName);
        }
    })
    .catch(err => console.log(err));

});


app.get("/about", function(req, res){
    res.render("about");
});

app.listen(3000, function(){
    console.log("Sever started on port 3000");
});

