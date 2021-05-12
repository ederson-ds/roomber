app.controller('Home', function($scope, $http, URL) {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    var socket = null;
    if (window.location.host == "localhost:3000") {
        socket = io('http://localhost:3000');
    } else {
        socket = io('https://roomber.herokuapp.com');
    }

    canvas.width = innerWidth;
    canvas.height = innerHeight;

    $scope.players = [];
    $scope.player_id = null;
    var players = [];

    socket.on('getPlayers', function(arrayPlayers) {
        $scope.players = arrayPlayers[0];
        $scope.player_id = arrayPlayers[1];

        $scope.players.forEach(player => {
            var achou = false;
            players.forEach(p => {
                if (p.player_id == player.usuario_id[0]) {
                    achou = true;
                }
            });
            if (!achou) {
                players.push(new Player(player.usuario_id[0], parseInt(player.xplayer), parseInt(player.yplayer), 10, 50, 'green'));
            }
        });
        //verify change x or y positions
        $scope.players.forEach(player => {
            players.forEach(p => {
                if (p.player_id == player.usuario_id[0] && (p.Xtile != player.xplayer || p.Ytile != player.yplayer)) {
                    if (!p.move) {
                        p.pathfinding.goToPath(p.Xtile, p.Ytile, player.xplayer, player.yplayer);
                    }
                }
            });
        });

        //verify if player get out
        players.forEach((p, index) => {
            var achou = false
            $scope.players.forEach(player => {
                if (p.player_id == player.usuario_id[0]) {
                    achou = true;
                }
            });
            if (!achou)
                players.splice(index, 1);
        });
    })

    function teste() {
        setTimeout(function() {
            socket.emit('getPlayers');
            teste()
        }, 2000);
    }

    teste();

    class Node {
        constructor(x, y, Xparent, Yparent, nodeEnd, isDiagonal) {
            this.x = x;
            this.y = y;
            this.f;
            this.g = isDiagonal ? 14 : 10;
            this.h;
            this.Xparent = Xparent;
            this.Yparent = Yparent;
            this.nodeEnd = nodeEnd;

            this.calculateG(isDiagonal);

            if (nodeEnd)
                this.calculateF();
        }

        calculateG(isDiagonal) {
            self = this;
            angular.forEach(this.listaAberta, function(node, key) {
                if (node.x == self.Xparent && node.y == self.Yparent) {
                    self.g = isDiagonal ? node.g + 14 : node.g + 10;
                }
            });
            angular.forEach(this.listaFechada, function(node, key) {
                if (node.x == self.Xparent && node.y == self.Yparent) {
                    self.g = isDiagonal ? node.g + 14 : node.g + 10;
                }
            });
        }

        draw(ctx) {
            ctx.font = "12px Arial";
            ctx.fillStyle = "#005500";
            ctx.fillText(this.g + "+" + this.h, Grid.getXposition(this.x, this.y) + 32, Grid.getYposition(this.x, this.y) + 16);
            ctx.fillStyle = "#0000ff";
            ctx.fillText(this.f, Grid.getXposition(this.x, this.y) + 32, Grid.getYposition(this.x, this.y) + 30);
        }

        calculateF() {
            var h = Math.abs(this.nodeEnd.y - this.y) + Math.abs(this.nodeEnd.x - this.x);
            this.h = (h * 10);
            this.f = this.g + this.h;
        }
    }

    class PathFind {
        listaAberta = [];
        listaFechada = [];
        achouNoFinal = false;
        rota = [];
        constructor(player) {
            this.player = player;
        }
        goToPath(Xinitial, Yinitial, XEnd, YEnd) {
            this.listaAberta = [];
            this.listaFechada = [];
            this.achouNoFinal = false;
            this.rota = [];
            var noAtual = new Node(Xinitial, Yinitial);
            var noFinal = new Node(XEnd, YEnd);

            this.listaFechada.push(noAtual);

            // right
            tiles.forEach(tile => {
                if (tile.x == Grid.getXposition(Xinitial - 1, Yinitial + 1) && tile.y == Grid.getYposition(Xinitial - 1, Yinitial + 1)) {
                    if (this.verificaNoFinal(tile, noFinal)) {
                        this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, true));
                        this.tracePath(noFinal);
                        return;
                    }
                    this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, true));
                }
            });

            // up right
            tiles.forEach(tile => {
                if (tile.x == Grid.getXposition(Xinitial - 1, Yinitial) && tile.y == Grid.getYposition(Xinitial - 1, Yinitial)) {
                    if (this.verificaNoFinal(tile, noFinal)) {
                        this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, true));
                        this.tracePath(noFinal);
                        return;
                    }
                    this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, false));
                }
            });
            // up
            tiles.forEach(tile => {
                if (tile.x == Grid.getXposition(Xinitial - 1, Yinitial - 1) && tile.y == Grid.getYposition(Xinitial - 1, Yinitial - 1)) {
                    if (this.verificaNoFinal(tile, noFinal)) {
                        this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, true));
                        this.tracePath(noFinal);
                        return;
                    }
                    this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, true));
                }
            });
            // up left
            tiles.forEach(tile => {
                if (tile.x == Grid.getXposition(Xinitial, Yinitial - 1) && tile.y == Grid.getYposition(Xinitial, Yinitial - 1)) {
                    if (this.verificaNoFinal(tile, noFinal)) {
                        this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, true));
                        this.tracePath(noFinal);
                        return;
                    }
                    this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, false));
                }
            });
            // left
            tiles.forEach(tile => {
                if (tile.x == Grid.getXposition(Xinitial + 1, Yinitial - 1) && tile.y == Grid.getYposition(Xinitial + 1, Yinitial - 1)) {
                    if (this.verificaNoFinal(tile, noFinal)) {
                        this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, true));
                        this.tracePath(noFinal);
                        return;
                    }
                    this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, true));
                }
            });
            // bottom
            tiles.forEach(tile => {
                if (tile.x == Grid.getXposition(Xinitial + 1, Yinitial + 1) && tile.y == Grid.getYposition(Xinitial + 1, Yinitial + 1)) {
                    if (this.verificaNoFinal(tile, noFinal)) {
                        this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, true));
                        this.tracePath(noFinal);
                        return;
                    }
                    this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, true));
                }
            });
            // bottom left
            tiles.forEach(tile => {
                if (tile.x == Grid.getXposition(Xinitial + 1, Yinitial) && tile.y == Grid.getYposition(Xinitial + 1, Yinitial)) {
                    if (this.verificaNoFinal(tile, noFinal)) {
                        this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, true));
                        this.tracePath(noFinal);
                        return;
                    }
                    this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, false));
                }
            });
            // bottom right
            tiles.forEach(tile => {
                if (tile.x == Grid.getXposition(Xinitial, Yinitial + 1) && tile.y == Grid.getYposition(Xinitial, Yinitial + 1)) {
                    if (this.verificaNoFinal(tile, noFinal)) {
                        this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, true));
                        this.tracePath(noFinal);
                        return;
                    }
                    this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, false));
                }
            });
            if (!this.achouNoFinal)
                this.loop(noFinal);
        }

        verificaNoFinal(tile, noFinal) {
            var achou = false;
            if (tile.Xtile == noFinal.x && tile.Ytile == noFinal.y) {
                achou = true;
            }
            return achou;
        }

        tracePath(noFinal) {
            // pega o no final
            angular.forEach(this.listaAberta, function(node, key) {
                if (noFinal.x == node.x && noFinal.y == node.y) {
                    noFinal = node;
                }
            });

            var Xparent = noFinal.Xparent;
            var Yparent = noFinal.Yparent;
            var rota = [];
            while (Xparent != null) {
                var noAtual = null;
                angular.forEach(this.listaAberta, function(node, key) {
                    if (Xparent == node.x && Yparent == node.y) {
                        noAtual = node;
                    }
                });
                angular.forEach(this.listaFechada, function(node, key) {
                    if (Xparent == node.x && Yparent == node.y) {
                        noAtual = node;
                    }
                });
                Xparent = noAtual.Xparent;
                Yparent = noAtual.Yparent;
                rota.push(noAtual);
            }
            rota.unshift(noFinal);
            rota.reverse();
            this.rota = rota;
            this.rota.splice(0, 1);
            this.achouNoFinal = true;
            this.player.move = true;
            this.player.currentNode = this.rota[0];
        }

        verificaNodeNaListaAbertaEFechada(tile) {
            var achou = false;
            angular.forEach(this.listaAberta, function(node, key) {
                if (tile.Xtile == node.x && tile.Ytile == node.y) {
                    achou = true;
                }
            });
            angular.forEach(this.listaFechada, function(node, key) {
                if (tile.Xtile == node.x && tile.Ytile == node.y) {
                    achou = true;
                }
            });
            return achou;
        }

        noAtualparaListaFechada(noAtual) {
            //remove no atual da lista aberta
            this.listaAberta.forEach((node, key) => {
                if (noAtual.x == node.x && noAtual.y == node.y) {
                    this.listaAberta.splice(key, 1);
                }
            });
            this.listaFechada.push(noAtual);
        }

        loop(noFinal) {
            var nodeMenorf = null;
            var menor = 99999;
            angular.forEach(this.listaAberta, function(node, key) {
                if (menor > node.f) {
                    menor = node.f;
                    nodeMenorf = node;
                }
            });
            var Xinitial = nodeMenorf.x;
            var Yinitial = nodeMenorf.y;
            var noAtual = nodeMenorf;

            // right
            tiles.forEach(tile => {
                if (tile.x == Grid.getXposition(Xinitial - 1, Yinitial + 1) && tile.y == Grid.getYposition(Xinitial - 1, Yinitial + 1)) {
                    if (this.verificaNoFinal(tile, noFinal)) {
                        this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, true));
                        this.tracePath(noFinal);
                        return;
                    }
                    if (!this.verificaNodeNaListaAbertaEFechada(tile)) {
                        this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, true));
                    }
                }
            });

            // up right
            tiles.forEach(tile => {
                if (tile.x == Grid.getXposition(Xinitial - 1, Yinitial) && tile.y == Grid.getYposition(Xinitial - 1, Yinitial)) {
                    if (this.verificaNoFinal(tile, noFinal)) {
                        this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, true));
                        this.tracePath(noFinal);
                        return;
                    }
                    if (!this.verificaNodeNaListaAbertaEFechada(tile)) {
                        this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, false));
                    }
                }
            });
            // up
            tiles.forEach(tile => {
                if (tile.x == Grid.getXposition(Xinitial - 1, Yinitial - 1) && tile.y == Grid.getYposition(Xinitial - 1, Yinitial - 1)) {
                    if (this.verificaNoFinal(tile, noFinal)) {
                        this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, true));
                        this.tracePath(noFinal);
                        return;
                    }
                    if (!this.verificaNodeNaListaAbertaEFechada(tile)) {
                        this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, true));
                    }
                }
            });
            // up left
            tiles.forEach(tile => {
                if (tile.x == Grid.getXposition(Xinitial, Yinitial - 1) && tile.y == Grid.getYposition(Xinitial, Yinitial - 1)) {
                    if (this.verificaNoFinal(tile, noFinal)) {
                        this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, true));
                        this.tracePath(noFinal);
                        return;
                    }
                    if (!this.verificaNodeNaListaAbertaEFechada(tile)) {
                        this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, false));
                    }
                }
            });
            // left
            tiles.forEach(tile => {
                if (tile.x == Grid.getXposition(Xinitial + 1, Yinitial - 1) && tile.y == Grid.getYposition(Xinitial + 1, Yinitial - 1)) {
                    if (this.verificaNoFinal(tile, noFinal)) {
                        this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, true));
                        this.tracePath(noFinal);
                        return;
                    }
                    if (!this.verificaNodeNaListaAbertaEFechada(tile)) {
                        this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, true));
                    }
                }
            });
            // bottom
            tiles.forEach(tile => {
                if (tile.x == Grid.getXposition(Xinitial + 1, Yinitial + 1) && tile.y == Grid.getYposition(Xinitial + 1, Yinitial + 1)) {
                    if (this.verificaNoFinal(tile, noFinal)) {
                        this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, true));
                        this.tracePath(noFinal);
                        return;
                    }
                    if (!this.verificaNodeNaListaAbertaEFechada(tile)) {
                        this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, true));
                    }
                }
            });
            // bottom left
            tiles.forEach(tile => {
                if (tile.x == Grid.getXposition(Xinitial + 1, Yinitial) && tile.y == Grid.getYposition(Xinitial + 1, Yinitial)) {
                    if (this.verificaNoFinal(tile, noFinal)) {
                        this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, true));
                        this.tracePath(noFinal);
                        return;
                    }
                    if (!this.verificaNodeNaListaAbertaEFechada(tile)) {
                        this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, false));
                    }
                }
            });

            // bottom right
            tiles.forEach(tile => {
                if (tile.x == Grid.getXposition(Xinitial, Yinitial + 1) && tile.y == Grid.getYposition(Xinitial, Yinitial + 1)) {
                    if (this.verificaNoFinal(tile, noFinal)) {
                        this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, true));
                        this.tracePath(noFinal);
                        return;
                    }
                    if (!this.verificaNodeNaListaAbertaEFechada(tile)) {
                        this.listaAberta.push(new Node(tile.Xtile, tile.Ytile, noAtual.x, noAtual.y, noFinal, false));
                    }
                }
            });

            this.noAtualparaListaFechada(noAtual);

            if (!this.achouNoFinal)
                this.loop(noFinal);

        }
    }

    class Player {
        constructor(player_id, x, y, width, height, color) {
            this.player_id = player_id;
            this.x = Grid.getXposition(x, y) + 32 - (width / 2);
            this.y = Grid.getYposition(x, y) + 16 - height;
            this.Xtile = x;
            this.Ytile = y;
            this.goToXtile;
            this.goToYtile;
            this.move = false;
            this.currentNode = null;
            this.pathfinding = new PathFind(this);

            this.width = width;
            this.height = height;
            this.color = color;
        }

        changePlayerPosition(Xtile, Ytile) {
            players.forEach(player => {
                if ($scope.player_id == player.player_id) {
                    player.goToXtile = Xtile;
                    player.goToYtile = Ytile;
                    socket.emit('getPlayers', { xplayer: player.goToXtile, yplayer: player.goToYtile });
                }
            });
        }

        draw(ctx) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        goToPath(deltaTime) {
            this.pathfinding.rota.forEach((node, key) => {
                if (this.currentNode.x == node.x && this.currentNode.y == node.y) {
                    if (this.Xtile == node.x && this.Ytile < node.y) {
                        if (this.x < Grid.getXposition(node.x, node.y) + 32 - (this.width / 2)) {
                            this.x += 20 / deltaTime;
                        }

                        if (this.y < Grid.getYposition(node.x, node.y) + 16 - this.height) {
                            this.y += 10 / deltaTime;
                        }

                        if (this.x >= Grid.getXposition(node.x, node.y) + 32 - (this.width / 2) && this.y >= Grid.getYposition(node.x, node.y) + 16 - this.height) {
                            this.x = Grid.getXposition(node.x, node.y) + 32 - (this.width / 2);
                            this.y = Grid.getYposition(node.x, node.y) + 16 - this.height;
                            this.Xtile = node.x;
                            this.Ytile = node.y;
                            if (this.pathfinding.rota.length == key + 1)
                                this.move = false;
                            this.currentNode = this.pathfinding.rota[key + 1];
                        }
                    } else if (this.Ytile > node.y) {
                        if (this.x > Grid.getXposition(node.x, node.y) + 32 - (this.width / 2)) {
                            this.x -= 20 / deltaTime;
                        }

                        if (this.y > Grid.getYposition(node.x, node.y) + 16 - this.height) {
                            this.y -= 10 / deltaTime;
                        }

                        if (this.x <= Grid.getXposition(node.x, node.y) + 32 - (this.width / 2) && this.y <= Grid.getYposition(node.x, node.y) + 16 - this.height) {
                            this.x = Grid.getXposition(node.x, node.y) + 32 - (this.width / 2);
                            this.y = Grid.getYposition(node.x, node.y) + 16 - this.height;
                            this.Xtile = node.x;
                            this.Ytile = node.y;
                            if (this.pathfinding.rota.length == key + 1)
                                this.move = false;
                            this.currentNode = this.pathfinding.rota[key + 1];
                        }
                    } else if (this.Xtile < node.x && this.Ytile == node.y) {
                        if (this.x > Grid.getXposition(node.x, node.y) + 32 - (this.width / 2)) {
                            this.x -= 20 / deltaTime;
                        }

                        if (this.y < Grid.getYposition(node.x, node.y) + 16 - this.height) {
                            this.y += 10 / deltaTime;
                        }

                        if (this.x <= Grid.getXposition(node.x, node.y) + 32 - (this.width / 2) && this.y >= Grid.getYposition(node.x, node.y) + 16 - this.height) {
                            this.x = Grid.getXposition(node.x, node.y) + 32 - (this.width / 2);
                            this.y = Grid.getYposition(node.x, node.y) + 16 - this.height;
                            this.Xtile = node.x;
                            this.Ytile = node.y;
                            if (this.pathfinding.rota.length == key + 1)
                                this.move = false;
                            this.currentNode = this.pathfinding.rota[key + 1];
                        }
                    } else if (this.Xtile < node.x && this.Ytile < node.y) {
                        //bottom
                        if (this.y < Grid.getYposition(node.x, node.y) + 16 - this.height) {
                            this.y += 10 / deltaTime;
                        }

                        if (this.y >= Grid.getYposition(node.x, node.y) + 16 - this.height) {
                            this.x = Grid.getXposition(node.x, node.y) + 32 - (this.width / 2);
                            this.y = Grid.getYposition(node.x, node.y) + 16 - this.height;
                            this.Xtile = node.x;
                            this.Ytile = node.y;
                            if (this.pathfinding.rota.length == key + 1)
                                this.move = false;
                            this.currentNode = this.pathfinding.rota[key + 1];
                        }
                    } else {
                        if (this.x < Grid.getXposition(node.x, node.y) + 32 - (this.width / 2)) {
                            this.x += 20 / deltaTime;
                        }
                        if (this.y > Grid.getYposition(node.x, node.y) + 16 - this.height) {
                            this.y -= 10 / deltaTime;
                        }

                        if (this.x >= Grid.getXposition(node.x, node.y) + 32 - (this.width / 2) && this.y <= Grid.getYposition(node.x, node.y) + 16 - this.height) {
                            this.x = Grid.getXposition(node.x, node.y) + 32 - (this.width / 2);
                            this.y = Grid.getYposition(node.x, node.y) + 16 - this.height;
                            this.Xtile = node.x;
                            this.Ytile = node.y;
                            if (this.pathfinding.rota.length == key + 1)
                                this.move = false;
                            this.currentNode = this.pathfinding.rota[key + 1];
                        }
                    }
                }
            });
        }

        update(deltaTime) {
            if (!deltaTime) return;
            if (this.move)
                this.goToPath(deltaTime);
            //this.x += 5 / deltaTime;
        }
    }

    class Grid {
        static x;
        static y;
        constructor(x, y) {
            Grid.x = parseInt(x);
            Grid.y = parseInt(y);
        }

        static getXposition(x, y) {
            return (Grid.x - (32 * (x - y))) - 100;
        }

        static getYposition(x, y) {
            return (Grid.y + (16 * (x + y)));
        }
    }

    class Tile {
        constructor(x, y) {
            this.x = Grid.getXposition(x, y);
            this.y = Grid.getYposition(x, y);
            this.Xtile = x;
            this.Ytile = y;

            this.hover = false;
            this.img = new Image();
            this.img.src = 'images/tile.png?v=' + new Date().getTime();

            this.vertices = [];
            this.vertice1 = new Vertice(this.x, this.y + 15, 'green');
            this.vertice2 = new Vertice(this.x + 32, this.y, 'purple');
            this.vertice3 = new Vertice(this.x + 64, this.y + 15, 'green');
            this.vertice4 = new Vertice(this.x + 32, this.y + 31, 'green');

            this.vertices.push(this.vertice1);
            this.vertices.push(this.vertice2);
            this.vertices.push(this.vertice3);
            this.vertices.push(this.vertice4);
        }

        draw(ctx) {
            ctx.drawImage(this.img, this.x, this.y);
            /*this.vertice1.draw(ctx);
            this.vertice2.draw(ctx);
            this.vertice3.draw(ctx);
            this.vertice4.draw(ctx);*/
        }

        update(deltaTime) {
            //this.x += 5 / deltaTime;
        }
    }

    class TileHover {
        constructor(x, y) {
            this.x = x;
            this.y = y;

            this.hoverImg = new Image();
            this.hoverImg.src = 'images/tile-hover.png?v=' + new Date().getTime();
        }

        draw(ctx) {
            ctx.drawImage(this.hoverImg, this.x, this.y);
        }
    }

    class Chunk {
        constructor(x, y, tilesX, tilesY) {
            this.x = Grid.getXposition(x, y);
            this.y = Grid.getYposition(x, y);

            this.tiles = [];

            //Door tile
            this.tiles.push(new Tile(2, -1));
            for (var i = 0; i < tilesX; i++) {
                for (var j = 0; j < tilesY; j++) {
                    this.tiles.push(new Tile(i, j));
                }
            }
            tiles = this.tiles;

            this.tileHover = new TileHover();
        }

        draw(ctx) {
            var self = this;
            var hover = false;
            angular.forEach(this.tiles, function(tile, key) {
                tile.draw(ctx);
                if (tile.hover) {
                    hover = true;
                    self.tileHover.x = tile.x;
                    self.tileHover.y = tile.y;
                }
            });
            if (hover)
                self.tileHover.draw(ctx);
        }

        update(deltaTime) {

        }
    }

    class Vertice {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;

            this.color = color;
        }
        draw(ctx) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, 2, 2);
        }
    }

    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    var tiles = [];

    var grid = new Grid(innerWidth / 2, innerHeight / 2);
    var chunk = new Chunk(0, 0, 5, 5);
    //var player = new Player(2, 2, 10, 50, 'green');
    //var player2 = new Player(0, 0, 10, 50, 'red');

    var lastTime = 0;

    function polyPoint(vertices, px, py) {
        var collision = false;

        var next = 0;
        var current = 0;
        for (current = 0; current < vertices.length; current++) {
            var next = current + 1;
            if (next == vertices.length) next = 0;

            var vc = vertices[current];
            var vn = vertices[next];

            if (((vc.y >= py && vn.y < py) || (vc.y < py && vn.y >= py)) &&
                (px < (vn.x - vc.x) * (py - vc.y) / (vn.y - vc.y) + vc.x)) {
                collision = !collision;
            }
        }
        return collision;
    }

    canvas.addEventListener('mousemove', function(evt) {
        var mousePos = getMousePos(canvas, evt);
        var px = mousePos.x;
        var py = mousePos.y;

        angular.forEach(chunk.tiles, function(tile, key) {
            var hit = polyPoint(tile.vertices, px, py);
            if (hit)
                tile.hover = true;
            else
                tile.hover = false;
        });
    }, false);

    canvas.addEventListener('click', function(evt) {
        chunk.tiles.forEach(tile => {
            if (tile.hover) {
                players.forEach(player => {
                    if (!(player.Xtile == tile.Xtile && player.Ytile == tile.Ytile) && player.player_id == $scope.player_id) {
                        //player.pathfinding.goToPath(player.Xtile, player.Ytile, tile.Xtile, tile.Ytile);
                        player.changePlayerPosition(tile.Xtile, tile.Ytile);
                    }
                });
            }
        });
    }, false);

    function gameLoop(timestamp) {
        var deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, innerWidth, innerHeight);
        //player.update(deltaTime);
        chunk.draw(ctx);
        //player.draw(ctx);
        //player2.draw(ctx);
        players.forEach(player => {
            player.draw(ctx);
            player.update(deltaTime);
        });

        requestAnimationFrame(gameLoop);
    }

    gameLoop();
});