'use strict';

/**
 * @ngdoc function
 * @name stockDogApp.controller:DashboardCtrl
 * @description
 * # DashboardCtrl
 * Controller of the stockDogApp
 */
angular.module('stockDogApp')
  .controller('DashboardCtrl', function ($scope, WatchlistService, QuoteService) {
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
  });
