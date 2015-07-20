/**
 * Created by xie on 2015/7/15.
 */
angular
    .module('starterApp', ['ngMaterial'])
    .controller('AppCtrl', function ($scope, $timeout, $mdSidenav, $mdUtil, $log) {

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

        $scope.color = {
            red: Math.floor(Math.random() ),
            green: Math.floor(Math.random()),
            blue: Math.floor(Math.random() )
        };




    })
    .controller('graphCtrl',function ($scope, $timeout, $mdSidenav, $log) {
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


    .run();



