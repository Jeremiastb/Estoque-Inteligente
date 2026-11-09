-- ============================================================
--  BANCO DE DADOS: EstoqueDB (SQL Server)
--  Sistema Inteligente de Gestão de Estoque
--  Atende às Aulas 10 a 16
-- ============================================================

-- Cria o banco (execute separadamente se necessário)
-- CREATE DATABASE EstoqueDB;
-- GO
-- USE EstoqueDB;
-- GO

-- ============================================================
--  TABELA: Usuarios (Aula 14 - Segurança)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Usuarios')
BEGIN
    CREATE TABLE Usuarios (
        id INT IDENTITY(1,1) PRIMARY KEY,
        login VARCHAR(50) NOT NULL UNIQUE,
        senha_hash VARCHAR(255) NOT NULL,           -- bcrypt hash
        nome VARCHAR(150) NOT NULL,
        email VARCHAR(150),
        papel VARCHAR(20) NOT NULL DEFAULT 'operador', -- admin | gerente | operador
        ativo BIT NOT NULL DEFAULT 1,
        tentativas_login INT DEFAULT 0,
        bloqueado_ate DATETIME NULL,
        ultimo_login DATETIME NULL,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME NULL
    );

    CREATE INDEX idx_usuarios_login ON Usuarios(login);
    CREATE INDEX idx_usuarios_papel ON Usuarios(papel);
END
GO

-- ============================================================
--  TABELA: Categorias
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Categorias')
BEGIN
    CREATE TABLE Categorias (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE,
        descricao VARCHAR(500),
        created_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- ============================================================
--  TABELA: Fornecedores
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Fornecedores')
BEGIN
    CREATE TABLE Fornecedores (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nome VARCHAR(200) NOT NULL,
        cnpj VARCHAR(20),
        contato VARCHAR(100),
        telefone VARCHAR(20),
        email VARCHAR(150),
        endereco VARCHAR(300),
        created_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- ============================================================
--  TABELA: Produtos (principal)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Produtos')
BEGIN
    CREATE TABLE Produtos (
        id INT IDENTITY(1,1) PRIMARY KEY,
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

        -- Aula 14: Coluna criptografada para dados sensíveis
        fornecedor_criptografado VARBINARY(MAX) NULL,
        observacoes VARCHAR(500),

        -- Controle
        ativo BIT NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME NULL,
        created_by INT NULL,

        -- Constraints
        CONSTRAINT FK_Produtos_Categoria FOREIGN KEY (categoria_id)
            REFERENCES Categorias(id),
        CONSTRAINT FK_Produtos_Fornecedor FOREIGN KEY (fornecedor_id)
            REFERENCES Fornecedores(id),
        CONSTRAINT FK_Produtos_Usuario FOREIGN KEY (created_by)
            REFERENCES Usuarios(id),
        CONSTRAINT CK_Produtos_Quantidade CHECK (quantidade >= 0),
        CONSTRAINT CK_Produtos_Preco CHECK (preco >= 0)
    );

    CREATE INDEX idx_produtos_codigo ON Produtos(codigo);
    CREATE INDEX idx_produtos_nome ON Produtos(nome);
    CREATE INDEX idx_produtos_categoria ON Produtos(categoria);
    CREATE INDEX idx_produtos_fornecedor ON Produtos(fornecedor_id);
    CREATE INDEX idx_produtos_ativo ON Produtos(ativo);
END
GO

-- ============================================================
--  TABELA: Movimentacoes (Aula 15 - modelo alternativo)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Movimentacoes')
BEGIN
    CREATE TABLE Movimentacoes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        produto_id INT NOT NULL,
        tipo VARCHAR(10) NOT NULL,  -- 'entrada' ou 'saida'
        quantidade INT NOT NULL,
        motivo VARCHAR(500),
        usuario VARCHAR(100),
        usuario_id INT NULL,
        valor_unitario DECIMAL(10,2),
        valor_total DECIMAL(10,2),
        data_movimento DATETIME DEFAULT GETDATE(),
        observacoes VARCHAR(500),

        CONSTRAINT FK_Movimentacoes_Produto FOREIGN KEY (produto_id)
            REFERENCES Produtos(id),
        CONSTRAINT FK_Movimentacoes_Usuario FOREIGN KEY (usuario_id)
            REFERENCES Usuarios(id),
        CONSTRAINT CK_Movimentacoes_Tipo CHECK (tipo IN ('entrada', 'saida', 'ajuste', 'devolucao')),
        CONSTRAINT CK_Movimentacoes_Quantidade CHECK (quantidade > 0)
    );

    CREATE INDEX idx_movimentacoes_produto ON Movimentacoes(produto_id);
    CREATE INDEX idx_movimentacoes_tipo ON Movimentacoes(tipo);
    CREATE INDEX idx_movimentacoes_data ON Movimentacoes(data_movimento DESC);
    CREATE INDEX idx_movimentacoes_usuario ON Movimentacoes(usuario_id);
END
GO

-- ============================================================
--  TABELA: Alertas de Estoque (Aula 15)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AlertasEstoque')
BEGIN
    CREATE TABLE AlertasEstoque (
        id INT IDENTITY(1,1) PRIMARY KEY,
        produto_id INT NOT NULL,
        quantidade_atual INT NOT NULL,
        estoque_minimo INT NOT NULL,
        nivel VARCHAR(20) DEFAULT 'baixo', -- baixo | critico | zerado
        resolvido BIT DEFAULT 0,
        data_alerta DATETIME DEFAULT GETDATE(),
        data_resolucao DATETIME NULL,
        resolvido_por INT NULL,

        CONSTRAINT FK_Alertas_Produto FOREIGN KEY (produto_id)
            REFERENCES Produtos(id),
        CONSTRAINT FK_Alertas_Usuario FOREIGN KEY (resolvido_por)
            REFERENCES Usuarios(id)
    );

    CREATE INDEX idx_alertas_resolvido ON AlertasEstoque(resolvido);
    CREATE INDEX idx_alertas_data ON AlertasEstoque(data_alerta DESC);
END
GO

-- ============================================================
--  TABELA: Auditoria (Aula 14 - Segurança)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Auditoria')
BEGIN
    CREATE TABLE Auditoria (
        id INT IDENTITY(1,1) PRIMARY KEY,
        tabela_afetada VARCHAR(100) NOT NULL,
        registro_id INT,
        operacao VARCHAR(10) NOT NULL, -- INSERT | UPDATE | DELETE
        dados_antigos NVARCHAR(MAX),
        dados_novos NVARCHAR(MAX),
        usuario VARCHAR(100),
        ip_origem VARCHAR(50),
        data_operacao DATETIME DEFAULT GETDATE()
    );

    CREATE INDEX idx_auditoria_tabela ON Auditoria(tabela_afetada);
    CREATE INDEX idx_auditoria_data ON Auditoria(data_operacao DESC);
END
GO

-- ============================================================
--  TABELA: Backups (controle - Aula 14)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Backups')
BEGIN
    CREATE TABLE Backups (
        id INT IDENTITY(1,1) PRIMARY KEY,
        tipo VARCHAR(50) NOT NULL,     -- full | differential | log | logical
        banco VARCHAR(100) NOT NULL,
        arquivo VARCHAR(500) NOT NULL,
        tamanho_mb DECIMAL(10,2),
        status VARCHAR(20) DEFAULT 'concluido',
        iniciado_em DATETIME DEFAULT GETDATE(),
        concluido_em DATETIME NULL,
        executado_por VARCHAR(100)
    );
END
GO

-- ============================================================
--  VIEWS (Aula 14 - Snapshot de views)
-- ============================================================

-- View: Resumo de estoque por categoria
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_EstoqueResumo')
    DROP VIEW vw_EstoqueResumo;
GO
CREATE VIEW vw_EstoqueResumo AS
SELECT
    ISNULL(categoria, 'Sem categoria') AS categoria,
    COUNT(*) AS total_itens,
    SUM(quantidade) AS estoque_total,
    AVG(preco) AS preco_medio,
    SUM(preco * quantidade) AS valor_total_estoque,
    SUM(CASE WHEN quantidade <= estoque_minimo THEN 1 ELSE 0 END) AS itens_estoque_baixo
FROM Produtos
WHERE ativo = 1
GROUP BY categoria;
GO

-- View: Produtos com estoque baixo
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_EstoqueBaixo')
    DROP VIEW vw_EstoqueBaixo;
GO
CREATE VIEW vw_EstoqueBaixo AS
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
FROM Produtos p
WHERE p.ativo = 1
  AND p.quantidade <= p.estoque_minimo;
GO

-- View: Movimentações dos últimos 30 dias
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_MovimentacoesRecentes')
    DROP VIEW vw_MovimentacoesRecentes;
GO
CREATE VIEW vw_MovimentacoesRecentes AS
SELECT
    m.id, m.tipo, m.quantidade, m.motivo, m.usuario, m.data_movimento,
    p.codigo AS produto_codigo, p.nome AS produto_nome, p.categoria,
    m.valor_total,
    u.nome AS usuario_nome
FROM Movimentacoes m
INNER JOIN Produtos p ON m.produto_id = p.id
LEFT JOIN Usuarios u ON m.usuario_id = u.id
WHERE m.data_movimento >= DATEADD(DAY, -30, GETDATE());
GO

-- View: Valor total em estoque
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_ValorTotalEstoque')
    DROP VIEW vw_ValorTotalEstoque;
GO
CREATE VIEW vw_ValorTotalEstoque AS
SELECT
    COUNT(*) AS total_produtos,
    SUM(quantidade) AS total_unidades,
    SUM(preco * quantidade) AS valor_vareja,
    SUM(custo * quantidade) AS valor_custo,
    SUM((preco - custo) * quantidade) AS margem_potencial
FROM Produtos
WHERE ativo = 1;
GO

-- ============================================================
--  TRIGGERS (Aula 14 - Auditoria automática)
-- ============================================================

-- Trigger de auditoria para Produtos
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_Produtos_Audit')
    DROP TRIGGER trg_Produtos_Audit;
GO
CREATE TRIGGER trg_Produtos_Audit
ON Produtos
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- Captura UPDATE
    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
    BEGIN
        INSERT INTO Auditoria (tabela_afetada, registro_id, operacao, dados_novos, data_operacao)
        SELECT
            'Produtos',
            i.id,
            'UPDATE',
            (SELECT i.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            GETDATE()
        FROM inserted i;
    END

    -- Captura DELETE
    IF EXISTS (SELECT * FROM deleted) AND NOT EXISTS (SELECT * FROM inserted)
    BEGIN
        INSERT INTO Auditoria (tabela_afetada, registro_id, operacao, dados_antigos, data_operacao)
        SELECT
            'Produtos',
            d.id,
            'DELETE',
            (SELECT d.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            GETDATE()
        FROM deleted d;
    END
END;
GO

-- Trigger para registrar alerta automático quando estoque fica baixo
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_Produtos_AlertaEstoque')
    DROP TRIGGER trg_Produtos_AlertaEstoque;
GO
CREATE TRIGGER trg_Produtos_AlertaEstoque
ON Produtos
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO AlertasEstoque (produto_id, quantidade_atual, estoque_minimo, nivel, data_alerta)
    SELECT
        i.id,
        i.quantidade,
        i.estoque_minimo,
        CASE
            WHEN i.quantidade = 0 THEN 'zerado'
            WHEN i.quantidade <= i.estoque_minimo / 2 THEN 'critico'
            ELSE 'baixo'
        END,
        GETDATE()
    FROM inserted i
    WHERE i.quantidade <= i.estoque_minimo
      AND i.ativo = 1;
END;
GO

-- ============================================================
--  STORED PROCEDURES (utilitárias)
-- ============================================================

-- Procedure: Registrar entrada de produto
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_RegistrarEntrada')
    DROP PROCEDURE sp_RegistrarEntrada;
GO
CREATE PROCEDURE sp_RegistrarEntrada
    @produto_id INT,
    @quantidade INT,
    @motivo VARCHAR(500) = NULL,
    @usuario VARCHAR(100) = NULL,
    @usuario_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Atualiza estoque
        UPDATE Produtos
        SET quantidade = quantidade + @quantidade,
            updated_at = GETDATE()
        WHERE id = @produto_id AND ativo = 1;

        -- Registra movimentação
        INSERT INTO Movimentacoes (produto_id, tipo, quantidade, motivo, usuario, usuario_id, data_movimento)
        VALUES (@produto_id, 'entrada', @quantidade, @motivo, @usuario, @usuario_id, GETDATE());

        -- Se havia alerta, marca como resolvido
        UPDATE AlertasEstoque
        SET resolvido = 1, data_resolucao = GETDATE(), resolvido_por = @usuario_id
        WHERE produto_id = @produto_id AND resolvido = 0;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Procedure: Registrar saída de produto
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_RegistrarSaida')
    DROP PROCEDURE sp_RegistrarSaida;
GO
CREATE PROCEDURE sp_RegistrarSaida
    @produto_id INT,
    @quantidade INT,
    @motivo VARCHAR(500) = NULL,
    @usuario VARCHAR(100) = NULL,
    @usuario_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @estoque_atual INT;

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @estoque_atual = quantidade
        FROM Produtos
        WHERE id = @produto_id AND ativo = 1;

        IF @estoque_atual IS NULL
            THROW 50001, 'Produto não encontrado', 1;

        IF @estoque_atual < @quantidade
            THROW 50002, 'Estoque insuficiente', 1;

        UPDATE Produtos
        SET quantidade = quantidade - @quantidade,
            updated_at = GETDATE()
        WHERE id = @produto_id;

        INSERT INTO Movimentacoes (produto_id, tipo, quantidade, motivo, usuario, usuario_id, data_movimento)
        VALUES (@produto_id, 'saida', @quantidade, @motivo, @usuario, @usuario_id, GETDATE());

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- ============================================================
--  DADOS INICIAIS (seed)
-- ============================================================

-- Usuário admin padrão (senha: admin123 - bcrypt hash)
IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE login = 'admin')
BEGIN
    INSERT INTO Usuarios (login, senha_hash, nome, email, papel)
    VALUES (
        'admin',
        '$2b$10$XQxbMFrL5KZxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxKx', -- trocar pelo hash real
        'Administrador',
        'admin@estoque.com',
        'admin'
    );
END

-- Categorias padrão
INSERT INTO Categorias (nome, descricao)
SELECT nome, descricao FROM (VALUES
    ('Eletrônicos', 'Produtos eletrônicos em geral'),
    ('Alimentos', 'Produtos alimentícios'),
    ('Limpeza', 'Produtos de limpeza'),
    ('Papelaria', 'Material de escritório'),
    ('Vestuário', 'Roupas e acessórios')
) AS v(nome, descricao)
WHERE NOT EXISTS (SELECT 1 FROM Categorias c WHERE c.nome = v.nome);
GO

-- ============================================================
--  PERMISSÕES (Aula 14 - Segurança)
-- ============================================================

-- Cria role para aplicação
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'app_role')
BEGIN
    CREATE ROLE app_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO app_role;
    -- Não concede permissão em tabelas de segurança
    DENY SELECT, INSERT, UPDATE, DELETE ON Auditoria TO app_role;
END
GO

PRINT '✅ Script SQL Server executado com sucesso!';
GO