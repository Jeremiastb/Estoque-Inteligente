-- ============================================================
--  BANCO DE DADOS: estoque_db (MySQL)
--  Sistema Inteligente de Gestão de Estoque
--  Atende às Aulas 10 a 16
-- ============================================================

-- CREATE DATABASE IF NOT EXISTS estoque_db
--   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE estoque_db;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
--  TABELA: usuarios (Aula 14 - Segurança)
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(50) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    papel ENUM('admin', 'gerente', 'operador') NOT NULL DEFAULT 'operador',
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    tentativas_login INT DEFAULT 0,
    bloqueado_ate DATETIME NULL,
    ultimo_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_usuarios_login (login),
    INDEX idx_usuarios_papel (papel),
    INDEX idx_usuarios_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  TABELA: categorias
-- ============================================================
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_categorias_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  TABELA: fornecedores
-- ============================================================
CREATE TABLE IF NOT EXISTS fornecedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    cnpj VARCHAR(20),
    contato VARCHAR(100),
    telefone VARCHAR(20),
    email VARCHAR(150),
    endereco VARCHAR(300),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_fornecedores_nome (nome),
    INDEX idx_fornecedores_cnpj (cnpj)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  TABELA: produtos (principal)
-- ============================================================
CREATE TABLE IF NOT EXISTS produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(200) NOT NULL,
    descricao VARCHAR(500),
    categoria VARCHAR(100),
    categoria_id INT NULL,
    preco DECIMAL(10,2) NOT NULL DEFAULT 0,
    custo DECIMAL(10,2) DEFAULT 0,
    quantidade INT NOT NULL DEFAULT 0,
    estoque_minimo INT NOT NULL DEFAULT 10,
    unidade VARCHAR(20) DEFAULT 'UN',
    fornecedor VARCHAR(200),
    fornecedor_id INT NULL,

    -- Aula 14: Coluna criptografada (AES no MySQL)
    fornecedor_criptografado BLOB NULL,

    observacoes VARCHAR(500),
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,

    CONSTRAINT fk_produtos_categoria FOREIGN KEY (categoria_id)
        REFERENCES categorias(id) ON DELETE SET NULL,
    CONSTRAINT fk_produtos_fornecedor FOREIGN KEY (fornecedor_id)
        REFERENCES fornecedores(id) ON DELETE SET NULL,
    CONSTRAINT fk_produtos_usuario FOREIGN KEY (created_by)
        REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT ck_produtos_quantidade CHECK (quantidade >= 0),
    CONSTRAINT ck_produtos_preco CHECK (preco >= 0),

    INDEX idx_produtos_codigo (codigo),
    INDEX idx_produtos_nome (nome),
    INDEX idx_produtos_categoria (categoria),
    INDEX idx_produtos_categoria_id (categoria_id),
    INDEX idx_produtos_fornecedor_id (fornecedor_id),
    INDEX idx_produtos_ativo (ativo),
    INDEX idx_produtos_qtd_min (quantidade, estoque_minimo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  TABELA: movimentacoes (Aula 15)
-- ============================================================
CREATE TABLE IF NOT EXISTS movimentacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    tipo ENUM('entrada', 'saida', 'ajuste', 'devolucao') NOT NULL,
    quantidade INT NOT NULL,
    motivo VARCHAR(500),
    usuario VARCHAR(100),
    usuario_id INT NULL,
    valor_unitario DECIMAL(10,2),
    valor_total DECIMAL(10,2),
    data_movimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes VARCHAR(500),

    CONSTRAINT fk_movimentacoes_produto FOREIGN KEY (produto_id)
        REFERENCES produtos(id) ON DELETE CASCADE,
    CONSTRAINT fk_movimentacoes_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT ck_movimentacoes_quantidade CHECK (quantidade > 0),

    INDEX idx_movimentacoes_produto (produto_id),
    INDEX idx_movimentacoes_tipo (tipo),
    INDEX idx_movimentacoes_data (data_movimento DESC),
    INDEX idx_movimentacoes_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  TABELA: alertas_estoque (Aula 15)
-- ============================================================
CREATE TABLE IF NOT EXISTS alertas_estoque (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    quantidade_atual INT NOT NULL,
    estoque_minimo INT NOT NULL,
    nivel ENUM('baixo', 'critico', 'zerado') DEFAULT 'baixo',
    resolvido TINYINT(1) DEFAULT 0,
    data_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_resolucao DATETIME NULL,
    resolvido_por INT NULL,

    CONSTRAINT fk_alertas_produto FOREIGN KEY (produto_id)
        REFERENCES produtos(id) ON DELETE CASCADE,
    CONSTRAINT fk_alertas_usuario FOREIGN KEY (resolvido_por)
        REFERENCES usuarios(id) ON DELETE SET NULL,

    INDEX idx_alertas_resolvido (resolvido),
    INDEX idx_alertas_data (data_alerta DESC),
    INDEX idx_alertas_nivel (nivel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  TABELA: auditoria (Aula 14 - Segurança)
-- ============================================================
CREATE TABLE IF NOT EXISTS auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tabela_afetada VARCHAR(100) NOT NULL,
    registro_id INT,
    operacao ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    dados_antigos JSON,
    dados_novos JSON,
    usuario VARCHAR(100),
    ip_origem VARCHAR(50),
    data_operacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_auditoria_tabela (tabela_afetada),
    INDEX idx_auditoria_data (data_operacao DESC),
    INDEX idx_auditoria_operacao (operacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  TABELA: backups (controle - Aula 14)
-- ============================================================
CREATE TABLE IF NOT EXISTS backups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('full', 'differential', 'log', 'logical') NOT NULL,
    banco VARCHAR(100) NOT NULL,
    arquivo VARCHAR(500) NOT NULL,
    tamanho_mb DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'concluido',
    iniciado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    concluido_em DATETIME NULL,
    executado_por VARCHAR(100),

    INDEX idx_backups_banco (banco),
    INDEX idx_backups_data (iniciado_em DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  VIEWS (Aula 14 - Snapshot de views)
-- ============================================================

-- View: Resumo de estoque por categoria
DROP VIEW IF EXISTS vw_estoque_resumo;
CREATE VIEW vw_estoque_resumo AS
SELECT
    COALESCE(categoria, 'Sem categoria') AS categoria,
    COUNT(*) AS total_itens,
    SUM(quantidade) AS estoque_total,
    AVG(preco) AS preco_medio,
    SUM(preco * quantidade) AS valor_total_estoque,
    SUM(CASE WHEN quantidade <= estoque_minimo THEN 1 ELSE 0 END) AS itens_estoque_baixo
FROM produtos
WHERE ativo = 1
GROUP BY categoria;

-- View: Produtos com estoque baixo
DROP VIEW IF EXISTS vw_estoque_baixo;
CREATE VIEW vw_estoque_baixo AS
SELECT
    p.id, p.codigo, p.nome, p.categoria,
    p.quantidade, p.estoque_minimo,
    p.preco, p.fornecedor,
    CASE
        WHEN p.quantidade = 0 THEN 'ZERADO'
        WHEN p.quantidade <= p.estoque_minimo / 2 THEN 'CRITICO'
        ELSE 'BAIXO'
    END AS nivel_alerta,
    (p.estoque_minimo - p.quantidade) AS faltante
FROM produtos p
WHERE p.ativo = 1
  AND p.quantidade <= p.estoque_minimo;

-- View: Movimentações recentes (últimos 30 dias)
DROP VIEW IF EXISTS vw_movimentacoes_recentes;
CREATE VIEW vw_movimentacoes_recentes AS
SELECT
    m.id, m.tipo, m.quantidade, m.motivo, m.usuario, m.data_movimento,
    p.codigo AS produto_codigo, p.nome AS produto_nome, p.categoria,
    m.valor_total,
    u.nome AS usuario_nome
FROM movimentacoes m
INNER JOIN produtos p ON m.produto_id = p.id
LEFT JOIN usuarios u ON m.usuario_id = u.id
WHERE m.data_movimento >= DATE_SUB(NOW(), INTERVAL 30 DAY);

-- View: Valor total em estoque
DROP VIEW IF EXISTS vw_valor_total_estoque;
CREATE VIEW vw_valor_total_estoque AS
SELECT
    COUNT(*) AS total_produtos,
    SUM(quantidade) AS total_unidades,
    SUM(preco * quantidade) AS valor_vareja,
    SUM(custo * quantidade) AS valor_custo,
    SUM((preco - custo) * quantidade) AS margem_potencial
FROM produtos
WHERE ativo = 1;

-- ============================================================
--  TRIGGERS (Aula 14 - Auditoria automática)
-- ============================================================

-- Trigger: auditoria de UPDATE em produtos
DROP TRIGGER IF EXISTS trg_produtos_update_audit;
DELIMITER $$
CREATE TRIGGER trg_produtos_update_audit
AFTER UPDATE ON produtos
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabela_afetada, registro_id, operacao, dados_antigos, dados_novos, data_operacao)
    VALUES (
        'produtos',
        NEW.id,
        'UPDATE',
        JSON_OBJECT(
            'codigo', OLD.codigo, 'nome', OLD.nome, 'quantidade', OLD.quantidade, 'preco', OLD.preco
        ),
        JSON_OBJECT(
            'codigo', NEW.codigo, 'nome', NEW.nome, 'quantidade', NEW.quantidade, 'preco', NEW.preco
        ),
        NOW()
    );
END$$
DELIMITER ;

-- Trigger: auditoria de DELETE em produtos
DROP TRIGGER IF EXISTS trg_produtos_delete_audit;
DELIMITER $$
CREATE TRIGGER trg_produtos_delete_audit
AFTER DELETE ON produtos
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabela_afetada, registro_id, operacao, dados_antigos, data_operacao)
    VALUES (
        'produtos',
        OLD.id,
        'DELETE',
        JSON_OBJECT(
            'codigo', OLD.codigo, 'nome', OLD.nome, 'quantidade', OLD.quantidade
        ),
        NOW()
    );
END$$
DELIMITER ;

-- Trigger: alerta automático de estoque baixo
DROP TRIGGER IF EXISTS trg_produtos_alerta_estoque;
DELIMITER $$
CREATE TRIGGER trg_produtos_alerta_estoque
AFTER UPDATE ON produtos
FOR EACH ROW
BEGIN
    IF NEW.quantidade <= NEW.estoque_minimo AND NEW.ativo = 1 THEN
        INSERT INTO alertas_estoque (produto_id, quantidade_atual, estoque_minimo, nivel, data_alerta)
        VALUES (
            NEW.id,
            NEW.quantidade,
            NEW.estoque_minimo,
            CASE
                WHEN NEW.quantidade = 0 THEN 'zerado'
                WHEN NEW.quantidade <= NEW.estoque_minimo / 2 THEN 'critico'
                ELSE 'baixo'
            END,
            NOW()
        );
    END IF;
END$$
DELIMITER ;

-- ============================================================
--  STORED PROCEDURES
-- ============================================================

-- Procedure: Registrar entrada
DROP PROCEDURE IF EXISTS sp_registrar_entrada;
DELIMITER $$
CREATE PROCEDURE sp_registrar_entrada(
    IN p_produto_id INT,
    IN p_quantidade INT,
    IN p_motivo VARCHAR(500),
    IN p_usuario VARCHAR(100),
    IN p_usuario_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    UPDATE produtos
    SET quantidade = quantidade + p_quantidade,
        updated_at = NOW()
    WHERE id = p_produto_id AND ativo = 1;

    INSERT INTO movimentacoes (produto_id, tipo, quantidade, motivo, usuario, usuario_id, data_movimento)
    VALUES (p_produto_id, 'entrada', p_quantidade, p_motivo, p_usuario, p_usuario_id, NOW());

    UPDATE alertas_estoque
    SET resolvido = 1, data_resolucao = NOW(), resolvido_por = p_usuario_id
    WHERE produto_id = p_produto_id AND resolvido = 0;

    COMMIT;
END$$
DELIMITER ;

-- Procedure: Registrar saída
DROP PROCEDURE IF EXISTS sp_registrar_saida;
DELIMITER $$
CREATE PROCEDURE sp_registrar_saida(
    IN p_produto_id INT,
    IN p_quantidade INT,
    IN p_motivo VARCHAR(500),
    IN p_usuario VARCHAR(100),
    IN p_usuario_id INT
)
BEGIN
    DECLARE v_estoque_atual INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SELECT quantidade INTO v_estoque_atual
    FROM produtos
    WHERE id = p_produto_id AND ativo = 1;

    IF v_estoque_atual IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Produto não encontrado';
    END IF;

    IF v_estoque_atual < p_quantidade THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Estoque insuficiente';
    END IF;

    START TRANSACTION;

    UPDATE produtos
    SET quantidade = quantidade - p_quantidade,
        updated_at = NOW()
    WHERE id = p_produto_id;

    INSERT INTO movimentacoes (produto_id, tipo, quantidade, motivo, usuario, usuario_id, data_movimento)
    VALUES (p_produto_id, 'saida', p_quantidade, p_motivo, p_usuario, p_usuario_id, NOW());

    COMMIT;
END$$
DELIMITER ;

-- ============================================================
--  FUNÇÕES AUXILIARES (Aula 14 - Criptografia)
-- ============================================================

-- Função: Criptografar dado sensível (AES)
DROP FUNCTION IF EXISTS fn_criptografar;
DELIMITER $$
CREATE FUNCTION fn_criptografar(dado VARCHAR(500), chave VARCHAR(32))
RETURNS VARBINARY(500)
DETERMINISTIC
BEGIN
    RETURN AES_ENCRYPT(dado, chave);
END$$
DELIMITER ;

-- Função: Descriptografar dado sensível
DROP FUNCTION IF EXISTS fn_descriptografar;
DELIMITER $$
CREATE FUNCTION fn_descriptografar(dado_cript BLOB, chave VARCHAR(32))
RETURNS VARCHAR(500)
DETERMINISTIC
BEGIN
    RETURN CAST(AES_DECRYPT(dado_cript, chave) AS CHAR);
END$$
DELIMITER ;

-- ============================================================
--  DADOS INICIAIS (seed)
-- ============================================================

-- Usuário admin padrão
INSERT IGNORE INTO usuarios (login, senha_hash, nome, email, papel)
VALUES (
    'admin',
    '$2b$10$XQxbMFrL5KZxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKx',
    'Administrador',
    'admin@estoque.com',
    'admin'
);

-- Categorias padrão
INSERT IGNORE INTO categorias (nome, descricao) VALUES
    ('Eletrônicos', 'Produtos eletrônicos em geral'),
    ('Alimentos', 'Produtos alimentícios'),
    ('Limpeza', 'Produtos de limpeza'),
    ('Papelaria', 'Material de escritório'),
    ('Vestuário', 'Roupas e acessórios');

-- ============================================================
--  PERMISSÕES (Aula 14 - Segurança)
-- ============================================================

-- Cria usuário da aplicação (executar como root)
-- CREATE USER IF NOT EXISTS 'app_estoque'@'%' IDENTIFIED BY 'SuaSenhaForte!';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON estoque_db.produtos TO 'app_estoque'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON estoque_db.movimentacoes TO 'app_estoque'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON estoque_db.alertas_estoque TO 'app_estoque'@'%';
-- GRANT SELECT, INSERT ON estoque_db.auditoria TO 'app_estoque'@'%';
-- GRANT SELECT ON estoque_db.categorias TO 'app_estoque'@'%';
-- GRANT SELECT ON estoque_db.fornecedores TO 'app_estoque'@'%';
-- GRANT SELECT ON estoque_db.backups TO 'app_estoque'@'%';
-- -- Views
-- GRANT SELECT ON estoque_db.vw_estoque_resumo TO 'app_estoque'@'%';
-- GRANT SELECT ON estoque_db.vw_estoque_baixo TO 'app_estoque'@'%';
-- GRANT SELECT ON estoque_db.vw_movimentacoes_recentes TO 'app_estoque'@'%';
-- GRANT SELECT ON estoque_db.vw_valor_total_estoque TO 'app_estoque'@'%';
-- -- Procedures
-- GRANT EXECUTE ON estoque_db.sp_registrar_entrada TO 'app_estoque'@'%';
-- GRANT EXECUTE ON estoque_db.sp_registrar_saida TO 'app_estoque'@'%';
-- FLUSH PRIVILEGES;

SET FOREIGN_KEY_CHECKS = 1;

SELECT '✅ Script MySQL executado com sucesso!' AS status;