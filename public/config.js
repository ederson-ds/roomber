var app = angular.module('app', ['ngRoute']);

var URL = "/";

app.constant('URL', URL);

app.config(function($routeProvider, $locationProvider, URL) {
    $routeProvider
        .when(URL, {
            controller: "Home",
            templateUrl: URL + "templates/home.html"
        })
        .otherwise({
            template: "<h1>None</h1><p>Nothing has been selected</p>",
        });
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
})

$('body').on('contextmenu', 'img', function(e) { return false; });