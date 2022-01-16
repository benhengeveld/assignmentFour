var express = require('express');
var bodyParser  = require('body-parser');
var mongoose = require('mongoose');
const { check, validationResult} = require('express-validator');

mongoose.connect(
    'mongodb://localhost:27017/assignment4',
    {useNewUrlParser:true},
    () => console.log("connected to database")
);
const Order = mongoose.model(
    'Order',
    {
        name: String,
        address: String,
        city: String,
        postalCode: String,
        province: String,
        phone: String,
        email: String,
        productOne: Number,
        productOnePrice: Number,
        productTwo: Number,
        productTwoPrice: Number,
        productThree: Number,
        productThreePrice: Number,
        deliveryTime: Number,
        shippingCharge: Number,
        subTotal: Number,
        tax: Number,
        total: Number
    }
);

var myApp = express();

// parse application/x-www-form-urlencoded
myApp.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
myApp.use(bodyParser.json())

myApp.set('views', 'views');
myApp.set('view engine', 'ejs');
myApp.use(express.static('public'));

const products = {
    "productOne":{
        "price": 10
    },
    "productTwo":{
        "price": 20
    },
    "productThree":{
        "price": 30
    }
};
const deliveryPrices = {
    1: 30,
    2: 20,
    3: 10
};
const salesTax = 
{
    ON: 13,
    QC: 14.975,
    NS: 15,
    NB: 15,
    MB: 12,
    BC: 12,
    PE: 15,
    SK: 11,
    AB: 5,
    NL: 15,
    NT: 5,
    YT: 5,
    NU: 5
};

myApp.get('/', (req, res) => {
    res.render('index');
});

myApp.post('/order',[
        check('name', 'Must have a name!').not().isEmpty(),
        check('address', 'Must have a address!').not().isEmpty(),
        check('city', 'Must have a city!').not().isEmpty(),
        check('postalCode', 'Must have a postal code!').matches(/^[A-Za-z]\d[A-Za-z][\s-]?\d[A-Za-z]\d$/),
        check('province', 'Must have a province!').not().isEmpty(),
        check('phone', 'Invalid phone number!').isMobilePhone().optional({checkFalsy: true}),
        check('email', 'Invalid email!').isEmail().optional({checkFalsy: true}),
        check('productOne', 'Invalid number for product one!').isInt().optional({checkFalsy: true}),
        check('productTwo', 'Invalid number for product two!').isInt().optional({checkFalsy: true}),
        check('productThree', 'Invalid number for product three!').isInt().optional({checkFalsy: true}),
        check('deliveryTime', 'Must have a delivery time!').not().isEmpty(),

        check('productOne').custom((value, { req }) => {
            let productOne = parseInt(req.body.productOne) || 0;
            let productTwo = parseInt(req.body.productTwo) || 0;
            let productThree = parseInt(req.body.productThree) || 0;
            let finalPrice = (productOne * products.productOne.price) + (productTwo * products.productTwo.price) + (productThree * products.productThree.price);

            if(productOne < 0 || productTwo < 0 || productThree < 0){
                throw new Error('Cannot have a negitive amount of a product')
            }

            if(finalPrice < 10){
                throw new Error('Must spend at least $10')
            }else{
                return true;
            }
        })
    ],
    (req, res) => {
        const errors = validationResult(req);
        
        if(!errors.isEmpty()){
            res.render('failedorder', {
                errors:errors.array()
            });
        }else{
            let productOne = parseInt(req.body.productOne) || 0;
            let productOnePrice = productOne * products.productOne.price;

            let productTwo = parseInt(req.body.productTwo) || 0;
            let productTwoPrice = productTwo * products.productTwo.price;

            let productThree = parseInt(req.body.productThree) || 0;
            let productThreePrice = productThree * products.productThree.price;

            let deliveryTime = parseInt(req.body.deliveryTime) || 0;
            let shippingCharge = deliveryPrices[deliveryTime];

            let subTotal = productOnePrice + productTwoPrice + productThreePrice + shippingCharge;
            let tax = Math.round((subTotal * (salesTax[req.body.province]/100)) * 100) / 100;
            let total = subTotal + tax;

            var newOrder = new Order( {
                name: req.body.name,
                address: req.body.address,
                city: req.body.city,
                postalCode: req.body.postalCode,
                province: req.body.province,
                phone: req.body.phone,
                email: req.body.email,
                productOne: productOne,
                productOnePrice: productOnePrice,
                productTwo: productTwo,
                productTwoPrice: productTwoPrice,
                productThree: productThree,
                productThreePrice: productThreePrice,
                deliveryTime: req.body.deliveryTime,
                shippingCharge: shippingCharge,
                subTotal: subTotal,
                tax: tax,
                total: total
            });
            
            newOrder.save().then( () => {
                console.log('new order saved')
                res.render('receipt', newOrder);
            });
        }
});

myApp.get('/orders', (req, res) => {
    Order.find({}, (err, docs) => {
        res.render('orders', {orders: docs});
    });
});

myApp.listen(8080);
console.log('Server started at 8080');