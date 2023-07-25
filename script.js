const canvas = document.getElementById("mazeCanvas");
        const ctx = canvas.getContext("2d");
        const linhas = 16;
        const colunas = 16;
        const tamanhoCelula = canvas.width / linhas;

        const labirinto = Array.from({ length: linhas }, () => Array(colunas).fill(0));

        // Função para gerar o labirinto
        function gerarLabirinto(linha, coluna) {
            labirinto[linha][coluna] = 1;

            const direcoes = [
                [0, 2], // Cima
                [2, 0], // Direita
                [0, -2], // Baixo
                [-2, 0], // Esquerda
            ];

            direcoes.sort(() => Math.random() - 0.5);

            for (const [r, c] of direcoes) {
                const novaLinha = linha + r;
                const novaColuna = coluna + c;

                if (novaLinha < 0 || novaLinha >= linhas || novaColuna < 0 || novaColuna >= colunas) continue;

                if (labirinto[novaLinha][novaColuna] === 0) {
                    labirinto[linha + r / 2][coluna + c / 2] = 1;
                    gerarLabirinto(novaLinha, novaColuna);
                }
            }
        }

        gerarLabirinto(0, 0);

        let posicao_x, posicao_y;
        do {
            posicao_x = Math.floor(Math.random() * colunas);
            posicao_y = Math.floor(Math.random() * linhas);
        } while (labirinto[posicao_y][posicao_x] === 0);

        let chegada_x, chegada_y;
        do {
            chegada_x = Math.floor(Math.random() * colunas);
            chegada_y = Math.floor(Math.random() * linhas);
        } while (labirinto[chegada_y][chegada_x] === 0 || (posicao_x === chegada_x && posicao_y === chegada_y));

        let monstro_x, monstro_y;
        do {
            monstro_x = Math.floor(Math.random() * colunas);
            monstro_y = Math.floor(Math.random() * linhas);
        } while (
            labirinto[monstro_y][monstro_x] === 0 ||
            (monstro_x === posicao_x && monstro_y === posicao_y) ||
            (monstro_x === chegada_x && monstro_y === chegada_y)
        );

        // Função para desenhar o labirinto no canvas
        function desenharLabirinto() {
            for (let i = 0; i < linhas; i++) {
                for (let j = 0; j < colunas; j++) {
                    if (labirinto[i][j] === 0) {
                        ctx.fillStyle = "#555"; // Cor das paredes
                    } else {
                        ctx.fillStyle = "#fff"; // Cor do caminho
                    }
                    ctx.fillRect(j * tamanhoCelula, i * tamanhoCelula, tamanhoCelula, tamanhoCelula);
                }
            }

            ctx.fillStyle = "purple";
            ctx.fillRect(posicao_x * tamanhoCelula, posicao_y * tamanhoCelula, tamanhoCelula, tamanhoCelula);

            ctx.fillStyle = "green";
            ctx.fillRect(chegada_x * tamanhoCelula, chegada_y * tamanhoCelula, tamanhoCelula, tamanhoCelula);

            ctx.fillStyle = "red";
            ctx.fillRect(monstro_x * tamanhoCelula, monstro_y * tamanhoCelula, tamanhoCelula, tamanhoCelula);
        }

        desenharLabirinto();

        // variaveis global
        const limiteMovimentos = 200;
        let movimentosRestantes = limiteMovimentos;
        let jogadasRestantes = 4
        let turno = 0;
        let sequenciaMonstro = gerarMovimentos(3);
        let contadorMovimentos = 0;
        let escolha; // Variável escolha declarada no escopo global

        // Função para apagar o personagem do canvas
        function apagarPersonagem() {
            ctx.fillStyle = "#fff";
            ctx.fillRect(posicao_x * tamanhoCelula, posicao_y * tamanhoCelula, tamanhoCelula, tamanhoCelula);
        }

        // Função para apagar o monstro do canvas
        function apagarMonstro() {
            ctx.fillStyle = "#fff";
            ctx.fillRect(monstro_x * tamanhoCelula, monstro_y * tamanhoCelula, tamanhoCelula, tamanhoCelula);
        }

        // Função para exibir o personagem no canvas
        function exibirPersonagem() {
            ctx.fillStyle = "purple";
            ctx.fillRect(posicao_x * tamanhoCelula, posicao_y * tamanhoCelula, tamanhoCelula, tamanhoCelula);
        }

        // Função para exibir o monstro no canvas
        function exibirMonstro() {
            ctx.fillStyle = "red";
            ctx.fillRect(monstro_x * tamanhoCelula, monstro_y * tamanhoCelula, tamanhoCelula, tamanhoCelula);
        }

        // Função para decrementar o contador de movimentos restantes
        function contador() {
            movimentosRestantes--;
            document.getElementById('movimentosRestantes').textContent = movimentosRestantes;
        }

        // Função para gerar uma lista de movimentos aleatórios
        function gerarMovimentos(size) {
            const maxNumber = 4;
            const randomList = [];

            while (randomList.length < size) {
                const randomNumber = Math.floor(Math.random() * maxNumber) + 1;
                if (!randomList.includes(randomNumber)) {
                    randomList.push(randomNumber);
                }
            }
            return randomList;
        }

        

        // Função para exibir a lista de próximos movimentos do monstro no HTML
        function exibirProximosMovimentosMonstro() {
            const listaProximosMovimentos = document.getElementById('proximoMovimentosMonstro');
            listaProximosMovimentos.innerHTML = '';

            for (const move of listaAtual) {
                let movimento;
                if      (move === 1) movimento = 'Frente';
                else if (move === 2) movimento = 'Trás';
                else if (move === 3) movimento = 'Direita';
                else if (move === 4) movimento = 'Esquerda';
                listaProximosMovimentos.innerHTML += `<li>${movimento}</li>`;
            }
        }

        // Função para movimentar o monstro de acordo com o movimento fornecido
        function movimentarMonstro(move) {
            let novaLinha = monstro_y;
            let novaColuna = monstro_x;

            if (move === 1) novaLinha--;
            else if (move === 2) novaLinha++;
            else if (move === 3) novaColuna++;
            else if (move === 4) novaColuna--;

            if (novaLinha < 0 || novaLinha >= linhas || novaColuna < 0 || novaColuna >= colunas || labirinto[novaLinha][novaColuna] === 0) {
                return;
            }

            apagarMonstro();
            monstro_x = novaColuna;
            monstro_y = novaLinha;
            exibirMonstro();
        }

        let listaAtual = gerarMovimentos(3)
        console.log(listaAtual)

        listaProxima = gerarMovimentos(3)

        let contadorPrimeiraRodada = 0

        function gerarNovaLista() {
            if (listaAtual.length == 0) {
                console.log("gerar nova lista")
                listaAtual = listaProxima 
                listaProxima = gerarMovimentos(3)
                console.log("Minha lista atual :" + listaAtual)
                console.log("Minha lista proxima :" + listaProxima)
            }
            console.log("Não gerei nenhuma lista")
        }
 
        // Função para mover o monstro
        function moverMonstro() {
            if (turno === 1) {
                
                console.log("chegou aqui")
                console.log("Contado os movimentos " + contadorMovimentos)
                if (contadorMovimentos === 4) {
                    gerarNovaLista()
                    exibirProximosMovimentosMonstro();

                    escolha = prompt("Escolha uma opção:\n1 - Pilha\n2 - Fila\n\nA lista de movimentos é:\n" + listaAtual);
                    escolha = parseInt(escolha);

                    if (escolha !== 1 && escolha !== 2) {
                        alert("Opção inválida. Por favor, escolha 1 ou 2.");
                        return;
                    }
                    contadorMovimentos = 1;
                }


                if (escolha === 1) {
                    console.log("Você escolheu a opção 1 - Pilha.");
        
                    
                    console.log("lista gerada" + listaAtual)
                    proximoMovimento = listaAtual.shift();
                    console.log("PRoximo movimento 1 = " + proximoMovimento)
                          
                } else if (escolha === 2) {
                    console.log("Você escolheu a opção 2 - Fila.");
                    console.log("lista gerada" + listaAtual)
                    proximoMovimento = listaAtual.pop();
                    console.log("PRoximo movimento 2 = " + proximoMovimento)
                }

                if(contadorPrimeiraRodada < 3) {
                    movimentarMonstro(listaAtual.pop());
                    contadorPrimeiraRodada++
                } else if (contadorPrimeiraRodada >= 3 ) {
                    movimentarMonstro(proximoMovimento);
                }
                
                //perda
                if (posicao_x === monstro_x && posicao_y === monstro_y) {
                    setTimeout(() => {
                        alert("Você foi pego pelo monstro! Fim de jogo!");
                        window.location.reload();
                    }, 600);
                }
        
                turno = 0;
                setTimeout(moverPersonagem, 300);
            }
        }

        

        // Função para mover o personagem
        function moverPersonagem(event) {

            // perda por falta de movs
            if (movimentosRestantes === 0) {
                alert("Você Perdeu! :(");
                window.location.reload();
            }

            if (turno === 0) {
                const tecla = event.keyCode;

                if (tecla === 38 && posicao_y > 0 && labirinto[posicao_y - 1][posicao_x] === 1) {
                    apagarPersonagem();
                    posicao_y--;
                    contador();
                    exibirPersonagem();
                    turno = 1;
                    contadorMovimentos++;
                    jogadasRestantes--;
                    setTimeout(moverMonstro, 1000);
                } else if (tecla === 40 && posicao_y < linhas - 1 && labirinto[posicao_y + 1][posicao_x] === 1) {
                    apagarPersonagem();
                    posicao_y++;
                    contador();
                    exibirPersonagem();
                    turno = 1;
                    contadorMovimentos++;
                    jogadasRestantes--;
                    setTimeout(moverMonstro, 1000);
                } else if (tecla === 37 && posicao_x > 0 && labirinto[posicao_y][posicao_x - 1] === 1) {
                    apagarPersonagem();
                    posicao_x--;
                    contador();
                    exibirPersonagem();
                    turno = 1;
                    contadorMovimentos++;
                    jogadasRestantes--;
                    setTimeout(moverMonstro, 1000);
                } else if (tecla === 39 && posicao_x < colunas - 1 && labirinto[posicao_y][posicao_x + 1] === 1) {
                    apagarPersonagem();
                    posicao_x++;
                    contador();
                    exibirPersonagem();
                    turno = 1;
                    contadorMovimentos++;
                    jogadasRestantes--;
                    setTimeout(moverMonstro, 1000);
                }

                if (posicao_x === chegada_x && posicao_y === chegada_y) {
                    setTimeout(() => {
                        alert("Parabéns! Você chegou ao destino!");
                        window.location.reload();
                    }, 600);
                }

                if (posicao_x === monstro_x && posicao_y === monstro_y) {
                    setTimeout(() => {
                        alert("Você foi pego pelo monstro! Fim de jogo!");
                        window.location.reload();
                    }, 600);
                }
            }
        }

        document.addEventListener('keydown', moverPersonagem);