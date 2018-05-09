var express = require('express');
var app = express();
const flash = require('express-flash-notification');
const session = require('express-session');

var db;
var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');

MongoClient.connect('mongodb://localhost:27017', (err, client) => {
    console.log("Successfully connected to MongoDB.");
    db = client.db('checkout');
}); 

// set up handlebars view engine
var handlebars = require('express-handlebars').create({
    defaultLayout: 'main',
    helpers: {
        section: function (name, options) {
            if (!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        }
    }
});

//var HandlebarsIntl = require('handlebars-intl');
//HandlebarsIntl.registerWith(handlebars);

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');



app.set('port', process.env.PORT || 2000);

app.use(express.static(__dirname + '/public'));

app.use(require('body-parser')());

app.use(session({
    name: 'example',
    secret: 'shuush',
    resave: false,
    saveUninitialized: true,
    cookie: {
      path: '/',
      httpOnly: true,
      secure: false,
      expires: new Date('Monday, 18 January 2028')
    },
  }))
  const flashNotificationOptions = {
    beforeSingleRender: function(item, callback) {
      if (item.type) {
        switch(item.type) {
          case 'GOOD':
            item.type = 'Success';
            item.alertClass = 'alert-success';
            break;
          case 'OK':
            item.type = 'Info';
            item.alertClass = 'alert-info';
            break;
          case 'BAD':
            item.type = 'Error';
            item.alertClass = 'alert-danger';
            break;
        }
      }
      callback(null, item);
    }
  };
  
  // Flash Notification Middleware Initialization
  app.use(flash(app, flashNotificationOptions))

app.use(flash(app));

app.get("/devices", function(req, res){
    res.render("devices")
})

app.get('/', function (req, res) {
    db.collection('students').find({"Activities.Returned": false}).toArray(function (err, student) {

        res.render('checkout', {
            'studentlist':student,
            });
    });
});

app.get('/test', function (req, res){
    db.collection('students').find({ "Activities.Returned": { $exists: true } } , function (err, student) {
       console.log(student);
        res.render('test',{
            student:student
        });
    });
});

app.post('/process', function (req, res) {
    db.collection('students').findOne({ ID: parseInt(req.body.pin) }, function (err, student) {

        if (student != null){

        db.collection('devices').findOne({ Barcode: parseInt(student.Tbc) }, function (err, device) {

            res.render('process', {
                pin: student.ID,
                FName: student.First_Name,
                LName: student.Last_Name,
                Grade: student.Grade_Level,
                Grad: student.Sched_YearOfGraduation,
                img: "img/" + student.ID + ".jpg",
                barcode: student.Tbc,
                brand: device.Brand,
                type: device.Type,
                model: device.Model,
                vendor: device.Vendor,
                cdi: device.CDI,
                serial: device.ServiceTag,
                PDate: device.PurchaseDate,
                Activities: student.Activities
            });
        });

    } else {
        req.flash("BAD", "No User Found", "/");
    }

    });
});

app.post('/charger', function (req, res) {
    console.log(req.body.pin);
    var d = new Date();
    db.collection('students').findAndModify({ "ID": parseInt(req.body.pin) },
        [['_id', 'asc']], {
                $addToSet: {
                    Activities: { aID: d.toISOString() , Date: d, Model: (req.body.model), Type:"Charger", Barcode: (req.body.barcode), Description: (req.body.report), Damages: (req.body.damages), StudRes: (req.body.StudRes), Loaner:(req.body.loaner),  Returned: false }
                }
            
        }, { upsert: 1 },
        function (err, thing) {
            if (err) {
                console.log(err);
            } else {
                console.log(thing);
            }
        });

        req.flash("GOOD", "Charger Loaned.", "/")
});

app.post('/chromebook', function (req, res) {
    console.log(req.body.pin);
    var d = new Date();
    db.collection('students').findAndModify({ "ID": parseInt(req.body.pin) },
        [['_id', 'asc']], {
            $addToSet: {
                Activities: { aID: d.toISOString() ,Date: d, Model: (req.body.model), Type: "Chromebook", Barcode: (req.body.barcode), Description: (req.body.report), Damages: (req.body.damages), StudRes: (req.body.StudRes), Loaner:(req.body.loaner), Returned: false }
            }

        }, { upsert: 1 },
        function (err, thing) {
            if (err) {
                console.log(err);
            } else {
                console.log(thing);
            }
        });

        db.collection('devices').findAndModify({ "Barcode": parseInt(req.body.loaner) },
        [['_id', 'asc']], {
                $addToSet: {
                    Activities: { aID: d.toISOString() , Date: d, Name: (req.body.FName +" " + req.body.LName), ID: (req.body.pin), Description: (req.body.report), Damages: (req.body.damages), StudRes: (req.body.StudRes), Returned: false }
                }
            
        }, { upsert: 1 },
        function (err, thing) {
            if (err) {
                console.log(err);
            } else {
                console.log(thing);
            }
            });

        req.flash("GOOD", "Chromebook Loaned.", "/")
});

app.post('/repair', function (req, res) {
    res.render('repair' , {
        pin: req.body.pin,
        FName: req.body.FName,
        LName: req.body.LName,
        barcode: req.body.barcode,
        model: req.body.model
    });
});

app.post('/repair2', function(req, res) {
    var d = new Date();
    db.collection('students').findAndModify({ "ID": parseInt(req.body.pin) },
        [['_id', 'asc']], {
            $addToSet: {
                Activities: {Date: new Date(), aID: d.toISOString() ,Date: d, Model: (req.body.model), Type: "Repair", Barcode: (req.body.barcode), Description: (req.body.report), Damages: (req.body.damages), StudRes: (req.body.StudRes), Loaner:(req.body.loaner), Returned: false }
            }

        }, { upsert: 1 },
        function (err, thing) {
            if (err) {
                console.log(err);
            } else {
                console.log(thing);
            }
        });

        db.collection('devices').findAndModify({ "Barcode": parseInt(req.body.barcode) },
        [['_id', 'asc']], {
                $addToSet: {
                    Activities: { aID: d.toISOString() , Date: d, Name: (req.body.FName + " " +  req.body.LName), ID: (req.body.pin), Description: (req.body.report), Damages: (req.body.damages), StudRes: (req.body.StudRes), Returned: false }
                }
            
        }, { upsert: 1 },
        function (err, thing) {
            if (err) {
                console.log(err);
            } else {
                console.log(thing);
            }
            });

        req.flash("GOOD", "Repair Submited.", "/") 
});

app.post("/return", function (req,res){

    console.log(req.body.aID);
    db.collection('students').updateOne({"Activities":{$elemMatch: {"Returned": false, "aID":req.body.aID}}},{$set: {"Activities.$.Returned" : true, "Activities.$.DateReturned": new Date()}})
    req.flash("GOOD", "Loaner returned.", "/")
});


// 404 page
app.use(function (req, res, next) {
    res.type('text/plain');
    res.status(404);
    res.send('404 - Not Found');
});

// 500 page
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.type('text/plain');
    res.status(500);
    res.send('500 - Server Error');
});

app.listen(app.get('port'), function () {
    console.log('Express started on http://localhost:' +
        app.get('port') + '; press Ctrl-C to terminate.');
});