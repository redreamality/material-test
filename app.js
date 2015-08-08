/**
 * Created by xie on 2015/7/15.
 */

var myapp = angular.module('starterApp', ['ngMaterial'])

myapp.factory('globalFunctions', function() {
    return {
        greet: greet,
        log: log
    };
});


angular.element(document).ready(function () {

    //alert('ready')
});



myapp.controller('AppCtrl', function ($scope, $timeout, $mdSidenav, $mdUtil, $log) {

    $scope.toggleLeft = buildToggler('left');
    $scope.toggleRight = buildToggler('right');

    /**
     * Build handler to open/close a SideNav; when animation finishes
     * report completion in console
     */
    function buildToggler(navID) {
        var debounceFn =  $mdUtil.debounce(function(){
            $mdSidenav(navID)
                .toggle()
        },100);
        return debounceFn;
    }

    $scope.settings = {
        n1l:0.29,
        n2l:0.45,
        n1d:20,
        n2d:43,
        nsim:0.0776
    };
    $scope.code=""

    $scope.change = function() {
        Halfviz("#halfviz").updateGraph()
    };

})


myapp.controller('graphCtrl',function ($scope, $timeout, $mdSidenav, $log) {
    $scope.data={
        detail:[{
            source:"1",
            target:"2"

        }]

    }

})
//.controller('LeftCtrl', function ($scope, $timeout, $mdSidenav, $log) {
//    $scope.close = function () {
//        $mdSidenav('left').close()
//    };
//})
//.controller('RightCtrl', function ($scope, $timeout, $mdSidenav, $log) {
//    $scope.close = function () {
//        $mdSidenav('right').close()
//
//    };
//})


//.run();



