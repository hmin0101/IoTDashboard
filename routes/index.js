var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('dashboard');
});

router.get('/evaluation', function(req, res) {
  res.render('evaluation');
});

module.exports = router;
