var pg = require('pg'),
	dbConnect = require('../res/settings.js').db,
	pg = require('../data/postgresHelper.js'),
	speechContract = require('../data/summaryContract').speech,
	summaryContract = require('../data/summaryContract').summary,
	assert = require('assert'),
	log = require('../log.js'),
	debug = require('../debug.js'),
	Q = require('q');

speechContract.tableName = "test_speech";
summaryContract.tableName = "test_summary";
summaryContract.constraint.foreignKey.referenceTable = speechContract.tableName;

var readTest = function(result){
	assert(result.rowCount);
	return Q.promise(function(resolve, reject, notify){
		resolve();
	});
}

var insertTestSummary = function(result){
	return pg.queryPromise(pg.buildSQLInsertString(summaryContract.tableName,
		summaryContract.getColumns(),
		[result.rows[0]._id,
			pg.quotify("test_model"),
			pg.quotify("test_params"),
			pg.dollarize("this != summary")]))
}

var testCursor = function(){
	return Q.promise(function(resolve, reject, notify){
		var speechCursor = new pg.Cursor("SELECT * FROM " + speechContract.tableName);
		speechCursor.next()
			.then(function(rows){
				assert(rows.length > 0);
				speechCursor.close();
				resolve();
			})
			.catch(reject);
	});
}

pg.queryPromise(speechContract.createDbString())
	.then(pg.chainQueryPromise(pg.buildSQLInsertString(speechContract.tableName,
		speechContract.getColumns(),
		["'This is not a summary'",
			"'http://www.notasummary.com'",
			"'llpp'",
			"'2000-01-01'",
			"2",
			"3000",
			"1",
			"'1erelecture'",
			"'assemblee'",
			"'true'"])))
	.then(pg.chainQueryPromise("SELECT * FROM " + speechContract.tableName))
	.then(readTest)
	.then(pg.chainQueryPromise(summaryContract.createDbString()))
	.then(pg.chainQueryPromise("SELECT * FROM " + speechContract.tableName))
	.then(insertTestSummary)
	.then(pg.chainQueryPromise("SELECT * FROM " + summaryContract.tableName))
	.then(readTest)
	.then(testCursor)
	.then(function(result){
		return Q.promise(function(resolve, reject, notify){
			console.log("testDb: OK");
			resolve();
		});
	})
	.fin(function(){
		pg.queryPromise("DROP TABLE " + summaryContract.tableName)
			.then(pg.chainQueryPromise("DROP TABLE " + speechContract.tableName))
			.catch(log)
	})
	.catch(log);

//TO DO: add tests for summary table·

