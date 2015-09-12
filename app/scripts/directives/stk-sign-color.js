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
