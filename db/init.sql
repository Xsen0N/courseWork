-- Создание таблицы Profession
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Profession')
BEGIN
    CREATE TABLE [Profession] (
        [ProfessionId] INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(100) NOT NULL,
        [Description] NVARCHAR(255) NULL
    );
END

-- Создание таблицы Master
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Master')
BEGIN
    CREATE TABLE [Master] (
        [MasterId] INT IDENTITY(1,1) PRIMARY KEY,
        [ProfessionId] INT NULL,
        [Name] NVARCHAR(100) NOT NULL,
        [Login] NVARCHAR(100) NOT NULL,
        [Password] NVARCHAR(60) NOT NULL,
        [Photo] VARBINARY(MAX) NULL,
        [Description] NVARCHAR(255) NULL,
        [PriceForHour] DECIMAL(10,2) NULL,
        FOREIGN KEY ([ProfessionId]) REFERENCES [Profession] ([ProfessionId])
    );
END

-- Создание таблицы Users
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE [Users] (
        [UserId] INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(100) NOT NULL,
        [Login] NVARCHAR(100) NOT NULL,
        [Password] NVARCHAR(60) NOT NULL,
        [Role] NVARCHAR(20) NOT NULL
    );
END

-- Создание таблицы RequestTypes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RequestTypes')
BEGIN
    CREATE TABLE [RequestTypes] (
        [TypeId] INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(100) NOT NULL,
        [Description] NVARCHAR(255) NULL
    );
END

-- Создание таблицы Requests
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Requests')
BEGIN
    CREATE TABLE [Requests] (
        [RequestId] INT IDENTITY(1,1) PRIMARY KEY,
        [UserId] INT NOT NULL,
        [TypeId] INT NOT NULL,
        [Date] DATETIME NOT NULL,
        [Location] NVARCHAR(255) NOT NULL,
        [Address] NVARCHAR(255) NOT NULL,
        [Comments] NVARCHAR(MAX) NULL,
        [Status] NVARCHAR(20) NOT NULL,
        [ServiceCount] INT NOT NULL DEFAULT 0,
        FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId]),
        FOREIGN KEY ([TypeId]) REFERENCES [RequestTypes] ([TypeId])
    );
END

-- Создание таблицы RequestProfession
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RequestProfession')
BEGIN
    CREATE TABLE [RequestProfession] (
        [RequestId] INT NOT NULL,
        [ProfessionId] INT NOT NULL,
        [required] INT NOT NULL DEFAULT 1,
        [approved] INT NOT NULL DEFAULT 0,
        [status] NVARCHAR(20) NOT NULL DEFAULT 'pending',
        PRIMARY KEY ([RequestId], [ProfessionId]),
        FOREIGN KEY ([RequestId]) REFERENCES [Requests] ([RequestId]),
        FOREIGN KEY ([ProfessionId]) REFERENCES [Profession] ([ProfessionId])
    );
END

-- Создание таблицы Criterias
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Criterias')
BEGIN
    CREATE TABLE [Criterias] (
        [CriteriasId] INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(100) NOT NULL,
        [Description] NVARCHAR(255) NULL
    );
END

-- Создание таблицы RequestCriterias
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RequestCriterias')
BEGIN
    CREATE TABLE [RequestCriterias] (
        [RequestId] INT NOT NULL,
        [CriteriasId] INT NOT NULL,
        PRIMARY KEY ([RequestId], [CriteriasId]),
        FOREIGN KEY ([RequestId]) REFERENCES [Requests] ([RequestId]),
        FOREIGN KEY ([CriteriasId]) REFERENCES [Criterias] ([CriteriasId])
    );
END

-- Создание таблицы ServiceResponses
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ServiceResponses')
BEGIN
    CREATE TABLE [ServiceResponses] (
        [ResponseId] INT IDENTITY(1,1) PRIMARY KEY,
        [RequestId] INT NOT NULL,
        [MasterId] INT NOT NULL,
        [ProfessionId] INT NOT NULL,
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'pending',
        [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY ([RequestId]) REFERENCES [Requests] ([RequestId]),
        FOREIGN KEY ([MasterId]) REFERENCES [Master] ([MasterId]),
        FOREIGN KEY ([ProfessionId]) REFERENCES [Profession] ([ProfessionId])
    );
END

-- Создание таблицы Notifications
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
BEGIN
    CREATE TABLE [Notifications] (
        [NotificationId] INT IDENTITY(1,1) PRIMARY KEY,
        [MasterId] INT NULL,
        [UserId] INT NULL,
        [Type] NVARCHAR(50) NOT NULL,
        [Message] NVARCHAR(255) NOT NULL,
        [Metadata] NVARCHAR(MAX) NULL,
        [isRead] BIT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY ([MasterId]) REFERENCES [Master] ([MasterId]),
        FOREIGN KEY ([UserId]) REFERENCES [Users] ([UserId])
    );
END 