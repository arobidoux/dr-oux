(function (){
    "use strict";
function StatsController($scope, $timeout, $http) {

    $scope.formatPlayers = function(stats) {
        return stats.map(function(stat){return stat.player.name;}).join(", ")
    };


    $scope.winrate = function(player) {
        return Math.floor( player.totalgamewon / player.totalgameplayed * 1000 ) / 10;
    };

    $scope.pillefficacy = function(player) {
        return Math.floor( player.totalviruskilled*3 / player.totalpillused * 1000 ) / 10;
    };

    $scope.$replays = new Paginator(function(params) {
        var p = $http.get("/stats/replays", { params: params });
        p.then(function(res){
            $scope.replays = res.data.replays;    
        });
        return p;
    });

    $scope.$players = new Paginator(function(params) {
        var p = $http.get("/stats/players", { params: params });
        p.then(function(res){
            $scope.players = res.data.players;
        });
        return p;
    });


    //$scope.$replays.loadPage(1);
    $scope.$players.loadPage(1);
}

function Paginator(http) {
    this.page = 0;
    this.lastpage = 0;
    
    this._http = http;
}

Paginator.PAGE_DISPLAYED = 5;

Paginator.prototype.loadPage = function(p) {
    if(p == this.page) {
        return;
    }
    this._http({
        page: p
    }).then(function(res){
        this.page = res.data.page;
        this.lastpage = res.data.lastpage;
        this.count = res.data.total;
    }.bind(this));
};

Paginator.prototype.pages = function() {
    var pages = [];
    if(this.page) {
        pages.push(1);
        var offset = this.page - Math.floor(Paginator.PAGE_DISPLAYED/2);
        for(var i=0; i<Paginator.PAGE_DISPLAYED; i++) {
            var p = i + offset;
            if(p>1 && p<this.lastpage) {
                pages.push(p);
            }
        }
        pages.push(this.lastpage);
    }
    return pages;
};

angular.module("app").controller("StatsController",["$scope", "$timeout", "$http", StatsController]);
    
})();
