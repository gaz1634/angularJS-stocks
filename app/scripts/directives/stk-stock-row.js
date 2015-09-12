'use strict';

/**
 * @ngdoc directive
 * @name stockDogApp.directive:stkStockRow
 * @description
 * # stkStockRow
 */
angular.module('stockDogApp')
  .directive('stkStockRow', function ($timeout, QuoteService) {
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
  });
