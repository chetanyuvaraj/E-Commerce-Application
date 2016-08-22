/*
lineReader will extract the records from amazon-meta.txt one at a time as
file is too large to read all at once.  In order to add records to a database you need to add code below to insert records

This code depnds on "line-reader"

You need to install line-reader by using the following command:
npm install line-reader

*/

//This assumes that you're using mysql.  You'll need to change this if you're using another database
var mysql      = require('mysql'),
    co         = require('co'),
    wrapper    = require('co-mysql');
var query;
var jsonRecord;
var execute = true;
var query;
var totalRecords = 0;

var lineReader = require('line-reader');


//You need to change this to be appropriate for your system
var connection = mysql.createConnection({
  host     : 'userdb.cluster-cwkx3zi039zq.us-east-1.rds.amazonaws.com',
  port: '3306',
  user     : 'root',
  password : 'MyNewPass',
  database : 'userdb'
});

var sql = wrapper(connection);

var values = ""; //The records read from the file.
var numRecords = 0; //The current number of records read from the file.
var recordBlock = 100; //The number of records to write at once.
lineReader.eachLine('jsonRecords.txt', function(line, last) {
  execute = false;
  currentLine = line.toString().replace(/'/g, "\"", "g");
  try{
    jsonRecord = JSON.parse(currentLine);


    if (numRecords) {
      values += ', ';
    }

    values += `('${jsonRecord.title}', '${jsonRecord.description}', '${jsonRecord.asin}','${jsonRecord.categories}')`;
    numRecords++;
    //console.log('the values are:',values);

//Change the query to align with your schema
    if (numRecords == recordBlock) {
      query = `INSERT INTO product_table (name, productDescription, asin, pgroup) VALUES ${values};`; //Template, replaces ${values} with the value of values.
     // console.log(query);
      values = "";
      numRecords = 0;
      execute = true;
    }
  }catch(err) {
    execute = false;//there was a quote in the text and the parse failed ... skip insert
  }
  if(execute){
    co(function* () {
        var resp = yield sql.query(query);
        totalRecords += recordBlock;
        console.log(totalRecords + " records inserted.");
    });
  }
  else{
   // console.log("error");
  }//if(execute)
});//lineReader.eachLine
