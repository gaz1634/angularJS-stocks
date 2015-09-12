'use strict';

/**
 * @ngdoc directive
 * @name stockDogApp.directive:stkSignFade
 * @description
 * # stkSignFade
 */
angular.module('stockDogApp')
  .directive('stkSignFade', function ($animate) {
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
  });
