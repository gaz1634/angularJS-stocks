'use strict';

var NUMBER_REGEXP = /^\s*(\-|\+)?(\d+|(\d*(\.\d*)))\s*$/;

/**
 * @ngdoc directive
 * @name stockDogApp.directive:contenteditable
 * @description
 * # contenteditable
 */
angular.module('stockDogApp')
  .directive('contenteditable', function ($sce) {
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
  });
