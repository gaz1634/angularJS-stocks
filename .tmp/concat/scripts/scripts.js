'use strict';

/**
 * @ngdoc overview
 * @name stockDogApp
 * @description
 * # stockDogApp
 *
 * Main module of the application.
 */
angular
  .module('stockDogApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'mgcrea.ngStrap',
    'googlechart'
  ])
  .config(["$routeProvider", function ($routeProvider) {
    $routeProvider
      .when('/dashboard', {
        templateUrl: 'views/dashboard.html',
        controller: 'DashboardCtrl'
      })
      .when('/watchlist/:listId', {
        templateUrl: 'views/watchlist.html',
        controller: 'WatchlistCtrl'
      })
      .otherwise({
        redirectTo: '/dashboard'
      });
  }]);

'use strict';

/**
 * @ngdoc service
 * @name stockDogApp.WatchlistService
 * @description
 * # WatchlistService
 * Service in the stockDogApp.
 */
angular.module('stockDogApp')
  .service('WatchlistService', function WatchlistService() {
	  
		 // Augment Stocks with additional helper functions
		var StockModel = {
			save : function() {
				var watchlist = findById(this.listId);
				watchlist.recalculate();
				saveModel();
			}
		};
	    

		// Augment watchlists with additional helper functions
		var WatchlistModel = {
			addStock : function(stock) {
				var existingStock = _
						.find(
								this.stocks,
								function(s) {
									return s.company.symbol === stock.company.symbol;
								});
				if (existingStock) {
					existingStock.shares += stock.shares;
				} else {
					_.extend(stock, StockModel);
					this.stocks.push(stock);
				}
				this.recalculate();
				saveModel();
			},
			removeStock : function(stock) {
				_.remove(
								this.stocks,
								function(s) {
									return s.company.symbol === stock.company.symbol;
								});
				this.recalculate();
				saveModel();
			},
			recalculate : function() {
				var calcs = _.reduce(this.stocks, function(calcs,
						stock) {
					calcs.shares += stock.shares;
					calcs.marketValue += stock.marketValue;
					calcs.dayChange += stock.dayChange;
					return calcs;
				}, {
					shares : 0,
					marketValue : 0,
					dayChange : 0
				});
				this.shares = calcs.shares;
				this.marketValue = calcs.marketValue;
				this.dayChange = calcs.dayChange;
			}
		};
		
		
	// Helper: Load watchlists from localStorage
	var loadModel = function() {
		var model = {
			watchlists : localStorage['StockDog.watchlists'] ? JSON
					.parse(localStorage['StockDog.watchlists'])
					: [],
			nextId : localStorage['StockDog.nextId'] ? parseInt(localStorage['StockDog.nextId'])
					: 0
		};
		_.each(model.watchlists, function(watchlist) {
			_.extend(watchlist, WatchlistModel);
			_.each(watchlist.stocks, function(stock) {
				_.extend(stock, StockModel);
			});
		});
		return model;
	};
	// Save a new watchlist to watchlists model
	this.save = function(watchlist) {
		watchlist.id = Model.nextId++;
		watchlist.stocks = [];
		_.extend(watchlist, WatchlistModel);
		Model.watchlists.push(watchlist);
		saveModel();
	};

    var saveModel = function(){
      localStorage['StockDog.watchlists'] = JSON.stringify(Model.watchlists);
      localStorage['StockDog.nextId'] = Model.nextId;
    };

    var findById = function(listId){
      return _.find(Model.watchlists, function(watchlist){
        return watchlist.id === parseInt(listId);
        });
    };

    this.query = function(listId){
      if(listId){
	return findById(listId);
      }else{
	return Model.watchlists;
      }
    };

    this.save = function(watchlist){
    	watchlist.id = Model.nextId++;
    	watchlist.stocks = [];
    	_.extend(watchlist, WatchlistModel);
    	console.log(watchlist);
        Model.watchlists.push(watchlist);
        saveModel();
    };

    this.remove = function(watchlist){
		_.remove(Model.watchlists, function(list){
		  return list.id === watchlist.id;
		});
		saveModel();
    };

    var Model = loadModel();
        
  });

'use strict';

/**
 * @ngdoc directive
 * @name stockDogApp.directive:stkWatchlistPanel
 * @description
 * # stkWatchlistPanel
 */
angular.module('stockDogApp')
  .directive('stkWatchlistPanel', ["$location", "$modal", "$routeParams", "WatchlistService", function ($location, $modal, $routeParams, WatchlistService) {
    return {
      templateUrl: 'views/templates/watchlist-panel.html',
      restrict: 'E',
      scope: {},
      link: function ($scope) {
	$scope.watchlist = {};
	var addListModal = $modal({
		scope: $scope,
		template: 'views/templates/addlist-modal.html',
		show: false
	});

	$scope.watchlists = WatchlistService.query();

	$scope.showModal = function(){
		addListModal.$promise.then(addListModal.show);
	};
	

	$scope.createList = function(){
		WatchlistService.save($scope.watchlist);
		addListModal.hide();
		$scope.watchlist = {};
	};

	$scope.deleteList = function(list){
		WatchlistService.remove(list);
		$location.path('/');	
	};
	
	$scope.currentList = $routeParams.listId;
	$scope.gotoList = function(listId){
		$location.path('watchlist/' + listId);
	};
      }
    };
  }]);

'use strict';

/**
 * @ngdoc function
 * @name stockDogApp.controller:DashboardCtrl
 * @description
 * # DashboardCtrl
 * Controller of the stockDogApp
 */
angular.module('stockDogApp')
  .controller('DashboardCtrl', ["$scope", "WatchlistService", "QuoteService", function ($scope, WatchlistService, QuoteService) {
    var unregisterHandlers = [];
    
    $scope.watchlists = WatchlistService.query();
    
    $scope.cssStyle = 'height:300px;';
    var formatters = {
    		number: [
    		         {
    		        	 columnNum: 1,
    		        	 prefix: '$'
    		         }
    		]
    };
    
    
    var updateCharts = function(){
    	var donutChart = {
    			type: 'PieChart',
    			displayed: true,
    			data: [['Watchlist', 'Market Value']],
    			options: {
    				title: 'Market Value by Watchlist',
    				legend: 'none',
    				pinHole: 0.4
    			},
    			formatters:formatters
    	};
    	
    	var columnChart = {
    			type: 'ColumnChart',
    			displayed: true,
    			data: [['Watchlist', 'Change', {role: 'style'}]],
    			options: {
    				title: 'Day Change by Watchlist',
    				legend: 'none',
    				animation:{
    					duration: 1500,
    					easing: 'linear'
    				}
    			},
    			formatters: formatters
    	};
    	
    	_.each($scope.watchlists, function(watchlist){
    		donutChart.data.push([watchlist.name, watchlist.marketValue]);
    		
    		columnChart.data.push([watchlist.name, watchlist.dayChange, watchlist.dayChange < 0 ? 'Red' : 'Green']);
    	});

		$scope.donutChart = donutChart;
		$scope.columnChart = columnChart;
    };
    
    var reset = function(){
    	QuoteService.clear();
    	_.each($scope.watchlists, function(watchlist){
    		_.each(watchlist.stocks, function(stock){
    			QuoteService.register(stock);
    		});
    	});
    	
    	_.each(unregisterHandlers, function(unregister){
    		unregister();
    	});
    	
    	_.each($scope.watchlists, function(watchlist){
    		var unregister = $scope.$watch(function(){
    			return watchlist.marketValue;
    		}, function(){
    			recalculate();
    		});
    		unregisterHandlers.push(unregister);
    	});
    };
    
    var recalculate = function(){
    	$scope.marketValue = 0;
    	$scope.dayChange = 0;
    	_.each($scope.watchlists, function(watchlist){
    		$scope.marketValue += watchlist.marketValue ? watchlist.marketValue: 0;
    		$scope.dayChange += watchlist.dayChange ? watchlist.dayChange : 0;
    	});
    	updateCharts();
    };
    
    $scope.$watch('watchlists.length', function(){
    	reset();
    });
  }]);

'use strict';

/**
 * @ngdoc function
 * @name stockDogApp.controller:WatchlistCtrl
 * @description
 * # WatchlistCtrl
 * Controller of the stockDogApp
 */
angular.module('stockDogApp')
  .controller('WatchlistCtrl', ["$scope", "$routeParams", "$modal", "WatchlistService", "CompanyService", function ($scope, $routeParams, $modal, WatchlistService, CompanyService) {
	$scope.companies = CompanyService.query();
	$scope.watchlist = WatchlistService
			.query($routeParams.listId);
	$scope.stocks = $scope.watchlist.stocks;
	$scope.newStock = {};
	var addStockModal = $modal({
		scope : $scope,
		template : 'views/templates/addstock-modal.html',
		show : false
	});
	// [2] Expose showStockModal to view via $scope
	$scope.showStockModal = function() {
		addStockModal.$promise.then(addStockModal.show);
	};
	// [3] Call the WatchlistModel addStock() function and hide
	// the modal
	$scope.addStock = function() {
		$scope.watchlist.addStock({
			listId : $routeParams.listId,
			company : $scope.newStock.company,
			shares : $scope.newStock.shares
		});
		addStockModal.hide();
		$scope.newStock = {};
	};
  }]);

'use strict';

/**
 * @ngdoc function
 * @name stockDogApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the stockDogApp
 */
angular.module('stockDogApp')
  .controller('MainCtrl', ["$scope", "$location", "WatchlistService", function ($scope, $location, WatchlistService) {
    $scope.watchlists = WatchlistService.query();
    
    $scope.$watch(function(){
    	return $location.path();
    }, function(path){
    	if(_.contains(path, 'watchlist')){
    		$scope.activeView = 'watchlist';
    	}else{
    		$scope.activeView = 'dashboard';
    	}
    });
  }]);

'use strict';

/**
 * @ngdoc service
 * @name stockDogApp.CompanyService
 * @description
 * # CompanyService
 * Service in the stockDogApp.
 */
angular.module('stockDogApp')
  .service('CompanyService', ["$resource", function CompanyService($resource) {
	  return $resource('companies.json');
  }]);

'use strict';

/**
 * @ngdoc service
 * @name stockDogApp.QuoteService
 * @description
 * # QuoteService
 * Service in the stockDogApp.
 */
angular.module('stockDogApp')
  .service('QuoteService', ["$http", "$interval", function QuoteService($http, $interval) {
    var stocks = [];
    var BASE = 'http://query.yahooapis.com/v1/public/yql';
    
    var update = function(quotes){
    	console.log(quotes);
    	if(quotes.length === stocks.length){
    		_.each(quotes, function(quote, idx){
    			var stock = stocks[idx];
    			stock.lastPrice = parseFloat(quote.LastTradePriceOnly);
    			stock.change = quote.Change;
    			stock.percentChange = quote.ChangeinPercent;
    			stock.marketValue = stock.shares * stock.lastPrice;
    			stock.dayChange = stock.shares * parseFloat(stock.change);
    			stock.save();
    		});
    	}
    };
    
    this.register = function(stock){
    	stocks.push(stock);
    };
    
    this.deregister = function(stock){
    	_.remove(stocks, stock);
    };
    
    this.clear = function(){
    	stocks = [];
    };
    
    this.fetch = function(){
    	var symbols = _.reduce(stocks, function(symbols, stock){
    		symbols.push(stock.company.symbol);
    		return symbols;
    	}, []);
    	
    	var query = encodeURIComponent('select * from yahoo.finance.quotes ' + 
    			'where symbol in (\'' + symbols.join(',') + '\')');
    	var url = BASE + '?' + 'q=' + query + 
    		'&format=json&diagnostics=true' +
    		'&env=http://datatables.org/alltables.env';
    	
    	$http.jsonp(url + '&callback=JSON_CALLBACK')
    		.success(function(data){
    			if(data.query.count){
    				var quotes = data.query.count > 1 ? data.query.results.quote : [data.query.results.quote];
    				update(quotes);
    			}
    		})
    		.error(function(data){
    			console.log(data);
    		});
    };
    
    $interval(this.fetch, 5000);
  }]);

'use strict';

/**
 * @ngdoc directive
 * @name stockDogApp.directive:stkStockTable
 * @description
 * # stkStockTable
 */
angular.module('stockDogApp')
  .directive('stkStockTable', function () {
    return {
      templateUrl: 'views/templates/stock-table.html',
      restrict: 'E',
      $scope: {
    	  watchlist: '='
      },
      controller: ["$scope", function($scope){
    	  var rows = [];
    	  $scope.$watch('showPercent', function(showPercent){
    		 if(showPercent){
    			 _.each(rows, function(row){
    				 row.showPercent = showPercent;
    			 });
    		 } 
    	  });
    	  
    	  this.addRow = function(row){
    		  rows.push(row);
    	  };
    	  
    	  this.removeRow = function(row){
    		  _.remove(rows, row);
    	  };
      }],
      link: function postLink($scope, $element, $attrs) {
        $scope.showPercent = false;
        $scope.removeStock = function(stock){
        	$scope.watchlist.removeStock(stock);
        };
      }
    };
  });

'use strict';

/**
 * @ngdoc directive
 * @name stockDogApp.directive:stkStockRow
 * @description
 * # stkStockRow
 */
angular.module('stockDogApp')
  .directive('stkStockRow', ["$timeout", "QuoteService", function ($timeout, QuoteService) {
    return {
      restrict: 'A',
      require: '^stkStockTable',
      scope: {
    	stock: '=',
    	isLast: '='
      },
      link: function postLink($scope, $element, $attrs, stockTableCtrl) {
        $element.tooltip({
        	placement: 'left',
        	title: $scope.stock.company.name
        });
        
        stockTableCtrl.addRow($scope);
        
        QuoteService.register($scope.stock);
        
        $scope.$on('$destroy', function(){
        	stockTableCtrl.removeRow($scope);
        	QuoteService.deregister($scope.stock);
        });
        
        if($scope.isLast){
        	$timeout(QuoteService.fetch);
        }
        
        $scope.$watch('stock.shares', function(){
        	$scope.stock.marketValue = $scope.stock.shares * $scope.stock.lastPrice;
        	$scope.stock.dayChange = $scope.stock.shares * parseFloat($scope.stock.change);
        	$scope.stock.save();
        });
      }
    };
  }]);

'use strict';

var NUMBER_REGEXP = /^\s*(\-|\+)?(\d+|(\d*(\.\d*)))\s*$/;

/**
 * @ngdoc directive
 * @name stockDogApp.directive:contenteditable
 * @description
 * # contenteditable
 */
angular.module('stockDogApp')
  .directive('contenteditable', ["$sce", function ($sce) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function postLink($scope, $element, $attrs, ngModelCtrl) {
        if(!ngModelCtrl){
        	return;
        }
        
        ngModelCtrl.$render = function(){
        	$element.html($sce.getTrustedHtml(ngModelCtrl.$viewValue || ''));
        };
        
        var read = function(){
        	var value = $element.html();
        	if($attrs.type === 'number' && !NUMBER_REGEXP.test(value)){
        		ngModelCtrl.$render();
        	}else{
        		ngModelCtrl.$setViewValue(value);
        	}
        };
        
        if($attrs.type === 'number'){
        	ngModelCtrl.$parsers.push(function(value){
        		return parseFloat(value);
        	});
        }
        
        $element.on('blur keyup change', function(){
        	$scope.$apply(read);
        });
      }
    };
  }]);

'use strict';

/**
 * @ngdoc directive
 * @name stockDogApp.directive:stkSignColor
 * @description
 * # stkSignColor
 */
angular.module('stockDogApp')
  .directive('stkSignColor', function () {
    return {
      restrict: 'A',
      link: function postLink($scope, $element, $attrs) {
        $attrs.$observe('stkSignColor', function(newVal){
        	var newSign = parseFloat(newVal);
        	if(newSign >0){
        		$element[0].style.color = 'Green';
        	}else{
        		$element[0].style.color = 'Red';
        	}
    	});
      }
    };
  });

'use strict';

/**
 * @ngdoc directive
 * @name stockDogApp.directive:stkSignFade
 * @description
 * # stkSignFade
 */
angular.module('stockDogApp')
  .directive('stkSignFade', ["$animate", function ($animate) {
    return {
      restrict: 'A',
      link: function postLink($scope, $element, $attrs) {
    	  var oldVal = null;
        $attrs.$observe('stkSignFade', function(newVal){
        	console.log('stkSignFade');
        	if(oldVal && oldVal == newVal){
        		console.log('Returning');
        		return;
        	}
        	
        	var oldPrice = parseFloat(oldVal);
        	var newPrice = parseFloat(newVal);
        	oldVal = newVal;
        	
        	console.log(oldPrice);
        	console.log(newPrice);
        	if(oldPrice && newPrice){
        		var direction = newPrice - oldPrice >= 0 ? 'up' : 'down';
        		console.log('set direction: ' + direction);
        		
        		$animate.addClass($element, 'change-' + direction, function(){
        			$animate.removeClass($element, 'change-' + direction);
        		});
        	}
      	});
      }
    };
  }]);
