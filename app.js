
/**
 * Module dependencies.
 */
var express = require('express');
var mysql = require("mysql");
var http = require('http');
var url = require('url') ;
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
var SessionStore = require('express-mysql-session');

var storeOptions = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'MyNewPass',
    database: 'userdb'
};

var sessionStore = new SessionStore(storeOptions);
app.use(session({key: 'express.sid',secret: 'chetan',store:sessionStore, resave: true, saveUninitialized: true, cookie:{expires:new Date(new Date().getMinutes()+240), maxAge:900000}
     }));
//app.use(session({ cookieName:'session' ,secret: 'chetan', resave: false, saveUninitialized: false,maxAge:15 * 60 * 1000,httpOnly: true, secure: true,ephemeral: true}));
app.set('port', process.env.PORT || 3001);

// var con = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "MyNewPass",
//   database: "userdb"
// });
// con.connect();
var poolRead = mysql.createPool({
      connectionLimit : 1000, //important
    host     : 'localhost',
    user     : 'root',
    password : 'MyNewPass',
    database : 'userdb',
    port     : '3306',
    debug    :  false
});
var poolWrite = mysql.createPool({
      connectionLimit : 1000, //important
    host     : '`localhost`',
    user     : 'root',
    password : 'MyNewPass',
    database : 'userdb',
    port     : '3306',
    debug    :  false
});

app.get('/index', function(req,res){
  res.json("Healthy"); 
});

app.post('/registerUser', function(req,res){
   var firstName = req.body.fname;
  var lastName = req.body.lname;
  var uAddress = req.body.address;
  var uCity = req.body.city;
  var uState = req.body.state;
  var uZip = req.body.zip;
  var uEmail = req.body.email;
  var uName = req.body.username;
  var pWord = req.body.password;
  var query = "INSERT INTO ??(??,??,??,??,??,??,??,??,??,??) VALUES (?,?,?,?,?,?,?,?,?,?)";
        
    var adduser = ["users_table","firstname","lastname","role","address","city","state","zip","email","username","password",firstName,lastName,"customer",uAddress,uCity,uState,uZip,uEmail,uName,pWord];
    
    query = mysql.format(query,adduser);
    poolWrite.getConnection(function(err,con){
    con.query(query,function(err,rows){
       con.release();
        if(err) {
            console.log(err);
            res.json({"message" : "There was a problem with your registration"});
        } else {
            res.json({"message" : "Your account has been registered"});
        }
    });
    });
});
    
app.post('/updateInfo', function(req,res){
  var firstName = req.body.fname;
  var lastName = req.body.lname;
  var uAddress = req.body.address;
  var uCity = req.body.city;
  var uState = req.body.state;
  var uZip = req.body.zip;
  var uEmail = req.body.email;
  var uName = req.body.username;
  var pWord = req.body.password;
  var isUserNameChanged = false;
  var sess =req.session;
  if(sess.username){
var queryUpdate = "UPDATE users_table SET ";
		var isValueChanged = false; //To check if any paramter is being sent at all in first place

		if(typeof firstName != 'undefined' && firstName.length >0 ) {
			isValueChanged = true;
			queryUpdate += "firstname = '"+firstName+"' , ";
		}
		if(typeof lastName != 'undefined' && lastName.length >0 ) {
			isValueChanged = true;	
			queryUpdate +="lastname = '"+lastName+"' , ";
		}
		if(typeof uAddress != 'undefined' && uAddress.length >0 ) {
			isValueChanged = true;
			queryUpdate +="address = '"+uAddress+"' , ";
		}
		if(typeof uCity != 'undefined' && uCity.length >0 ) {
			isValueChanged = true;
			queryUpdate += "city = '"+uCity+"' , ";
		}
		if(typeof uState != 'undefined' && uState.length >0 ) {
			isValueChanged = true;
			queryUpdate +="state = '"+uState+"' , ";
		}
		if(typeof uZip!= 'undefined' && uZip >0 ) {
			isValueChanged = true;
			queryUpdate += "zip = '"+uZip+"' , ";
		}
		if(typeof uEmail != 'undefined' && uEmail.length >0 ) {
			isValueChanged = true;
			queryUpdate +="email = '"+uEmail+"' , ";
		}
		if(typeof uName != 'undefined' && uName.length >0 ) {
			isValueChanged = true;
			isUserNameChanged = true;
			queryUpdate +="username = '"+uName+"' , ";
		}
		if(typeof pWord != 'undefined' && pWord.length >0 ) {
			isValueChanged = true;
			queryUpdate += "password = '"+pWord+"' , ";
		}

		if(isValueChanged) {

			queryUpdate = queryUpdate.substring(0, queryUpdate.length - 2); 

			queryUpdate += "WHERE userid = '"+req.session.userID+"'";

			queryUpdate = mysql.format(queryUpdate);
      poolWrite.getConnection(function(err,con){
			con.query(queryUpdate,function(err,rows){
         con.release();
	            if(err) {
	                res.json({"Message" : "There was a problem with this action"});
	            } else {
	            	if(rows.changedRows <=0 ) {
	            		//Check if any rows are changed
			    		res.json({"Message" : "No rows were updated"});
			    	} else {
	                	res.json({"Message" : "Your information has been updated"});
			    	}
	            }
	        });
    });
		}
		else {
			res.json({'Message':'There was a problem with this action'});
		}
  }
  else{
    res.json("You must be logged in to perform this action");
  }
});

app.post('/login', function(req,res){
var userName = req.body.username;
var passWord = req.body.password;
var date = new Date();
sess = req.session;
console.log('sessionID  '+sess.id);
  if (typeof userName != 'undefined' && (typeof req.session.username == 'undefined' || req.session.username === "" || req.session.username === undefined)){
  
  console.log('Connection established');
  poolRead.getConnection(function(err,con){
  con.query('SELECT * FROM users_table where username=? AND password=?',[userName,passWord],function(err,rows){
     con.release();
     if(err) {
      console.log("Error Selecting : %s ",err );
    }
    if(rows.length <= 0 || typeof rows == 'undefined') {
        res.send('That username and password combination was not correct');
    }
      else {
        sess.username = userName;
        var role=rows[0].role;
        sess.role = role;
        req.session.userID = rows[0].userid;
        res.send('Welcome'+ " " + rows[0].firstname); 
      }
    });
  });
  }
  else{
      res.json('you are already logged in');
    }
});

app.post('/addProducts', function(req,res){
  var pName = req.body.name;
  var pDescription = req.body.productDescription;
  var pAsin = req.body.asin;
  var pGroup = req.body.categories;
  var isProductIdSame = false;
  var checkstatus = true;
  var sess =req.session;
  if(sess.username){
    if(sess.role=='admin'){
  if ( pName =="" || pDescription =="" || pAsin =="" || pGroup =="") {
		checkstatus = false;
		res.json("There was a problem with this action");
	}
	
if(checkstatus){
  poolRead.getConnection(function(err,con){
  con.query('SELECT * FROM product_table',function(err,rows,fields){
     con.release();
  for (var i=0; i<rows.length;i++){
    if((pAsin == rows[i].asin)){
      isProductIdSame =true;
      res.json({"message" : "There was a problem with this action"});
    }
  }
  if(isProductIdSame==false){
  var query = "INSERT INTO ??(??,??,??,??) VALUES (?,?,?,?)";
        
    var addProduct = ["product_table","name","productDescription","asin","pgroup",pName,pDescription,pAsin,pGroup];
    
    query = mysql.format(query,addProduct);
   
      poolWrite.getConnection(function(err,con){ 
      con.query(query,function(err,rows){
         con.release();
        if(err) {
            res.json({"message" : "There was a problem with this action"});
        } else {
            res.json({"message" : "The product has been added to the system"});
        }
    });
  });
}
  
  });
});
}
    }
    else{
      res.json("Only admin can perform this action");
    }
  }
  else{
    res.json("You must be logged in to perform this action");
  }
});

app.post('/modifyProduct', function(req,res){
   var pAsin = req.body.asin;
  var pName = req.body.name;
  var pDescription = req.body.productDescription;
  var pgroup = req.body.categories;
 var sess =req.session;
  if(sess.username){
    if(sess.role=='admin'){
    var checkstatus = true;
  if (pAsin == "" || pName =="" || pDescription =="" || pgroup=="") {
		checkstatus = false;
		console.log("enter the appropriate details");
    res.json("There was a problem with this action");
	}
	
if(checkstatus){

var queryUpdate = "UPDATE product_table SET ";
		var isValueChanged = false; 
		if(typeof pName != 'undefined' && pName.length >0 ) {
			isValueChanged = true;	
			queryUpdate = queryUpdate+ "name = '"+pName+"' , ";
		}
		if(typeof pDescription != 'undefined' && pDescription.length >0 ) {
			isValueChanged = true;
			queryUpdate = queryUpdate+ "productDescription = '"+pDescription+"' , ";
		}
    if(typeof pgroup != 'undefined' && pgroup.length >0 ) {
			isValueChanged = true;
			queryUpdate = queryUpdate+ "pgroup = '"+pgroup+"' , ";
		}
  if(isValueChanged) {

			queryUpdate = queryUpdate.substring(0, queryUpdate.length - 2);

			queryUpdate = queryUpdate+ " WHERE asin = '"+pAsin+"'";

			queryUpdate = mysql.format(queryUpdate);
      poolWrite.getConnection(function(err,con){
			con.query(queryUpdate,function(err,rows){
         con.release();
	            if(err) {
	                res.json("There was a problem with this action");
	            } 
            //   else {
	          //   	if(rows.changedRows <=0 ) {
			    	// 	res.json("No rows were updated");
			    	// } 
            else {
	                	res.json("The product information has been updated");
			    	}
	            // }
	        });
  });
		}
		else {
			res.json("There was a problem with this action");
		}
  }
  }
    else{
      res.json("Only admin can perform this action");
    }
  }
  else{
    res.json("You must be logged in to perform this action");
  }
});

app.post('/viewUsers',function(req,res) {
  var firstname = req.query.fname;
  var lastname = req.query.lname;
  var personrole = req.session.role;
  var users = {};
  var users1 =[];
  var j=0;
  var sess =req.session;
  if(sess.username){
    if(sess.role=='admin'){
        var nameQuery = "SELECT * FROM users_table WHERE firstname LIKE ";
        if(typeof firstname == 'undefined' || firstname.length ==0 ) {
            firstName="'%'";
        } else {
            firstName="'%"+firstname+"%'";
        }

        nameQuery += firstName+" AND lastname LIKE ";
         
        if(typeof lastname == 'undefined' || lastname.length ==0 ) {
            lastName="'%'";    
        } else {
            lastName="'%"+lastname+"%'";
        }   
        nameQuery += lastName;
        poolRead.getConnection(function(err,con){
        con.query(nameQuery,function(err,rows){
           con.release();
            if(err) {
                res.json("Error executing MySQL query");
            } else {
              for(var i=0;i<rows.length;i++){
                var fname = rows[i].firstname;
                var lname = rows[i].lastname;
                var user = "fname:"+fname +" "+","+"lname:"+ lname;
                users1[j++]=user;
                user="";
              }
                users = users1;
                res.json({'User_list': users});
            }
        });
    });

        } else {
            res.json("Only admin can perform this action");
        }
   }
  else{
    res.json("You must be logged in to perform this action");
  }
});
app.post('/viewProducts',function(req,res) {
  var asin = req.body.asin;
  var group = req.body.categories;
  var keyword= req.body.keyword;
  var personrole = req.session.role;
  var products = {};
  var products1 =[];
  var j=0;
  var sess = req.session;
        if(typeof group == 'undefined' || group.length ==0 ) {
            group="'%'";    
        } else {
            group="'%"+group+"%'";
        }   
         if(typeof keyword == 'undefined' || keyword.length ==0 ) {
            keyword="'%'";    
        } else {
            keyword="'%"+keyword+"%'";
        } 
  if(typeof asin !='undefined' && asin != "") {
        //console.log("asin defined");
        //console.log(asin);
			var query = "SELECT name FROM product_table WHERE asin ='"+asin+"'";
			//console.log(query);
        poolRead.getConnection(function(err,con){
		    con.query(query,function(err,rows){
           con.release();
           if (rows.length == 0)
            res.json("There were no products in the system that met that criteria");
		        if(err) {
              console.log(err);
		            res.json("Error executing MySQL query");
		        } else {
		        	  if(!err){
                if(rows.length > 0){
                    //res.send(results);
                    var finalResults = "product_list:[{name:"
                    for(var i=0;i<rows.length;i++){
                          if(i){
                            finalResults += ',name:';
                          }
                     finalResults+=rows[i]["name"];
                     finalResults += '}'
                    }
                    finalResults += ']'
                }
                    res.send(finalResults);
            }
            else{
                res.send(err.message);
            }
		        }
			});
});
		}
  else if ((typeof group != undefined && group !="'%'") && ( keyword =="'%'")){
      //console.log(group);
      //console.log("group defined and keyword undefined");
var query = "";
  poolRead.getConnection(function(err,con){
  con.query('SELECT name from product_table where pgroup like '+group+' limit 1000', function(err, rows) {
   //console.log(group);
   //console.log(query);
    //console.log(err);
   con.release();
        if (rows.length == 0)
            res.json("There were no products in the system that met that criteria");
        else {
		        	  if(!err){
                if(rows.length > 0){
                    //res.send(results);
                    var finalResults = "product_list:[{name:"
                    for(var i=0;i<rows.length;i++){
                          if(i){
                            finalResults += ',name:';
                          }
                     finalResults+=rows[i]["name"];
                     finalResults += '}'
                    }
                    finalResults += ']'
                }
                    res.send(finalResults);
            }
            else{
                res.send(err.message);
            }
		        }
    });
    });
    }
     
     else if ((typeof keyword != undefined && keyword !="'%'") && ( group =="'%'")){
      console.log(group);
      console.log("group undefined and keyword defined");
var query = "";
  poolRead.getConnection(function(err,con){
  con.query('SELECT name from product_table where match(name,productDescription) against ('+keyword+') limit 1000', function(err, rows) {
   console.log(group);
   console.log(query);
    console.log(err);
   con.release();
        if (rows.length == 0)
            res.json("There were no products in the system that met that criteria");
        else {
		        	  if(!err){
                if(rows.length > 0){
                    //res.send(results);
                    var finalResults = "product_list:[{name:"
                    for(var i=0;i<rows.length;i++){
                          if(i){
                            finalResults += ',name:';
                          }
                     finalResults+=rows[i]["name"];
                     finalResults += '}'
                    }
                    finalResults += ']'
                }
                    res.send(finalResults);
            }
            else{
                res.send(err.message);
            }
		        }
    });
    });
    }
    
     else if ((typeof group != undefined && group !="'%'") && (typeof keyword != undefined && keyword !="'%'")){
       console.log(group);
       console.log(keyword);
       console.log("group and keyword both defined");
		var query = "";
  poolRead.getConnection(function(err,con){
  con.query('SELECT name from product_table where pgroup like '+group+' or match(name,productDescription) against ('+keyword+') limit 1000', function(err, rows) {
   con.release();
   console.log(query);
        if (rows.length == 0)
            res.json("There were no products in the system that met that criteria");
        else {
		        	  if(!err){
                if(rows.length > 0){
                    //res.send(results);
                    var finalResults = "product_list:[{name:"
                    for(var i=0;i<rows.length;i++){
                          if(i){
                            finalResults += ',name:';
                          }
                     finalResults+=rows[i]["name"];
                     finalResults += '}'
                    }
                    finalResults += ']'
                }
                    res.send(finalResults);
            }
            else{
                res.send(err.message);
            }
		        }
    });
    });
    }
    
    else{
      console.log("nothing defined");
      console.log(group);
       console.log(keyword);
      var query = "";
poolRead.getConnection(function(err,con){
con.query('SELECT * from product_table limit 1000', function(err, rows) {
   //console.log(query);
   con.release();
        if (rows.length == 0)
            res.json("There were no products in the system that met that criteria");
        else {
		        	  if(!err){
                if(rows.length > 0){
                    //res.send(results);
                    var finalResults = "product_list:[{name:"
                    for(var i=0;i<rows.length;i++){
                          if(i){
                            finalResults += ',name:';
                          }
                     finalResults+=rows[i]["name"];
                     finalResults += '}'
                    }
                    finalResults += ']'
                }
                    res.send(finalResults);
            }
            else{
                res.send(err.message);
            }
		        }
    });
    });

    }
});

// app.post('/buyProducts',function(req,res) {
//   var sess=req.session;
//   var customer=sess.username;
//   console.log(customer);
//   var asin = req.body.asin;
//   var input_asins = asin.substring(1, asin.length-1);
//   var asin_array = input_asins.split(',');
//   console.log(asin_array);
//   console.log(asin_array[0]);
//   asin_array.forEach(function(value){
//  var query = "INSERT INTO ??(??,??,??) VALUES (?,?,?) on duplicate key update quantity = quantity+1";
        
//     var addProduct = ["buy_products","customer","asin","quantity",customer,value,1];
    
//     query = mysql.format(query,addProduct);
// pool.getConnection(function(err,con){ 
//       con.query(query,function(err,rows){
//         console.log(query);
//          con.release();
//         if(err) {
//           console.log(err);
//             res.json({"message" : "There was a problem with this action"});
//         } else {
//             res.json({"message" : value});
//         }
//     });  
// });
//   });

// })
app.post('/buyProducts',function(req,res){
    if(req.session.username){
      console.log(req.session.username);
        updateProductsPurchased(req.session,req.body,function(err,data){
            if(!err){
                updateRecommendation(req.body,function(err,data){
                    if(!err){
                        res.send("The product information has been updated");
                    }
                    else{
                    res.send(err.message);
                    }
            })
            }
            else{
                res.send(err.message);
            }
        })
       }
       else{
           res.send("There was a problem with this action")
       }
})

function updateProductsPurchased(session,products,fn){
    poolWrite.getConnection(function(err,connection) {
    if (err) {
          connection.release();
          return;
        }
            var temp = products.asin.replace("[","");
            var list = temp.replace("]","").split(",");
            var values="";
            var total=0;
            for(var i=0;i<list.length;i++){
                if(total){
                    values += ',';
                }
                values += `('${list[i]}','${session.username}')`;
                total++;
            }    
            connection.query('insert into productsPurchased (asin,username) values '+values, 
                function (err,results){
                    connection.release();
                    if(err){
                            console.log(query.sql)
                            console.log(err.message)
                            //console.log("Product cannot be updated - duplicate entry");
                            return fn(new Error("There was a problem with this action"));
                        }

                    else{
                        return fn(null,true);
                    }
            
        });
    });
}

function updateRecommendation(products,fn){
    poolWrite.getConnection(function(err,connection) {
    if (err) {
          connection.release();
          return;
        }
            var temp = products.asin.replace("[","");
            var list = temp.replace("]","").split(",").slice().sort();
            var results = [];
            for (var i = 0; i < list.length; i++) {
                if (i+1 < list.length && list[i + 1] == list[i]) {
                    continue;
                }
                results.push(list[i]);
            }
            if(results.length>1)
            {
                        var total =0;
                        var values = "";
                        for(var i=0;i<results.length;i++){
                            for(var j=0;j<results.length;j++){
                                if(i==j){
                                    continue;
                                }
                                if(total){
                                    values +=',';
                                }
                            values +=`('${results[i]}','${results[j]}')`;
                            total++;
                        }
                    }
                    connection.query('Insert into recom (bought,alsobought) values '+values,function(err,results){
                        connection.release();
                        if(    err){
                            console.log(query.sql)
                            console.log(err.message)
                            return fn(new Error("There was a problem with this action"));
                        }
                        else{
                            return fn(null,true);
                        }
                    })
            }
            else{
                connection.release();
                return fn(null,true);
            }    
            
        });
}
// app.post('/productsPurchased', function(req,res) {
//   var sess = req.session;
//   var role = sess.role;
//   var products = {};
//   var products1 =[];
//   var j=0;
//   console.log(role);
//   var username=req.body.username;
//   var query="";
//   if(role =='admin'){
//     console.log("entering");
//     var query1 = 'SELECT asin,quantity from buy_products where customer = '+username+'';
//     console.log(query1);
//    pool.getConnection(function(err,con){
//   con.query("SELECT asin,quantity from buy_products where customer = '"+username+"'", function(err, rows) {
//    console.log(query);
//    con.release();
//         if (rows.length == 0)
//             res.json("There were no products in the system that met that criteria");
//         else if(!err && rows.length > 0){
//             console.log('displaying results');
//             for(var i=0;i<rows.length;i++){
//                 var asin = rows[i].asin;
//                 var quantity=rows[i].quantity;
//                 var product = ["asin:"+asin,"quantity:"+quantity];
//                 products1[j++]=product;
//                 product="";
//               }
//                 products = products1;
//                 res.json({'product_list': products});
//             }
//     });
//     });

//   }

// })
app.post('/productsPurchased',function(req,res){
    if(req.session.role){
        viewBoughtProducts(req.body.username,function(err,data){
            if(!err){
                if(data.length > 0){
                    //res.send(results);
                    console.log("3");
                    var finalResults = "product_list:{"
                    for(var i=0;i<data.length;i++){
                          if(i){
                            finalResults += ',';
                          }
                          console.log("4");
                     finalResults+=data[i]["name"];
                    }
                    finalResults += '}'
                    console.log("7");
                res.send(finalResults);
                }
                //     finalResults += '}'
                //     console.log("7");
                // res.send(finalResults);
                res.send("There was a problem with this action");
            }
            else{
              console.log("5");
                res.send(err.message);
            }
        })
       }
       else{
            console.log("1");
           res.send("There was a problem with this action")
       }

})

function viewBoughtProducts (user,fn){
    poolRead.getConnection(function(err,connection) {
    if (err) {
          connection.release();
          return;
        }   var query1="select p.name,count(*) as quantity from productsPurchased pp, product_table p where pp.username='"+user+"' and pp.asin=p.asin group by pp.asin";
            console.log(query1);
            var query=connection.query("select p.name,count(*) as quantity from productsPurchased pp, product_table p where pp.username='"+user+"' and pp.asin=p.asin group by pp.asin", function (err,results){
                    connection.release();
                    if(err){
                            console.log(query.sql);
                            console.log("2");
                            //console.log("Product cannot be updated - duplicate entry");
                            return fn(new Error("There was a problem with this action"));
                        }
                        else{
                            //console.log(results)
                            console.log("6");
                            return fn(null,results);
                        }
                    });
            
                
            
        });
}


// app.post('/getRecommendations', function (req,res) {
//   var sess = req.session;
//   var asin = req.body.asin;



// })
app.post('/getRecommendations',function(req,res){
    getRecommendations(req.body.asin,function(err,data){
        if(!err){
                if(data.length > 0){
                    //res.send(results);
                    var finalResults = ""
                    for(var i=0;i<data.length;i++){
                          if(i){
                            finalResults += ',';
                          }
                     finalResults+=data[i]["name"];
                    }
                }
                    res.send(finalResults);
            }
            else{
                res.send(err.message);
            }
    })
})

function getRecommendations(asin,fn){
    poolRead.getConnection(function(err,connection) {
    if (err) {
          connection.release();
          return;
        }
        connection.query("select name from product_table p join (select alsobought from recom where bought ='"+asin+"' group by alsobought order by count(*) desc limit 5) as r on p.asin=r.alsobought;",
            function(err,results){
                connection.release();
                if(err){
                    console.log(query.sql)
                    console.log(err.message);
                    return fn(new Error("There was a problem with this action"));
                }
                else{
                    return fn(null,results);
                }
            })
})
}

 
 app.post('/logout', function(req,res){
   var sess=req.session;
   if(sess.username){
     sess.destroy();
     res.json("You have been logged out");
   }
   else{
     res.json("You are not currently logged in");
   }
   
 });
var serve = http.createServer(app);
serve.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});



